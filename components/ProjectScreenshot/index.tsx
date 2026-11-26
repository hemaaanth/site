import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ProjectScreenshotProps {
  // Pre-sized, signed api.hem.so URL. Without it the static image is shown.
  src?: string;
  fallback: string;
  // Small plain-file copy of the fallback. A stalled live image swaps to it at once; the
  // optimizer would need a cold render first.
  still?: string;
  alt: string;
}

// How long a visible card waits for the live image before it shows the static one
const LIVE_DEADLINE_MS = 3000;

const className =
  "studio-screenshot-placeholder object-cover rounded-md border border-neutral-200 dark:border-zinc-800";

export function ProjectScreenshot({
  src,
  fallback,
  still,
  alt,
}: ProjectScreenshotProps) {
  // Keyed by src, so a new signed URL after ISR gets a fresh attempt
  const [result, setResult] = useState<{
    src?: string;
    status: "loaded" | "failed";
  }>();
  const status = result && result.src === src ? result.status : "pending";
  const imageRef = useRef<HTMLImageElement>(null);

  // The image can finish or fail before React attaches its handlers, so check once after hydration.
  // Otherwise a stalled image gets LIVE_DEADLINE_MS from the moment it scrolls into view. Both
  // images share the same box (fixed aspect ratio), so the swap never shifts the layout.
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    if (image.complete) {
      setResult({ src, status: image.naturalWidth > 0 ? "loaded" : "failed" });
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const startDeadline = () => {
      timer = setTimeout(
        () =>
          setResult((current) =>
            current?.src === src ? current : { src, status: "failed" },
          ),
        LIVE_DEADLINE_MS,
      );
    };
    if (!("IntersectionObserver" in window)) {
      startDeadline();
      return () => clearTimeout(timer);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      startDeadline();
    });
    observer.observe(image);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [src]);

  // The API already sized the image, so it skips the Next.js optimizer
  if (src && status !== "failed") {
    return (
      <Image
        ref={imageRef}
        unoptimized
        src={src}
        alt={alt}
        className={className}
        width={794}
        height={548}
        onLoad={() => setResult({ src, status: "loaded" })}
        onError={() => setResult({ src, status: "failed" })}
      />
    );
  }

  if (src && still) {
    return (
      <Image
        unoptimized
        src={still}
        alt={alt}
        className={className}
        width={794}
        height={548}
      />
    );
  }

  return (
    <Image
      src={fallback}
      alt={alt}
      className={className}
      width={794}
      height={548}
    />
  );
}
