import { useState, useRef, useEffect, useCallback } from 'react'

interface TextDiagramProps {
  content: string
  caption?: string
  captionPosition?: 'top' | 'bottom'
  minWidth?: number
}

export function TextDiagram({ content, caption, captionPosition = 'bottom', minWidth }: TextDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const preRef = useRef<HTMLPreElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

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

  // Drag-to-scroll handlers for canvas-like panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !isOverflowing) return
    setIsDragging(true)
    setStartX(e.pageX - containerRef.current.offsetLeft)
    setScrollLeft(containerRef.current.scrollLeft)
  }, [isOverflowing])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return
    e.preventDefault()
    const x = e.pageX - containerRef.current.offsetLeft
    const walk = (x - startX) * 1.5 // Scroll speed multiplier
    containerRef.current.scrollLeft = scrollLeft - walk
  }, [isDragging, startX, scrollLeft])

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  if (!content) return null

  // Parse **bold** syntax into React elements
  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>
      }
      return part
    })
  }

  const captionElement = caption && (
    <figcaption className="text-diagram-caption text-sm text-neutral-500 dark:text-silver-dark text-center py-2">
      {caption}
    </figcaption>
  )

  return (
    <figure className="text-diagram my-8">
      {captionPosition === 'top' && captionElement}
      
      <div 
        ref={containerRef}
        className={`text-diagram-container relative overflow-x-auto rounded-lg border border-neutral-700 bg-neutral-950 ${
          isOverflowing ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Scroll hint */}
        {isOverflowing && !isDragging && (
          <div className="absolute right-2 top-2 px-2 py-1 rounded bg-neutral-800/80 text-neutral-500 text-xs pointer-events-none z-10">
            drag to pan →
          </div>
        )}
        
        <pre
          ref={preRef}
          className="text-diagram-content font-mono text-sm leading-relaxed whitespace-pre p-4 sm:p-5 text-neutral-300 select-none"
          style={{
            minWidth: minWidth ? `${minWidth}ch` : undefined,
          }}
        >
          {renderContent(content)}
        </pre>
      </div>
      
      {captionPosition === 'bottom' && captionElement}
    </figure>
  )
}

export default TextDiagram
