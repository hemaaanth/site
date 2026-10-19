import { X } from 'lucide-react'
import { LinkExternal } from '../Links'
import { Logo } from './Logo'
import { Tier } from './Tier'
import { DIMENSIONS, QUADRANTS, STAGE_WORD } from '../../lib/multiplexers'
import type { Scored, Tool } from '../../lib/multiplexers'

interface ToolCardProps {
  tool: Tool
  scored: Scored
  overall: number
  quadrant: keyof typeof QUADRANTS
  onClose: () => void
  /** Jump to the full row in the index. Omitted in full screen, where the index is out of reach. */
  onMore?: () => void
}

/** The in-place card a map click opens: enough to decide whether to read on. */
export function ToolCard({ tool, scored, overall, quadrant, onClose, onMore }: ToolCardProps) {
  const repoUrl = tool.repo ? `https://github.com/${tool.repo}` : null
  return (
    <div className="mx-card" role="dialog" aria-label={tool.name}>
      <div className="mx-card-head">
        <Logo slug={tool.slug} name={tool.name} size={26} className="mx-card-logo" />
        <div className="min-w-0">
          <div className="mx-card-name">
            {tool.name} <span>{QUADRANTS[quadrant].name}</span>
          </div>
          <div className="mx-card-meta">
            {[tool.status.stage && tool.status.stage !== 'unknown' ? STAGE_WORD[tool.status.stage] : null, tool.status.lifecycle !== 'unknown' ? tool.status.lifecycle : null, tool.license, tool.pricing.model].filter(Boolean).join(' · ')}
          </div>
        </div>
        <button type="button" className="mx-icon-btn" onClick={onClose} aria-label="Close">
          <X size={14} strokeWidth={2} />
        </button>
      </div>
      {tool.valueProp && <p className="mx-card-diff">{tool.valueProp}</p>}
      {tool.authorNote && (
        <p className="mx-card-take">
          <span className="mx-note-label">Hemanth’s note</span>
          {tool.authorNote}
        </p>
      )}
      <ul className="mx-card-tiers">
        <li>
          <span>Overall</span>
          <Tier value={overall} label="Overall" accent />
        </li>
        {DIMENSIONS.map((d) => (
          <li key={d.key}>
            <span>{d.label}</span>
            <Tier value={scored.dims[d.key]} dim={d.key} label={d.label} showWord />
          </li>
        ))}
      </ul>
      <div className="mx-card-foot">
        <div className="mx-detail-links">
          {tool.website && <LinkExternal href={tool.website}>Site</LinkExternal>}
          {repoUrl && <LinkExternal href={repoUrl}>Repo</LinkExternal>}
        </div>
        {onMore && (
          <button type="button" className="mx-btn" onClick={onMore}>
            Full details ↓
          </button>
        )}
      </div>
    </div>
  )
}

export default ToolCard
