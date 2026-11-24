import React, { useCallback, useEffect, useRef } from "react";
import { useWebHaptics } from "web-haptics/react";

// What the bars follow. rest: resting silhouette (or breathing while hovered).
// loading: tapped before the next clip arrived. live: the voice through an
// AnalyserNode. wave: a synthetic wave when Web Audio is unavailable.
type Phase = "rest" | "loading" | "live" | "wave";

// A clip fetched ahead of the tap. `buffer` is decoded already when Web Audio
// is available; `data` stays intact for the <audio> fallback.
type Clip = { voice: string; data: ArrayBuffer; buffer: AudioBuffer | null };
type Pending = { clip: Clip | null; promise: Promise<Clip | null>; controller: AbortController };

// Resting silhouette of the four bars, as a fraction of full height.
const REST = [0.42, 0.9, 0.62, 0.32];

// Bar geometry in CSS px. Width and gap are rounded to whole device pixels
// when drawn, so every bar paints the same number of pixels.
const BAR_WIDTH = 2;
const BAR_GAP = 2;
const BAR_HEIGHT = 14;
// Bars sit on the cap-height centre of the heading, not the line box.
const BAR_OFFSET = 0.5;
// The glow is 44px across and swells to 1.35x while loud; the canvas holds it all.
const GLOW_SIZE = 44;
const CANVAS_SIZE = 60;

// Frequency bins (fftSize 512, ~94 Hz per bin) each bar listens to, plus a
// gain to even out quieter high bands. The loudest low band drives the
// second bar so the live shape keeps the resting silhouette.
const BANDS: { from: number; to: number; gain: number }[] = [
  { from: 4, to: 9, gain: 1.1 },
  { from: 1, to: 4, gain: 0.85 },
  { from: 9, to: 20, gain: 1.25 },
  { from: 20, to: 42, gain: 1.6 },
];

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext || (window as any).webkitAudioContext || null;
}

// Older Safari only supports the callback form of decodeAudioData.
function decode(ctx: BaseAudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const result = ctx.decodeAudioData(data, resolve, reject);
    if (result && typeof result.then === "function") result.then(resolve, reject);
  });
}

// Before the first tap there is no AudioContext (creating one outside a
// gesture is blocked), so prefetched clips decode on an offline context.
let offlineDecoder: OfflineAudioContext | null = null;
function getDecoder(live: AudioContext | null): BaseAudioContext | null {
  if (live) return live;
  if (offlineDecoder) return offlineDecoder;
  const Ctor = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
  try {
    offlineDecoder = Ctor ? new Ctor(1, 1, 48000) : null;
  } catch {
    offlineDecoder = null;
  }
  return offlineDecoder;
}

// Critically damped spring step, exact for any dt, so heights and their
// velocity stay continuous whenever the target or stiffness changes.
function spring(x: number, v: number, target: number, omega: number, dt: number): [number, number] {
  const d = x - target;
  const k = v + omega * d;
  const e = Math.exp(-omega * dt);
  return [target + (d + k * dt) * e, (v - omega * k * dt) * e];
}

// 0 → 1 → 0 over one period, starting flat at 0 so a new motion picks up
// from rest without a kink.
function swell(seconds: number, period: number) {
  return 0.5 - 0.5 * Math.cos((2 * Math.PI * Math.max(0, seconds)) / period);
}

export default function NamePronunciation({ children }: { children: React.ReactNode }) {
  const { trigger } = useWebHaptics();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // CSS size of the canvas; its backing store is exactly this many device px.
  const canvasCssRef = useRef(CANVAS_SIZE);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const elementRef = useRef<HTMLAudioElement | null>(null);
  const nextRef = useRef<Pending | null>(null);
  const waitingRef = useRef<Pending | null>(null);
  const loadsRef = useRef(new Set<AbortController>());
  const lastVoiceRef = useRef("");
  const playIdRef = useRef(0);

  // Animation state, all outside React so motion never re-renders the page.
  const phaseRef = useRef<Phase>("rest");
  const phaseAtRef = useRef(0);
  const hoverRef = useRef(false);
  const hoverAtRef = useRef(0);
  const reduceRef = useRef(false);
  const frameRef = useRef(0);
  const motionRef = useRef({
    height: REST.slice(),
    velocity: REST.map(() => 0),
    glow: 0,
    glowVelocity: 0,
    glowScale: 0.6,
    glowScaleVelocity: 0,
    loudness: 0,
    last: 0,
  });
  const freqRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  // Paint the glow and bars. Bars start on a whole device pixel and step by a
  // whole number of device pixels, so all four always cover the same pixel
  // columns; only their height (the vertical edges) is fractional.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    const g = canvas?.getContext("2d");
    if (!canvas || !button || !g) return;
    const { width, height } = canvas;
    const scale = width / canvasCssRef.current;
    const m = motionRef.current;
    const style = getComputedStyle(button);
    g.clearRect(0, 0, width, height);

    const glow = Math.max(0, Math.min(1, m.glow));
    if (glow > 0.002) {
      const rgb = style.getPropertyValue("--np-glow").trim();
      const r = (GLOW_SIZE / 2) * m.glowScale * scale;
      const gradient = g.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, r);
      gradient.addColorStop(0, `rgba(${rgb}, 0.2)`);
      gradient.addColorStop(0.6, `rgba(${rgb}, 0.07)`);
      gradient.addColorStop(1, `rgba(${rgb}, 0)`);
      g.globalAlpha = glow;
      g.fillStyle = gradient;
      g.fillRect(0, 0, width, height);
      g.globalAlpha = 1;
    }

    const bar = Math.max(1, Math.round(BAR_WIDTH * scale));
    const gap = Math.max(1, Math.round(BAR_GAP * scale));
    const left = Math.round((width - (bar * REST.length + gap * (REST.length - 1))) / 2);
    const middle = height / 2 + BAR_OFFSET * scale;
    const radius = Math.min(bar / 2, scale);
    g.fillStyle = style.color;
    g.beginPath();
    m.height.forEach((h, i) => {
      const size = Math.max(bar, h * BAR_HEIGHT * scale);
      const x = left + i * (bar + gap);
      if (g.roundRect) g.roundRect(x, middle - size / 2, bar, size, radius);
      else g.rect(x, middle - size / 2, bar, size);
    });
    g.fill();
  }, []);

  // One loop drives every state: rest, hover breathing, loading, live audio,
  // the fallback wave and the settle back. Each frame picks a target height
  // per bar and springs toward it, so switching states never snaps.
  const tick = useCallback(function step(now: number) {
    const m = motionRef.current;
    const dt = Math.min(0.05, Math.max(0, (now - m.last) / 1000));
    m.last = now;
    const phase = phaseRef.current;
    const reduce = reduceRef.current;
    const since = (now - phaseAtRef.current) / 1000;
    const analyser = analyserRef.current;
    const speaking = phase === "live" || phase === "wave";

    let freq: Uint8Array<ArrayBuffer> | null = null;
    if (phase === "live" && !reduce && analyser) {
      if (!freqRef.current || freqRef.current.length !== analyser.frequencyBinCount) {
        freqRef.current = new Uint8Array(analyser.frequencyBinCount);
      }
      freq = freqRef.current;
      analyser.getByteFrequencyData(freq);
    }

    let total = 0;
    let settled = true;
    REST.forEach((rest, i) => {
      let target = rest;
      // Quick attack, slower release while speaking: reads as breath, not jitter.
      let omega = 9;
      if (reduce) {
        if (speaking) target = rest * 0.5 + 0.5;
        omega = 20;
      } else if (freq) {
        const { from, to, gain } = BANDS[i];
        let sum = 0;
        for (let bin = from; bin < to; bin++) sum += freq[bin];
        const level = Math.min(1, Math.pow(sum / (to - from) / 255, 1.8) * 1.3 * gain);
        total += level;
        target = 0.14 + level * 0.86;
        omega = target > m.height[i] ? 42 : 15;
      } else if (phase === "wave") {
        target = rest + (1 - rest * 1.6) * swell(since - i * 0.12, 0.76 + i * 0.11);
        omega = 16;
        total += 0.5;
      } else if (phase === "loading") {
        target = rest + (0.42 - rest * 0.45) * swell(since - i * 0.09, 1.3);
        omega = 14;
      } else if (hoverRef.current) {
        target = rest + (0.42 - rest * 0.45) * swell((now - hoverAtRef.current) / 1000 - i * 0.14, 2.2);
      }
      const [x, v] = spring(m.height[i], m.velocity[i], target, omega, dt);
      m.height[i] = x;
      m.velocity[i] = v;
      if (Math.abs(x - target) > 0.0005 || Math.abs(v) > 0.005) settled = false;
    });

    // Glow blooms quickly while speaking and fades slowly after.
    m.loudness += (total / REST.length - m.loudness) * Math.min(1, dt * 6);
    const glowTarget = speaking ? 1 : 0;
    [m.glow, m.glowVelocity] = spring(m.glow, m.glowVelocity, glowTarget, glowTarget ? 10 : 5, dt);
    const scaleTarget = speaking ? (reduce ? 1 : 0.8 + m.loudness * 0.55) : 0.6;
    [m.glowScale, m.glowScaleVelocity] = spring(m.glowScale, m.glowScaleVelocity, scaleTarget, 6, dt);
    if (Math.abs(m.glow - glowTarget) > 0.002 || Math.abs(m.glowScale - scaleTarget) > 0.002) settled = false;
    // The bar colour comes from CSS (hover, active, theme); keep painting
    // while it transitions.
    const button = buttonRef.current;
    if (button?.getAnimations?.().some((animation) => animation.playState === "running")) settled = false;
    draw();

    // Static targets reached: stop until the next state change wakes us.
    if (settled && (reduce || (phase === "rest" && !hoverRef.current))) {
      frameRef.current = 0;
      return;
    }
    frameRef.current = requestAnimationFrame(step);
  }, [draw]);

  const wake = useCallback(() => {
    if (frameRef.current) return;
    motionRef.current.last = performance.now();
    frameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const setPhase = useCallback(
    (phase: Phase) => {
      phaseRef.current = phase;
      phaseAtRef.current = performance.now();
      const button = buttonRef.current;
      if (button) {
        if (phase === "rest") delete button.dataset.active;
        else button.dataset.active = "";
      }
      wake();
    },
    [wake]
  );

  // Fetch a random voice other than `exclude`, decoded and ready to start.
  const load = useCallback((exclude: string): Pending => {
    const controller = new AbortController();
    loadsRef.current.add(controller);
    const pending: Pending = { clip: null, controller, promise: null };
    pending.promise = (async () => {
      try {
        const response = await fetch(`/api/pronunciation?exclude=${encodeURIComponent(exclude)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Pronunciation request failed: ${response.status}`);
        const voice = response.headers.get("X-Voice-Name") || "";
        const data = await response.arrayBuffer();
        let buffer: AudioBuffer | null = null;
        const decoder = getDecoder(ctxRef.current);
        if (decoder) {
          try {
            // decodeAudioData detaches its input; keep the original for the fallback.
            buffer = await decode(decoder, data.slice(0));
          } catch {}
        }
        pending.clip = { voice, data, buffer };
        return pending.clip;
      } catch {
        return null;
      } finally {
        loadsRef.current.delete(controller);
      }
    })();
    return pending;
  }, []);

  // Keep one non-repeating clip warm. Never blocks page load: called on idle,
  // on hover/focus/press, and right after a clip starts playing.
  const prefetch = useCallback(() => {
    if (nextRef.current) return;
    const pending = load(lastVoiceRef.current);
    nextRef.current = pending;
    pending.promise.then((clip) => {
      if (!clip && nextRef.current === pending) nextRef.current = null;
    });
  }, [load]);

  // Stop whatever is playing. Bars are left where they are; the loop eases them.
  const stopPlayback = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (elementRef.current) {
      elementRef.current.onended = elementRef.current.onerror = null;
      elementRef.current.pause();
      URL.revokeObjectURL(elementRef.current.src);
      elementRef.current = null;
    }
  }, []);

  const finish = useCallback(
    (id: number) => {
      if (id !== playIdRef.current) return;
      stopPlayback();
      setPhase("rest");
    },
    [setPhase, stopPlayback]
  );

  // Plain <audio> element, used when Web Audio is missing or stays blocked.
  const playElement = useCallback(
    (clip: Clip, id: number) => {
      const audio = new Audio(URL.createObjectURL(new Blob([clip.data], { type: "audio/mpeg" })));
      elementRef.current = audio;
      audio.onended = audio.onerror = () => finish(id);
      setPhase("wave");
      audio.play().catch(() => finish(id));
    },
    [finish, setPhase]
  );

  const start = useCallback(
    async (clip: Clip, id: number, resumed: Promise<void> | null) => {
      lastVoiceRef.current = clip.voice;
      // Warm the next voice now, excluding this one, so a second tap is instant too.
      prefetch();
      const ctx = ctxRef.current;
      const analyser = analyserRef.current;
      if (!ctx || !analyser) return playElement(clip, id);

      let buffer = clip.buffer;
      if (!buffer) {
        // Prefetch could not decode ahead (no decoder or it failed); try once more.
        try {
          buffer = await decode(ctx, clip.data.slice(0));
        } catch {
          if (id === playIdRef.current) playElement(clip, id);
          return;
        }
        if (id !== playIdRef.current) return;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(analyser);
      source.onended = () => finish(id);
      sourceRef.current = source;
      // Starts now, or the moment the context finishes resuming.
      source.start();
      setPhase("live");

      if (ctx.state === "running" || !resumed) return;
      await Promise.race([resumed, new Promise((resolve) => setTimeout(resolve, 1000))]);
      if (id !== playIdRef.current || (ctx.state as AudioContextState) === "running") return;
      // The context never unlocked: replay through the audio element instead.
      stopPlayback();
      playElement(clip, id);
    },
    [finish, playElement, prefetch, setPhase, stopPlayback]
  );

  // Create the context on the first press (pointerdown already counts as a
  // gesture in Chromium) so the click itself only has to start a source.
  const ensureContext = useCallback(() => {
    const Ctor = getAudioContextCtor();
    if (ctxRef.current || !Ctor) return;
    try {
      const ctx = new Ctor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.55;
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {}
  }, []);

  const play = useCallback(() => {
    trigger();
    stopPlayback();
    const id = ++playIdRef.current;

    // Create and resume the context inside the tap so mobile Safari unlocks it.
    ensureContext();
    const ctx = ctxRef.current;
    const resumed = ctx && ctx.state !== "running" ? ctx.resume().catch(() => {}) : null;

    // Rapid taps share the request an earlier tap is still waiting on.
    let pending = nextRef.current || waitingRef.current;
    nextRef.current = null;
    // Never repeat the voice that just played.
    if (!pending || pending.clip?.voice === lastVoiceRef.current) pending = load(lastVoiceRef.current);
    // Preloaded: start synchronously, inside the tap.
    if (pending.clip) {
      waitingRef.current = null;
      start(pending.clip, id, resumed);
      return;
    }
    // Tapped before the clip arrived: breathe faster until it does.
    waitingRef.current = pending;
    setPhase("loading");
    pending.promise.then((clip) => {
      if (waitingRef.current === pending) waitingRef.current = null;
      // A newer tap owns playback now; this one must not touch anything.
      if (id !== playIdRef.current) return;
      if (clip) start(clip, id, resumed);
      else finish(id);
    });
  }, [ensureContext, finish, load, setPhase, start, stopPlayback, trigger]);

  // Hover breathing for mouse and pen only: touch keeps :hover after a tap.
  const onPointerEnter = useCallback(
    (event: React.PointerEvent) => {
      prefetch();
      if (event.pointerType === "touch") return;
      hoverRef.current = true;
      hoverAtRef.current = performance.now();
      wake();
    },
    [prefetch, wake]
  );

  const onPointerDown = useCallback(() => {
    ensureContext();
    prefetch();
  }, [ensureContext, prefetch]);

  const onPointerLeave = useCallback(() => {
    hoverRef.current = false;
    wake();
  }, [wake]);

  // Size the canvas to a whole number of device pixels and give it a backing
  // store of exactly that many, so one canvas pixel is one screen pixel at any
  // DPR or zoom. DOM bars can't promise this: a transformed box is painted
  // without pixel snapping, so its edges spread over a different number of
  // pixels depending on where the heading text happens to end.
  useEffect(() => {
    const canvas = canvasRef.current;
    const button = buttonRef.current;
    if (!canvas || !button) return;
    let media: MediaQueryList | null = null;
    const resize = (width: number, height: number) => {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      draw();
    };
    // Where supported, the browser reports the exact device size it paints;
    // that always wins over our own DPR maths.
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(([entry]) => {
        const box = entry?.devicePixelContentBoxSize?.[0];
        if (box) resize(box.inlineSize, box.blockSize);
      });
      try {
        observer.observe(canvas, { box: "device-pixel-content-box" });
      } catch {
        observer.disconnect();
        observer = null;
      }
    }
    const fit = () => {
      const scale = window.devicePixelRatio * ((canvas as any).currentCSSZoom || 1);
      const device = Math.round(CANVAS_SIZE * scale);
      const css = device / scale;
      canvasCssRef.current = css;
      canvas.style.width = canvas.style.height = `${css}px`;
      canvas.style.margin = `${-css / 2}px 0 0 ${-css / 2}px`;
      if (observer) draw();
      else resize(device, device);
      // Moving between screens changes DPR without a resize event.
      media?.removeEventListener("change", fit);
      media = window.matchMedia?.(`(resolution: ${window.devicePixelRatio}dppx)`) || null;
      media?.addEventListener("change", fit);
    };
    fit();
    window.addEventListener("resize", fit);
    // Hover, focus, active and theme colours fade in CSS; repaint while they do.
    button.addEventListener("transitionrun", wake);
    return () => {
      window.removeEventListener("resize", fit);
      media?.removeEventListener("change", fit);
      observer?.disconnect();
      button.removeEventListener("transitionrun", wake);
    };
  }, [draw, wake]);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const update = () => {
      reduceRef.current = !!query?.matches;
      wake();
    };
    update();
    query?.addEventListener("change", update);
    return () => query?.removeEventListener("change", update);
  }, [wake]);

  // Warm the first clip once the page is idle, never during initial load.
  useEffect(() => {
    let idle = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      if ("requestIdleCallback" in window) idle = window.requestIdleCallback(prefetch, { timeout: 4000 });
      else timer = setTimeout(prefetch, 1500);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle) window.cancelIdleCallback(idle);
      clearTimeout(timer);
    };
  }, [prefetch]);

  useEffect(() => {
    const loads = loadsRef.current;
    const playId = playIdRef;
    return () => {
      playId.current++;
      stopPlayback();
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      loads.forEach((controller) => controller.abort());
      nextRef.current = waitingRef.current = null;
      ctxRef.current?.close().catch(() => {});
      ctxRef.current = null;
      analyserRef.current = null;
    };
  }, [stopPlayback]);

  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <button
        ref={buttonRef}
        type="button"
        onClick={play}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onFocus={prefetch}
        className="np"
        aria-label="Play name pronunciation"
        title="Hear how it's pronounced"
      >
        <canvas ref={canvasRef} className="bars" width={CANVAS_SIZE} height={CANVAS_SIZE} aria-hidden="true" />
      </button>
      <style jsx>{`
        .np {
          --np-rest: #a3a3a3;
          --np-hover: #737373;
          --np-active: #404040;
          --np-glow: 47, 107, 69;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          /* 28px tap target without growing the heading's line box. */
          margin: -2px 0;
          padding: 0;
          border: 0;
          background: none;
          color: var(--np-rest);
          cursor: pointer;
          outline: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          transition: color 500ms ease;
        }
        /* Bars and glow are painted on this canvas. JS sets its size and
           margins to whole device pixels; never transform it. */
        .bars {
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${CANVAS_SIZE}px;
          height: ${CANVAS_SIZE}px;
          margin: -${CANVAS_SIZE / 2}px 0 0 -${CANVAS_SIZE / 2}px;
          pointer-events: none;
        }
        /* Keyboard focus: a short hairline under the bars, no box. */
        .np::after {
          content: "";
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 2px;
          height: 1px;
          border-radius: 1px;
          background: currentColor;
          opacity: 0;
          transform: scaleX(0.3);
          transition:
            opacity 250ms ease,
            transform 350ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .np:focus-visible {
          color: var(--np-active);
        }
        .np:focus-visible::after {
          opacity: 0.6;
          transform: none;
        }
        .np:hover {
          color: var(--np-hover);
        }
        /* Touch screens keep :hover after a tap; don't leave the colour on. */
        @media (hover: none) and (pointer: coarse) {
          .np:hover {
            color: var(--np-rest);
          }
        }
        .np[data-active] {
          color: var(--np-active);
        }

        @media (prefers-color-scheme: dark) {
          .np {
            --np-rest: #6b6b6b;
            --np-hover: #a3a3a3;
            --np-active: #e5e5e5;
            --np-glow: 134, 205, 155;
          }
        }
      `}</style>
    </span>
  );
}
