import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { LinkExternal } from '../Links'
import { Logo } from './Logo'
import { Tier } from './Tier'
import { Tip } from './Tip'
import { ICONS } from './FeatureIcons'
import { CATEGORIES, formatNumber, STAGE_WORD, tierWord } from '../../lib/multiplexers'
import { paragraphs } from '../../lib/multiplexersNotable'
import type { FeatureValue, Scored, Tool } from '../../lib/multiplexers'

const MARK: Record<string, { glyph: string; label: string }> = {
  true: { glyph: '✓', label: 'yes' },
  partial: { glyph: '◐', label: 'partial' },
  false: { glyph: '✗', label: 'no' },
  null: { glyph: '·', label: 'unknown' },
}

export function FeatureMark({ value }: { value: FeatureValue }) {
  const m = MARK[String(value)]
  return (
    <span className={`mx-mark mx-mark-${String(value)}`} aria-label={m.label}>
      {m.glyph}
    </span>
  )
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="mx-stat">
      <span className="mx-stat-label">{label}</span>
      <span className="mx-stat-value" title={value}>
        {value}
      </span>
      {sub && (
        <span className="mx-stat-sub" title={sub}>
          {sub}
        </span>
      )}
    </div>
  )
}

interface WhyRowProps {
  id: string
  label: string
  value: number
  dim: string
  open: string | null
  setOpen: (k: string | null) => void
  children: React.ReactNode
}

function WhyRow({ id, label, value, dim, open, setOpen, children }: WhyRowProps) {
  const isOpen = open === id
  return (
    <li>
      <button type="button" className="mx-why-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : id)}>
        <ChevronRight size={14} strokeWidth={2} className="mx-chev" aria-hidden />
        <span className="mx-why-label">{label}</span>
        <Tier value={value} dim={dim} label={label} showWord />
      </button>
      {isOpen && <ul className="mx-feats">{children}</ul>}
    </li>
  )
}

/**
 * Everything behind one row. Two halves: the four scores with the evidence
 * behind each, and the feature checklist, which is what the filters read and
 * is deliberately not a score.
 */
interface ToolDetailProps {
  tool: Tool
  scored: Scored
  overall: number
  compared?: boolean
  compareFull?: boolean
  onCompare?: () => void
}

export function ToolDetail({ tool, scored, overall, compared = false, compareFull = false, onCompare }: ToolDetailProps) {
  const [open, setOpen] = useState<string | null>(null)
  const gh = tool.traction?.github
  const social = tool.traction?.social
  const a = tool.activity || {}
  const repoUrl = tool.repo ? `https://github.com/${tool.repo}` : null
  const e = tool.editorial

  return (
    <div className="mx-detail">
      <div className="mx-detail-head">
        <Logo slug={tool.slug} name={tool.name} size={32} className="mx-detail-logo" />
        <div className="min-w-0">
          <div className="mx-detail-title">
            <span className="mx-detail-name">{tool.name}</span>
            <span className="mx-detail-meta">
              {[tool.status.stage && tool.status.stage !== 'unknown' ? STAGE_WORD[tool.status.stage] : null, tool.status.lifecycle !== 'unknown' ? tool.status.lifecycle : null, tool.license, tool.pricing.model, tool.taxonomy.surface]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </div>
          {tool.tagline && <p className="mx-detail-tagline">“{tool.tagline}”</p>}
          <div className="mx-detail-links">
            {tool.website && <LinkExternal href={tool.website}>Site</LinkExternal>}
            {repoUrl && <LinkExternal href={repoUrl}>Repo</LinkExternal>}
            {tool.docs && <LinkExternal href={tool.docs}>Docs</LinkExternal>}
            {tool.changelog && <LinkExternal href={tool.changelog}>Changelog</LinkExternal>}
          </div>
        </div>
        <div className="mx-detail-overall">
          <span className="mx-detail-score">
            <span className="mx-stat-label">Overall</span>
            <Tier value={overall} label="Overall" accent />
          </span>
          {onCompare && (
            <button type="button" className={`mx-btn${compared ? ' is-on' : ''}`} disabled={!compared && compareFull} onClick={onCompare} aria-pressed={compared}>
              {compared ? 'Comparing' : compareFull ? 'Compare (4 max)' : 'Compare'}
            </button>
          )}
        </div>
      </div>

      {tool.valueProp && (
        <div className="mx-diff">
          <span className="mx-note-label">What’s different</span>
          {tool.valueProp}
        </div>
      )}
      {tool.authorNote && (
        <aside className="mx-take" aria-label="Hemanth’s note">
          <span className="mx-note-label">Hemanth’s note · I’ve used this one</span>
          {paragraphs(tool.authorNote).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </aside>
      )}

      <div className="mx-detail-grid">
        <div>
          <h5 className="mx-label">Why it scores this way</h5>
          <ul className="mx-why">
            <WhyRow id="reach" label="Reach" value={scored.dims.reach} dim="reach" open={open} setOpen={setOpen}>
              <li className="mx-feats-why">
                <span>{e.reachRationale || 'Not judged yet.'}</span>
              </li>
              {scored.signals
                .filter((s) => s.value != null)
                .map((s) => (
                  <li key={s.key}>
                    <span className="mx-feats-k">{s.label}</span>
                    <span className="mx-feats-v">{formatNumber(s.value)}</span>
                  </li>
                ))}
            </WhyRow>
            <WhyRow id="pace" label="Pace" value={scored.dims.pace} dim="pace" open={open} setOpen={setOpen}>
              <li className="mx-feats-why">
                <span>
                  {tierWord('pace', scored.dims.pace) === 'dormant'
                    ? 'No sign of life in the window we look at, or the maker has called it.'
                    : 'Set by the busiest cadence signal, capped by how recently anything happened.'}
                </span>
              </li>
              {scored.paceSignals
                .filter((s) => s.value != null)
                .map((s) => (
                  <li key={s.key}>
                    <span className="mx-feats-k">{s.label}</span>
                    <span className="mx-feats-v">{String(s.value)}</span>
                  </li>
                ))}
              <li>
                <span className="mx-feats-k">Lifecycle</span>
                <span className="mx-feats-v">
                  {tool.status.lifecycle}
                  {tool.status.override ? ` (${tool.status.overrideReason})` : ''}
                </span>
              </li>
              <li>
                <span className="mx-feats-k">Stage</span>
                <span className="mx-feats-v">{STAGE_WORD[tool.status.stage ?? 'unknown']}</span>
              </li>
            </WhyRow>
            <WhyRow id="polish" label="Polish" value={scored.dims.polish} dim="polish" open={open} setOpen={setOpen}>
              <li className="mx-feats-why">
                <span>{e.polishRationale || 'Not judged yet.'}</span>
              </li>
            </WhyRow>
            <WhyRow id="depth" label="Depth" value={scored.dims.depth} dim="depth" open={open} setOpen={setOpen}>
              <li className="mx-feats-why">
                <span>{e.depthRationale || 'Not judged yet.'}</span>
              </li>
            </WhyRow>
            <WhyRow id="feel" label="Feel" value={scored.dims.feel} dim="feel" open={open} setOpen={setOpen}>
              <li className="mx-feats-why">
                <span>{e.feelRationale || 'Not judged yet.'}</span>
              </li>
            </WhyRow>
          </ul>

          <div className="mx-stats">
            <Stat label="Stars" value={formatNumber(gh?.stars)} sub={gh ? `${formatNumber(gh.contributors)} contributors` : 'closed source'} />
            <Stat label="Commits / 30d" value={a.commits30d != null ? String(a.commits30d) : '·'} sub={a.lastReleaseTag ? `latest ${a.lastReleaseTag}` : a.changelogCadence ? `${a.changelogCadence} changelog` : undefined} />
            <Stat label="X" value={formatNumber(social?.x?.followers)} sub={social?.x?.handle ? `@${social.x.handle}` : undefined} />
            <Stat label="Discord" value={formatNumber(social?.discord?.members)} sub={social?.discord?.online ? `${formatNumber(social.discord.online)} online` : undefined} />
            <Stat label="Hacker News" value={social?.hn?.top ? `${social.hn.top.points} pts` : '·'} sub={social?.hn?.stories ? `${social.hn.stories} stories` : undefined} />
            <Stat label="Maker" value={tool.maker.name || '·'} sub={[tool.maker.type, tool.maker.funding].filter(Boolean).join(' · ') || undefined} />
          </div>
        </div>

        <div>
          <h5 className="mx-label">What it has</h5>
          <div className="mx-checklist">
            {CATEGORIES.map((c) => (
              <section key={c.key} className="mx-checklist-cat">
                <h6>{c.label}</h6>
                <div className="mx-chips">
                  {Object.entries(c.features).map(([k, f]) => {
                    const key = `${c.key}.${k}`
                    const v = tool.features?.[c.key]?.[k] ?? null
                    const note = tool.featureNotes?.[key]
                    const Icon = ICONS[key]
                    const state = v === true ? 'is-yes' : v === 'partial' ? 'is-partial' : v === false ? 'is-no' : 'is-unknown'
                    const word = v === true ? 'yes' : v === 'partial' ? 'partial' : v === false ? 'no' : 'unknown'
                    return (
                      <Tip key={k} className={`mx-chip ${state}${note ? ' has-note' : ''}`} title={`${f.label}: ${word}`} body={note}>
                        {Icon ? <Icon size={12} /> : <FeatureMark value={v} />}
                        {f.label}
                      </Tip>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {(tool.supportedAgents.length > 0 || tool.pricing.notes) && (
        <dl className="mx-facts">
          {tool.supportedAgents.length > 0 && (
            <>
              <dt>Agents</dt>
              <dd>{tool.supportedAgents.join(', ')}</dd>
            </>
          )}
          {tool.pricing.notes && (
            <>
              <dt>Pricing</dt>
              <dd>{tool.pricing.notes}</dd>
            </>
          )}
        </dl>
      )}

      <p className="mx-detail-foot">
        {tool.sourceCount} sources · researched {tool.research.lastFullRefresh || 'never'}
        {tool.research.lastMetricsRefresh && ` · numbers ${tool.research.lastMetricsRefresh}`}
        {tool.research.confidence && ` · ${tool.research.confidence} confidence`}
      </p>
    </div>
  )
}

export default ToolDetail
