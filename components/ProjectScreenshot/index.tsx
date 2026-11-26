import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface ProjectScreenshotProps {
  // Pre-sized, signed api.hem.so URL. Without it the static image is shown.
  src?: string;
  fallback: string;
  alt: string;
}

const className =
  "studio-screenshot-placeholder object-cover rounded-md border border-neutral-200 dark:border-zinc-800";

export function ProjectScreenshot({
  src,
  fallback,
  alt,
}: ProjectScreenshotProps) {
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // An image can fail before React attaches onError, so check once after hydration
  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) setFailed(true);
  }, []);

  // The API already sized the image, so it skips the Next.js optimizer
  if (src && !failed) {
    return (
      <Image
        ref={imageRef}
        unoptimized
        src={src}
        alt={alt}
        className={className}
        width={794}
        height={548}
        onError={() => setFailed(true)}
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
