import { Logo } from './Logo'
import { NOTABLE, paragraphs } from '../../lib/multiplexersNotable'
import type { Tool } from '../../lib/multiplexers'

interface NotableProps {
  tools: Tool[]
  /** Open the tool's row in the index. */
  onOpen: (slug: string) => void
}

/**
 * Hand-written commentary on the tools Hemanth has actually used. The words
 * are each record's `authorNote` and are his alone; the scores above are the
 * agents'.
 */
export function Notable({ tools, onOpen }: NotableProps) {
  return (
    <div className="mx-notable">
      {NOTABLE.map((entry) => {
        const tool = tools.find((t) => t.slug === entry.slug)
        if (!tool?.authorNote) return null
        return (
          <article key={entry.slug} className="mx-notable-item" id={`notable-${entry.slug}`}>
            <header className="mx-notable-head">
              <Logo slug={tool.slug} name={tool.name} size={24} className="mx-notable-logo" />
              <h3 className="mx-notable-name">{entry.title ?? tool.name}</h3>
              <nav className="mx-notable-links" aria-label={`${tool.name} links`}>
                {tool.website && (
                  <a className="mx-btn" href={tool.website} target="_blank" rel="noopener noreferrer">
                    Website ↗
                  </a>
                )}
                {tool.repo && (
                  <a className="mx-btn" href={`https://github.com/${tool.repo}`} target="_blank" rel="noopener noreferrer">
                    GitHub ↗
                  </a>
                )}
                <button type="button" className="mx-btn" onClick={() => onOpen(tool.slug)}>
                  In the table ↓
                </button>
              </nav>
            </header>
            {tool.tagline && <p className="mx-notable-tagline">{tool.tagline}</p>}
            {paragraphs(tool.authorNote).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
        )
      })}
    </div>
  )
}

export default Notable
