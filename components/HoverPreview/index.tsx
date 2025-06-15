import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';

// Simple throttle function to limit the rate of mousemove updates
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return function(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

interface HoverPreviewProps {
  imageUrl?: string;
  children: React.ReactNode;
  className?: string;
}

interface PreviewPosition {
  x: number;
  y: number;
}

export const HoverPreview: React.FC<HoverPreviewProps> = ({ 
  imageUrl, 
  children,
  className = '',
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [position, setPosition] = useState<PreviewPosition>({ x: 0, y: 0 });
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const linkRef = useRef<HTMLSpanElement>(null);

  // Create portal container on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const container = document.createElement('div');
      container.setAttribute('id', 'hover-preview-portal');
      document.body.appendChild(container);
      setPortalContainer(container);

      return () => {
        document.body.removeChild(container);
      };
    }
  }, []);

  // Handle mouse events
  const handleMouseEnter = useCallback(() => {
    if (imageUrl) {
      setShowPreview(true);
    }
  }, [imageUrl]);

  const handleMouseLeave = useCallback(() => {
    setShowPreview(false);
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  }, []);

  const updatePosition = useCallback((e: React.MouseEvent) => {
    if (requestRef.current !== null) {
      cancelAnimationFrame(requestRef.current);
    }

    requestRef.current = requestAnimationFrame(() => {
      // Position the preview with a slight offset from the cursor
      const x = e.clientX + 15;
      const y = e.clientY + 15;
      
      // Ensure the preview stays within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const previewWidth = 180; // Maximum width of our preview
      const previewHeight = 200; // Maximum height of our preview
      
      const boundedX = Math.min(x, viewportWidth - previewWidth - 10);
      const boundedY = Math.min(y, viewportHeight - previewHeight - 10);
      
      setPosition({
        x: boundedX,
        y: boundedY,
      });
    });
  }, []);
  
  // Throttle the mousemove handler to improve performance
  const throttledUpdatePosition = useCallback((e: React.MouseEvent) => {
    throttle((event: React.MouseEvent) => updatePosition(event), 16)(e);
  }, [updatePosition]);

  // If no image URL is provided, just render children as is
  if (!imageUrl) {
    return <>{children}</>;
  }

  return (
    <span
      ref={linkRef}
      className={`hover-preview-trigger ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={throttledUpdatePosition}
    >
      {children}
      {showPreview && portalContainer && createPortal(
        <div 
          className="hover-preview-image"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            '--x': `${position.x}px`,
            '--y': `${position.y}px`,
            transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
            zIndex: 9999,
            pointerEvents: 'none',
            borderRadius: '0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            backgroundColor: 'white',
            padding: '0',
          } as React.CSSProperties}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Image 
              src={imageUrl} 
              alt="Preview"
              width={0}
              height={0}
              sizes="100vw"
              style={{
                width: 'auto',
                height: 'auto',
                maxWidth: '180px',
                maxHeight: '200px',
                display: 'block',
              }}
              onError={() => setShowPreview(false)}
            />
          </div>
        </div>,
        portalContainer
      )}
    </span>
  );
};
