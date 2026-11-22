import React, { useCallback, useEffect, useRef, useState } from "react";
import { useWebHaptics } from "web-haptics/react";

// idle: resting bars. live: bars follow the voice through an AnalyserNode.
// wave: CSS wave when Web Audio is unavailable or blocked.
// still: speaking under prefers-reduced-motion (raised bars + glow, no motion).
// loading: tapped, audio still on its way; bars breathe as instant feedback.
type Mode = "idle" | "loading" | "live" | "wave" | "still";

// Resting silhouette of the four bars, as a fraction of full height.
const REST = [0.42, 0.9, 0.62, 0.32];

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
function decode(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const result = ctx.decodeAudioData(data, resolve, reject);
    if (result && typeof result.then === "function") result.then(resolve, reject);
  });
}

export default function NamePronunciation({ children }: { children: React.ReactNode }) {
  const { trigger } = useWebHaptics();
  const [mode, setMode] = useState<Mode>("idle");
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const glowRef = useRef<HTMLSpanElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const elementRef = useRef<HTMLAudioElement | null>(null);
  const frameRef = useRef(0);
  const lastVoiceRef = useRef("");
  const playIdRef = useRef(0);
  const fetchRef = useRef<AbortController | null>(null);

  // Stop whatever is playing and hand the bars back to CSS, which eases them
  // to rest. Also aborts an in-flight request from an earlier click.
  const stop = useCallback(() => {
    fetchRef.current?.abort();
    fetchRef.current = null;
    cancelAnimationFrame(frameRef.current);
    if (sourceRef.current) {
      sourceRef.current.onended = null;
      try {
        sourceRef.current.stop();
      } catch {}
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current?.disconnect();
    analyserRef.current = null;
    if (elementRef.current) {
      elementRef.current.onended = elementRef.current.onerror = null;
      elementRef.current.pause();
      URL.revokeObjectURL(elementRef.current.src);
      elementRef.current = null;
    }
    barsRef.current.forEach((bar) => {
      if (bar) bar.style.transform = "";
    });
    if (glowRef.current) glowRef.current.style.transform = "";
  }, []);

  const finish = useCallback(
    (id: number) => {
      if (id !== playIdRef.current) return;
      stop();
      setMode("idle");
    },
    [stop]
  );

  // Drive the bars and glow straight from the analyser, outside React, so
  // playback never re-renders the page.
  const animate = useCallback((analyser: AnalyserNode, id: number) => {
    const freq = new Uint8Array(analyser.frequencyBinCount);
    const current = REST.map((rest) => rest * 0.5);
    let glow = 0;
    const tick = () => {
      if (id !== playIdRef.current) return;
      analyser.getByteFrequencyData(freq);
      let total = 0;
      BANDS.forEach(({ from, to, gain }, i) => {
        let sum = 0;
        for (let bin = from; bin < to; bin++) sum += freq[bin];
        const level = Math.min(1, Math.pow(sum / (to - from) / 255, 1.8) * 1.3 * gain);
        const target = 0.14 + level * 0.86;
        // Quick attack, slower release: reads as breath rather than jitter.
        current[i] += (target - current[i]) * (target > current[i] ? 0.5 : 0.16);
        total += level;
        const bar = barsRef.current[i];
        if (bar) bar.style.transform = `scaleY(${current[i].toFixed(3)})`;
      });
      glow += (total / BANDS.length - glow) * 0.1;
      if (glowRef.current) glowRef.current.style.transform = `scale(${(0.8 + glow * 0.55).toFixed(3)})`;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(async () => {
    trigger();
    stop();
    const id = ++playIdRef.current;
    setMode("loading");
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    // Create and resume the context inside the tap so mobile Safari unlocks it.
    const Ctor = getAudioContextCtor();
    let ctx = ctxRef.current;
    if (!ctx && Ctor) {
      try {
        ctx = ctxRef.current = new Ctor();
      } catch {
        ctx = null;
      }
    }
    const resumed = ctx && ctx.state !== "running" ? ctx.resume().catch(() => {}) : null;

    const controller = new AbortController();
    fetchRef.current = controller;
    let data: ArrayBuffer;
    let voice: string;
    try {
      const response = await fetch(
        `/api/pronunciation?exclude=${encodeURIComponent(lastVoiceRef.current)}`,
        { cache: "no-store", signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Pronunciation request failed: ${response.status}`);
      voice = response.headers.get("X-Voice-Name") || "";
      data = await response.arrayBuffer();
    } catch {
      finish(id);
      return;
    }
    // A newer click owns playback now; this response must not touch anything.
    if (id !== playIdRef.current) return;
    fetchRef.current = null;
    lastVoiceRef.current = voice;

    if (ctx) {
      try {
        await Promise.race([resumed, new Promise((resolve) => setTimeout(resolve, 1000))]);
        if (ctx.state !== "running") throw new Error("AudioContext blocked");
        // decodeAudioData detaches its input; keep the original for the fallback.
        const buffer = await decode(ctx, data.slice(0));
        if (id !== playIdRef.current) return;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.55;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        source.onended = () => finish(id);
        sourceRef.current = source;
        analyserRef.current = analyser;
        source.start();
        setMode(reduceMotion ? "still" : "live");
        if (!reduceMotion) animate(analyser, id);
        return;
      } catch {
        if (id !== playIdRef.current) return;
      }
    }

    // Fallback: plain audio element with a CSS wave.
    const audio = new Audio(URL.createObjectURL(new Blob([data], { type: "audio/mpeg" })));
    elementRef.current = audio;
    audio.onended = audio.onerror = () => finish(id);
    try {
      await audio.play();
      if (id === playIdRef.current) setMode(reduceMotion ? "still" : "wave");
    } catch {
      finish(id);
    }
  }, [animate, finish, stop, trigger]);

  useEffect(
    () => () => {
      playIdRef.current++;
      stop();
      ctxRef.current?.close().catch(() => {});
    },
    [stop]
  );

  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <button
        type="button"
        onClick={play}
        className="np"
        data-mode={mode}
        aria-label="Play name pronunciation"
        title="Hear how it's pronounced"
      >
        <span ref={glowRef} className="glow" aria-hidden="true" />
        <span className="bars" aria-hidden="true">
          {REST.map((rest, i) => (
            <span
              key={i}
              ref={(el) => {
                barsRef.current[i] = el;
              }}
              className="bar"
              style={{ "--rest": rest, "--i": i } as React.CSSProperties}
            />
          ))}
        </span>
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
        .bars {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 2.5px;
          height: 14px;
          /* Sit on the cap-height centre of the heading, not the line box. */
          transform: translateY(0.5px);
        }
        .bar {
          display: block;
          width: 1.5px;
          height: 100%;
          border-radius: 1px;
          background: currentColor;
          transform: scaleY(var(--rest));
          transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 44px;
          height: 44px;
          margin: -22px 0 0 -22px;
          border-radius: 50%;
          background: radial-gradient(
            closest-side,
            rgba(var(--np-glow), 0.2),
            rgba(var(--np-glow), 0.07) 60%,
            rgba(var(--np-glow), 0)
          );
          opacity: 0;
          transform: scale(0.6);
          transition:
            opacity 900ms ease,
            transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
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

        .np[data-mode="idle"]:hover {
          color: var(--np-hover);
        }
        .np[data-mode="idle"]:hover .bar {
          animation: np-breathe 2.2s ease-in-out infinite;
          animation-delay: calc(var(--i) * 140ms);
        }
        /* Touch screens keep :hover after a tap; don't leave the bars breathing. */
        @media (hover: none) and (pointer: coarse) {
          .np[data-mode="idle"]:hover {
            color: var(--np-rest);
          }
          .np[data-mode="idle"]:hover .bar {
            animation: none;
          }
        }

        .np:not([data-mode="idle"]) {
          color: var(--np-active);
        }
        .np:not([data-mode="idle"]):not([data-mode="loading"]) .glow {
          opacity: 1;
          transform: scale(1);
        }
        /* JS writes transforms every frame while live. */
        .np[data-mode="live"] .bar {
          transition: none;
        }
        /* Clips are ~1s: bloom quickly, then settle slowly (idle's 900ms). */
        .np[data-mode="live"] .glow {
          transition: opacity 450ms ease;
        }
        .np[data-mode="loading"] .bar {
          animation: np-breathe 1.3s ease-in-out infinite;
          animation-delay: calc(var(--i) * 90ms);
        }
        .np[data-mode="wave"] .bar {
          animation: np-wave calc(760ms + var(--i) * 110ms) ease-in-out infinite;
          animation-delay: calc(var(--i) * 120ms);
        }
        .np[data-mode="still"] .bar {
          transform: scaleY(calc(var(--rest) * 0.5 + 0.5));
        }

        @keyframes np-breathe {
          0%,
          100% {
            transform: scaleY(var(--rest));
          }
          40% {
            transform: scaleY(calc(var(--rest) * 0.55 + 0.42));
          }
          70% {
            transform: scaleY(calc(var(--rest) * 0.8));
          }
        }
        @keyframes np-wave {
          0%,
          100% {
            transform: scaleY(var(--rest));
          }
          50% {
            transform: scaleY(calc(1 - var(--rest) * 0.6));
          }
        }

        @media (prefers-color-scheme: dark) {
          .np {
            --np-rest: #6b6b6b;
            --np-hover: #a3a3a3;
            --np-active: #e5e5e5;
            --np-glow: 134, 205, 155;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .np .bar,
          .np[data-mode="idle"]:hover .bar,
          .np[data-mode="loading"] .bar,
          .np[data-mode="wave"] .bar {
            animation: none;
            transition-duration: 200ms;
          }
          .np[data-mode="wave"] .bar {
            transform: scaleY(calc(var(--rest) * 0.5 + 0.5));
          }
        }
      `}</style>
    </span>
  );
}
