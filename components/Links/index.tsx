import Link from "next/link";
import { useState } from "react";
import { ExternalIcon, ShareIcon } from "../Icons";
import { Tooltip } from "../Tooltip";
import useCopy from "@react-hook/copy";
import { HoverPreview } from "../HoverPreview";

interface LinkExternalProps {
  href: string;
  children: React.ReactNode;
  imageUrl?: string;
}

export function LinkExternal({ href, children, imageUrl }: LinkExternalProps) {
  return (
    <HoverPreview imageUrl={imageUrl}>
      <a
        className="link link-external"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}

        <ExternalIcon size={16} />
      </a>
    </HoverPreview>
  );
}

export function LinkShare({ title, url, children }) {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const { copy } = useCopy(url);

  const onClick = async () => {
    if (navigator.share) {
      navigator
        .share({
          title,
          url,
        })
        .catch(console.error);
    } else {
      await copy();
      setTooltipOpen(true);

      setTimeout(() => {
        setTooltipOpen(false);
      }, 1000);
    }
  };

  return (
    <div className="relative">
      <Tooltip open={tooltipOpen}>Link copied!</Tooltip>
      <button className="link-share" onClick={onClick}>
        <ShareIcon size={16} />

        {children}
      </button>
    </div>
  );
}
