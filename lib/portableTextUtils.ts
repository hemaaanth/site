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
            // Filter out stega-encoded metadata that might be embedded in text
            // Stega encoding can add invisible characters or metadata
            let text = child.text

            // Remove stega markers and invisible Unicode characters
            // Stega uses zero-width spaces and other invisible characters
            text = text.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '') // Remove zero-width spaces and word joiners

            // Remove any extremely long sequences (likely encoded metadata)
            // Split on whitespace and filter
            const words = text.trim().split(/\s+/).filter(word => {
              const trimmed = word.trim()
              // Filter out:
              // - Empty strings
              // - Words longer than 50 chars (likely encoded data, not real words)
              // - Strings with no alphanumeric characters
              return trimmed.length > 0 &&
                     trimmed.length <= 50 &&
                     /[a-zA-Z0-9\u00C0-\u017F]/.test(trimmed)
            })
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
  const minutes = Math.ceil(wordCount / readingSpeed)
  // Return at least 1 minute if there's any content
  return Math.max(1, minutes)
}

export function extractPlainText(content: PortableTextBlock[]): string[] {
  const words: string[] = []

  function traverse(blocks: PortableTextBlock[]) {
    for (const block of blocks) {
      if (block._type === 'block' && block.children) {
        for (const child of block.children) {
          if (child._type === 'span' && 'text' in child) {
            let text = child.text

            // Remove stega markers and invisible Unicode characters
            text = text.replace(/[\u200B-\u200D\uFEFF\u2060]/g, '')

            // Split on whitespace and filter
            const blockWords = text.trim().split(/\s+/).filter(word => {
              const trimmed = word.trim()
              return trimmed.length > 0 &&
                     trimmed.length <= 50 &&
                     /[a-zA-Z0-9\u00C0-\u017F]/.test(trimmed)
            })
            words.push(...blockWords)
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
  return words
}

