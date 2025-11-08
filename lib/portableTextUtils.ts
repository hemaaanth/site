import type { PortableTextBlock } from '@portabletext/types'

export interface Header {
  depth: number
  text: string
}

export function extractHeaders(content: PortableTextBlock[]): Header[] {
  const headers: Header[] = []
  
  function traverse(blocks: PortableTextBlock[], depth: number = 1) {
    for (const block of blocks) {
      if (block._type === 'block' && block.style) {
        const styleMatch = block.style.match(/^h([1-6])$/)
        if (styleMatch) {
          const headerDepth = parseInt(styleMatch[1])
          const text = extractTextFromBlock(block)
          if (text) {
            headers.push({ depth: headerDepth, text })
          }
        }
      }
      
      // Handle custom block types like aside
      if (block._type === 'aside' && 'content' in block) {
        traverse((block as any).content, depth)
      }
    }
  }
  
  traverse(content)
  
  // Find minimum depth
  const minDepth = headers.length > 0 ? Math.min(...headers.map(h => h.depth)) : Infinity
  
  // Adjust depths relative to minimum
  const adjustedHeaders = headers.map(header => ({
    ...header,
    depth: header.depth - minDepth + 1
  }))
  
  return adjustedHeaders
}

function extractTextFromBlock(block: PortableTextBlock): string {
  if (block._type !== 'block') return ''
  
  const text: string[] = []
  
  if (block.children) {
    for (const child of block.children) {
      if (child._type === 'span' && 'text' in child) {
        text.push(child.text)
      }
    }
  }
  
  // Remove markdown formatting (bold, italic) and links
  return text.join('').replace(/\*\*?(.*?)\*\*?/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

export function filterHeadersByDepth(headers: Header[], maxDepth: number): Header[] {
  if (maxDepth === Infinity) return headers
  return headers.filter(header => header.depth <= maxDepth)
}

export function calculateReadingTime(content: PortableTextBlock[]): number {
  let wordCount = 0
  
  function traverse(blocks: PortableTextBlock[]) {
    for (const block of blocks) {
      if (block._type === 'block' && block.children) {
        for (const child of block.children) {
          if (child._type === 'span' && 'text' in child) {
            const words = child.text.trim().split(/\s+/).filter(Boolean)
            wordCount += words.length
          }
        }
      }
      
      // Handle custom block types
      if (block._type === 'aside' && 'content' in block) {
        traverse((block as any).content)
      }
    }
  }
  
  traverse(content)
  
  const readingSpeed = 200 // words per minute
  return Math.ceil(wordCount / readingSpeed)
}

