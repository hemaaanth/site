import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface HoverNoteProps {
  children: React.ReactNode;
}

export const HoverNote: React.FC<HoverNoteProps> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0, placement: 'top' as 'top' | 'bottom' });
  const [isMobile, setIsMobile] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const uniqueId = useRef(`hovernote-${Math.random().toString(36).substr(2, 9)}`);

  // Create portal container on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.setAttribute('id', 'hover-note-portal');
      document.body.appendChild(container);
      setPortalContainer(container);

      return () => {
        document.body.removeChild(container);
      };
    }
  }, []);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(hover: none) and (pointer: coarse)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate tooltip position
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = 320; // max-w-xs
    const tooltipHeight = 100; // estimated max height
    const offset = 10;

    // Calculate horizontal position (centered on trigger)
    let x = triggerRect.left + (triggerRect.width / 2) - (tooltipWidth / 2);

    // Viewport boundary checks
    const viewportWidth = window.innerWidth;
    const padding = 16;

    if (x < padding) x = padding;
    if (x + tooltipWidth > viewportWidth - padding) {
      x = viewportWidth - tooltipWidth - padding;
    }

    // Calculate vertical position (prefer above)
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;

    let y: number;
    let placement: 'top' | 'bottom';

    if (spaceAbove > tooltipHeight + offset || spaceAbove > spaceBelow) {
      // Position above
      y = triggerRect.top - offset;
      placement = 'top';
    } else {
      // Position below
      y = triggerRect.bottom + offset;
      placement = 'bottom';
    }

    setPosition({ x, y, placement });
  }, []);

  // Desktop: Mouse enter/leave handlers
  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      setIsVisible(true);
      calculatePosition();
    }
  }, [isMobile, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      setIsVisible(false);
    }
  }, [isMobile]);

  // Mobile: Click/tap handler
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setIsVisible((prev) => {
        if (!prev) {
          calculatePosition();
        }
        return !prev;
      });
    }
  }, [isMobile, calculatePosition]);

  // Keyboard support
  const handleFocus = useCallback(() => {
    setIsVisible(true);
    calculatePosition();
  }, [calculatePosition]);

  const handleBlur = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsVisible(false);
    }
  }, []);

  // Mobile: Scroll dismissal
  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const handleScroll = () => setIsVisible(false);

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile, isVisible]);

  // Mobile: Click outside handler
  useEffect(() => {
    if (!isMobile || !isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, isVisible]);

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-help text-sm text-neutral-500 dark:text-silver-dark"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-describedby={isVisible ? uniqueId.current : undefined}
        role="button"
        aria-label="Show note"
      >
        [*]
      </span>
      {isVisible && portalContainer && createPortal(
        <div
          ref={tooltipRef}
          id={uniqueId.current}
          role="tooltip"
          className="fixed max-w-xs rounded-lg border border-neutral-200 bg-white/95 px-3 py-2 text-sm text-neutral-800 shadow-fancy backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-900/95 dark:text-silver dark:shadow-dark"
          style={{
            top: 0,
            left: 0,
            transform: position.placement === 'top' 
              ? `translate3d(${position.x}px, ${position.y}px, 0) translateY(-100%)`
              : `translate3d(${position.x}px, ${position.y}px, 0)`,
            zIndex: 50,
          }}
        >
          {children}
        </div>,
        portalContainer
      )}
    </>
  );
};
