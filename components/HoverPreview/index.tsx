import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import Image, { getImageProps } from 'next/image';
import { createPortal } from 'react-dom';

export type PreviewVariant = 'cover' | 'screenshot';

interface HoverPreviewProps {
  imageUrl?: string;
  // Used when imageUrl fails to load. imageUrl is then treated as already sized and skips the
  // Next.js optimizer, while the fallback still goes through it.
  fallbackImageUrl?: string;
  children: React.ReactNode;
  className?: string;
  variant?: PreviewVariant;
  // Fetch the image once the page is idle so the first hover opens instantly
  preload?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

type Phase = 'hidden' | 'open' | 'closing';

// Covers are portrait or square; landscape screenshots need more width to stay readable
const MAX_SIZES: Record<PreviewVariant, Size> = {
  cover: { width: 180, height: 200 },
  screenshot: { width: 260, height: 200 },
};
const CURSOR_OFFSET = 16;
const VIEWPORT_MARGIN = 12;
// Share of the remaining distance covered per 60fps frame
const FOLLOW_EASE = 0.3;
// Matches the exit transition in hover-preview.css
const EXIT_MS = 140;
// How long a live image may take before the static fallback replaces it
const LIVE_DEADLINE_MS = 3000;

// One shared portal container for every HoverPreview instance
let portalRoot: HTMLElement | null = null;
let portalUsers = 0;

function acquirePortalRoot(): HTMLElement {
  if (!portalRoot) {
    portalRoot = document.createElement('div');
    portalRoot.setAttribute('data-hover-preview-root', '');
    document.body.appendChild(portalRoot);
  }
  portalUsers += 1;
  return portalRoot;
}

function releasePortalRoot() {
  portalUsers -= 1;
  if (portalUsers <= 0 && portalRoot) {
    portalRoot.remove();
    portalRoot = null;
    portalUsers = 0;
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

// Place the card below-right of the cursor, flip to the other side near an edge,
// then clamp so it stays fully inside the viewport
function boundedPosition(pointer: Point, size: Size): Point {
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;

  let x = pointer.x + CURSOR_OFFSET;
  if (x + size.width > viewportWidth - VIEWPORT_MARGIN) {
    x = pointer.x - CURSOR_OFFSET - size.width;
  }

  let y = pointer.y + CURSOR_OFFSET;
  if (y + size.height > viewportHeight - VIEWPORT_MARGIN) {
    y = pointer.y - CURSOR_OFFSET - size.height;
  }

  return {
    x: clamp(x, VIEWPORT_MARGIN, viewportWidth - size.width - VIEWPORT_MARGIN),
    y: clamp(y, VIEWPORT_MARGIN, viewportHeight - size.height - VIEWPORT_MARGIN),
  };
}

export const HoverPreview: React.FC<HoverPreviewProps> = ({
  imageUrl: primaryImageUrl,
  fallbackImageUrl,
  children,
  className = '',
  variant = 'cover',
  preload = false,
}) => {
  const [phase, setPhase] = useState<Phase>('hidden');
  const [loaded, setLoaded] = useState(false);
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const imageUrl = primaryFailed && fallbackImageUrl ? fallbackImageUrl : primaryImageUrl;
  const unoptimized = Boolean(fallbackImageUrl) && !primaryFailed;
  const maxSize = MAX_SIZES[variant];
  const sizes = `${maxSize.width}px`;

  const cardRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<Point>({ x: 0, y: 0 });
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  // Last measured card size; falls back to the maximum until the image loads
  const sizeRef = useRef<Size>(maxSize);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef(0);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set when the image fails, so pointer moves do not request it again
  const failedRef = useRef(false);

  useEffect(() => {
    setPortalContainer(acquirePortalRoot());
    return releasePortalRoot;
  }, []);

  useEffect(() => {
    failedRef.current = false;
  }, [imageUrl]);

  useEffect(() => {
    setPrimaryFailed(false);
  }, [primaryImageUrl]);

  // Request the same optimized file the card's <Image> will pick, so hover hits the cache.
  // Devices without any hover-capable pointer never open the card, so they skip the download.
  useEffect(() => {
    if (!preload || !imageUrl || !window.matchMedia('(any-hover: hover)').matches) return;

    let idleId: number | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let stallId: ReturnType<typeof setTimeout> | null = null;

    const warm = () => {
      const { props } = getImageProps({ src: imageUrl, alt: '', width: 0, height: 0, sizes, unoptimized });
      const img = document.createElement('img');
      // sizes and srcset must be set before src so the browser picks the same candidate
      img.sizes = props.sizes ?? '';
      img.srcset = props.srcSet ?? '';
      img.src = props.src;
      img.decode().then(
        () => {
          if (stallId !== null) clearTimeout(stallId);
        },
        () => {}
      );
      // A live image that has not arrived by now is not coming soon; use the static one
      if (unoptimized) stallId = setTimeout(() => setPrimaryFailed(true), LIVE_DEADLINE_MS);
    };

    const schedule = () => {
      if ('requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(warm, { timeout: 2000 });
      } else {
        timeoutId = setTimeout(warm, 200);
      }
    };

    // An image requested before the load event delays it, so wait for load first
    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }

    return () => {
      window.removeEventListener('load', schedule);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (stallId !== null) clearTimeout(stallId);
    };
  }, [preload, imageUrl, sizes, unoptimized]);

  // Without a preload (or before it ran) the card waits for the live image at most LIVE_DEADLINE_MS
  useEffect(() => {
    if (phase === 'hidden' || loaded || !unoptimized) return;
    const timer = setTimeout(() => setPrimaryFailed(true), LIVE_DEADLINE_MS);
    return () => clearTimeout(timer);
  }, [phase, loaded, unoptimized]);

  const applyTransform = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      const { x, y } = currentRef.current;
      card.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  }, []);

  const stopFollowing = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastFrameTimeRef.current = 0;
  }, []);

  const followPointer = useCallback(() => {
    targetRef.current = boundedPosition(pointerRef.current, sizeRef.current);

    if (prefersReducedMotion()) {
      currentRef.current = { ...targetRef.current };
      applyTransform();
      return;
    }
    if (frameRef.current !== null) return;

    // Ease the card toward the latest target, frame-rate independent
    const step = (time: number) => {
      const elapsed = lastFrameTimeRef.current ? Math.min(time - lastFrameTimeRef.current, 64) : 16.7;
      lastFrameTimeRef.current = time;

      const target = targetRef.current;
      const current = currentRef.current;
      const ease = 1 - Math.pow(1 - FOLLOW_EASE, elapsed / 16.7);
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;

      if (Math.abs(target.x - current.x) < 0.1 && Math.abs(target.y - current.y) < 0.1) {
        currentRef.current = { ...target };
        applyTransform();
        frameRef.current = null;
        lastFrameTimeRef.current = 0;
        return;
      }

      applyTransform();
      frameRef.current = requestAnimationFrame(step);
    };
    frameRef.current = requestAnimationFrame(step);
  }, [applyTransform]);

  const close = useCallback(() => {
    setPhase((previous) => (previous === 'open' ? 'closing' : previous));
  }, []);

  const open = useCallback((e: React.PointerEvent) => {
    // Touch taps have no hover; a card opened by one would stay stuck
    if (!imageUrl || failedRef.current || e.pointerType === 'touch') return;

    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }

    // Start at the bounded cursor position so the card never flashes at (0, 0)
    pointerRef.current = { x: e.clientX, y: e.clientY };
    targetRef.current = boundedPosition(pointerRef.current, sizeRef.current);
    currentRef.current = { ...targetRef.current };
    stopFollowing();
    applyTransform();
    setPhase('open');
  }, [imageUrl, stopFollowing, applyTransform]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    // Scroll and blur close the card while the pointer stays on the link, and no new
    // pointerenter follows, so the next move inside the link has to reopen it
    if (phase !== 'open') {
      open(e);
      return;
    }
    pointerRef.current = { x: e.clientX, y: e.clientY };
    followPointer();
  }, [phase, open, followPointer]);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    close();
  }, [close]);

  // Place the card before the browser paints it
  useLayoutEffect(() => {
    if (phase !== 'hidden') applyTransform();
  }, [phase, applyTransform]);

  // Unmount after the exit transition finishes
  useEffect(() => {
    if (phase !== 'closing') return;
    exitTimerRef.current = setTimeout(() => {
      exitTimerRef.current = null;
      stopFollowing();
      setLoaded(false);
      setPhase('hidden');
    }, prefersReducedMotion() ? 0 : EXIT_MS);
    return () => {
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, [phase, stopFollowing]);

  // A fixed card would drift away from its link on scroll, so close it
  useEffect(() => {
    if (phase !== 'open') return;
    window.addEventListener('scroll', close, { passive: true, capture: true });
    window.addEventListener('blur', close);
    return () => {
      window.removeEventListener('scroll', close, { capture: true });
      window.removeEventListener('blur', close);
    };
  }, [phase, close]);

  useEffect(() => stopFollowing, [stopFollowing]);

  const handleImageLoad = useCallback(() => {
    const card = cardRef.current;
    if (card) {
      // Reading the size also commits the hidden style, so the entry transition runs
      sizeRef.current = { width: card.offsetWidth, height: card.offsetHeight };
      targetRef.current = boundedPosition(pointerRef.current, sizeRef.current);
      currentRef.current = { ...targetRef.current };
      applyTransform();
    }
    setLoaded(true);
  }, [applyTransform]);

  const handleImageError = useCallback(() => {
    // Try the fallback once before giving up; the card stays open while it loads
    if (fallbackImageUrl && !primaryFailed) {
      setPrimaryFailed(true);
      return;
    }
    failedRef.current = true;
    stopFollowing();
    setLoaded(false);
    setPhase('hidden');
  }, [stopFollowing, fallbackImageUrl, primaryFailed]);

  // If no image URL is provided, just render children as is
  if (!imageUrl) {
    return <>{children}</>;
  }

  return (
    <span
      className={`hover-preview-trigger ${className}`}
      onPointerEnter={open}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
      {phase !== 'hidden' && portalContainer && createPortal(
        <div
          ref={cardRef}
          className="hover-preview-card"
          data-state={phase === 'open' && loaded ? 'open' : 'closed'}
          aria-hidden="true"
        >
          <div className="hover-preview-frame">
            <Image
              src={imageUrl}
              unoptimized={unoptimized}
              alt=""
              width={0}
              height={0}
              sizes={sizes}
              loading="eager"
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: `${maxSize.width}px`,
                maxHeight: `${maxSize.height}px`,
                display: 'block',
              }}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        </div>,
        portalContainer
      )}
    </span>
  );
};
