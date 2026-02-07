import { useState, useRef, useEffect } from 'react'

interface TextDiagramProps {
  content: string
  caption?: string
  minWidth?: number
}

export function TextDiagram({ content, caption, minWidth }: TextDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  // Calculate the natural width of the diagram in characters
  const lines = content?.split('\n') || []
  const maxLineLength = Math.max(...lines.map(line => line.length), minWidth || 0)

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && preRef.current) {
        setIsOverflowing(preRef.current.scrollWidth > containerRef.current.clientWidth)
      }
    }
    
    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [content])

  if (!content) return null

  return (
    <figure className="text-diagram my-8">
      <div 
        ref={containerRef}
        className="text-diagram-container relative overflow-x-auto"
      >
        {/* Scroll hint for mobile */}
        {isOverflowing && (
          <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-neutral-900/80 to-transparent z-10 flex items-center justify-end pr-1">
            <span className="text-neutral-500 text-xs">→</span>
          </div>
        )}
        
        <pre
          ref={preRef}
          className="text-diagram-content font-mono text-sm leading-relaxed whitespace-pre overflow-x-auto p-4 sm:p-6 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300"
          style={{
            // Ensure the content doesn't get smaller than needed
            minWidth: minWidth ? `${minWidth}ch` : undefined,
          }}
        >
          {content}
        </pre>
      </div>
      
      {caption && (
        <figcaption className="text-diagram-caption mt-3 text-sm text-neutral-500 dark:text-silver-dark text-center">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

export default TextDiagram
