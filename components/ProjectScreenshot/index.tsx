import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ProjectScreenshotProps {
  // Pre-sized, signed api.hem.so URL. Without it the static image is shown.
  src?: string;
  fallback: string;
  alt: string;
}

// How long a visible card waits for the live image before it shows the static one
const LIVE_DEADLINE_MS = 3000;

const className =
  "studio-screenshot-placeholder object-cover rounded-md border border-neutral-200 dark:border-zinc-800";

export function ProjectScreenshot({
  src,
  fallback,
  alt,
}: ProjectScreenshotProps) {
  const [status, setStatus] = useState<"pending" | "loaded" | "failed">(
    "pending",
  );
  const imageRef = useRef<HTMLImageElement>(null);

  // The image can finish or fail before React attaches its handlers, so check once after hydration.
  // Otherwise a stalled image gets LIVE_DEADLINE_MS from the moment it scrolls into view. Both
  // images share the same box (fixed aspect ratio), so the swap never shifts the layout.
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;
    if (image.complete) {
      setStatus(image.naturalWidth > 0 ? "loaded" : "failed");
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const startDeadline = () => {
      timer = setTimeout(
        () => setStatus((current) => (current === "pending" ? "failed" : current)),
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
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("failed")}
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
