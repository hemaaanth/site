import { Camera, Check, Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Logo } from './Logo'
import { ToolCard } from './ToolCard'
import { QUADRANTS, quadrantOf, tierWord } from '../../lib/multiplexers'
import type { Scored, Tool } from '../../lib/multiplexers'

export interface QuadrantPoint {
  slug: string
  name: string
  /** Plot position, 0–100 (rank within the field). */
  x: number
  y: number
  overall: number
  reach?: number
  pace?: number
  tool: Tool
  scored: Scored
}

interface QuadrantProps {
  points: QuadrantPoint[]
  /** Slug of the tool whose card is open, if any. */
  card: string | null
  onCard: (slug: string | null) => void
  /** Open the full row in the index. */
  onMore: (slug: string) => void
  /** Copy the map to the clipboard; resolves to what actually happened. */
  onSnapshot: () => Promise<'copied' | 'downloaded'>
  xLabel?: string
  yLabel?: string
  empty?: boolean
}

/**
 * The 2x2. Plain HTML/CSS so logos, hover and click behave like the rest of
 * the page and the whole thing stays crawlable. Hover shows the name; a
 * click opens a card in place. Positions are percentages of the plot box;
 * (0,0) is bottom-left.
 */
export function Quadrant({ points, card, onCard, onMore, onSnapshot, xLabel = 'Product quality', yLabel = 'Reach & pace', empty = false }: QuadrantProps) {
  const [hover, setHover] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const [shooting, setShooting] = useState(false)
  const [done, setDone] = useState<'copied' | 'downloaded' | 'failed' | null>(null)
  const figRef = useRef<HTMLElement | null>(null)

  // Marks that just dropped out stay a moment at their last spot and fade, so a
  // filter change reads as "these left" rather than a cut. Moves animate in CSS.
  const [leaving, setLeaving] = useState<QuadrantPoint[]>([])
  const last = useRef(points)
  const members = points.map((p) => p.slug).sort().join(' ')
  useEffect(() => {
    const now = new Set(points.map((p) => p.slug))
    const gone = last.current.filter((p) => !now.has(p.slug))
    if (!gone.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setLeaving((g) => [...g.filter((p) => !now.has(p.slug) && !gone.some((x) => x.slug === p.slug)), ...gone])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members])
  useEffect(() => {
    last.current = points
  })

  useEffect(() => {
    const onChange = () => setFull(document.fullscreenElement === figRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // The check (or cross) turns back into the camera on its own.
  useEffect(() => {
    if (!done) return
    const id = setTimeout(() => setDone(null), 1800)
    return () => clearTimeout(id)
  }, [done])

  const toggleFull = () => {
    const el = figRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  const shoot = async () => {
    if (shooting) return
    setShooting(true)
    try {
      setDone(await onSnapshot())
    } catch {
      setDone('failed')
    } finally {
      setShooting(false)
    }
  }
  const doneText = done === 'copied' ? 'Copied' : done === 'downloaded' ? 'Saved' : done === 'failed' ? 'Couldn’t copy' : null

  const open = card ? points.find((p) => p.slug === card) : null

  return (
    <figure ref={figRef} className={`mx-quadrant mx-wide${full ? ' is-full' : ''}`} role="group" aria-label={`Quadrant of ${points.length} tools by ${xLabel} and ${yLabel}`}>
      <div className="mx-quadrant-tools">
        <span className="sr-only" role="status">
          {doneText}
        </span>
        <button
          type="button"
          className="mx-icon-btn mx-snap-btn"
          data-state={done ?? undefined}
          onClick={shoot}
          aria-busy={shooting}
          aria-label="Copy a picture of this map"
          title={doneText ?? 'Copy picture'}
        >
          <span className="mx-swap" aria-hidden>
            <Camera size={15} strokeWidth={2} />
            <Check size={15} strokeWidth={2.25} />
            <X size={15} strokeWidth={2.25} />
          </span>
        </button>
        <button type="button" className="mx-icon-btn" onClick={toggleFull} aria-label={full ? 'Exit full screen' : 'Full screen'} title={full ? 'Exit full screen' : 'Full screen'}>
          {full ? <Minimize2 size={15} strokeWidth={2} /> : <Maximize2 size={15} strokeWidth={2} />}
        </button>
      </div>
      <div className="mx-quadrant-plot" onClick={(e) => e.target === e.currentTarget && onCard(null)}>
        <div className="mx-quadrant-grid" aria-hidden />
        {(['tl', 'tr', 'bl', 'br'] as const).map((q) => (
          <span key={q} className={`mx-quadrant-corner mx-quadrant-${q}`} aria-hidden>
            <b>{QUADRANTS[q].name}</b>
            <i>{QUADRANTS[q].hint}</i>
          </span>
        ))}
        <span className="mx-quadrant-axis mx-quadrant-axis-x" aria-hidden>
          {xLabel} →
        </span>
        <span className="mx-quadrant-axis mx-quadrant-axis-y" aria-hidden>
          {yLabel} →
        </span>
        {empty && <span className="mx-quadrant-empty">Nothing in the index meets every requirement. Loosen one.</span>}
        {points.map((p) => {
          const active = hover === p.slug || card === p.slug
          const edge = p.x > 72 ? ' is-right' : p.x < 28 ? ' is-left' : ''
          return (
            <button
              key={p.slug}
              type="button"
              className={`mx-point${active ? ' is-active' : ''}${edge}`}
              style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
              onMouseEnter={() => setHover(p.slug)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(p.slug)}
              onBlur={() => setHover(null)}
              onClick={() => onCard(card === p.slug ? null : p.slug)}
              aria-label={`${p.name}: ${QUADRANTS[quadrantOf(p.x, p.y)].name}. Reach ${tierWord('reach', p.reach) ?? 'unscored'}, pace ${tierWord('pace', p.pace) ?? 'unscored'}.`}
            >
              <Logo slug={p.slug} name="" size={22} />
              <span className="mx-point-name" aria-hidden>
                {p.name}
              </span>
            </button>
          )
        })}
        {leaving
          .filter((p) => !points.some((x) => x.slug === p.slug))
          .map((p) => (
            <span
              key={`leaving-${p.slug}`}
              className="mx-point is-leaving"
              style={{ left: `${p.x}%`, bottom: `${p.y}%` }}
              aria-hidden
              onAnimationEnd={() => setLeaving((g) => g.filter((x) => x.slug !== p.slug))}
            >
              <Logo slug={p.slug} name="" size={22} />
            </span>
          ))}
        {open && (
          <div className={`mx-card-anchor${open.x > 50 ? ' is-left' : ' is-right'}${open.y > 50 ? ' is-below' : ' is-above'}`} style={{ left: `${open.x}%`, bottom: `${open.y}%` }}>
            <ToolCard tool={open.tool} scored={open.scored} overall={open.overall} quadrant={quadrantOf(open.x, open.y)} onClose={() => onCard(null)} onMore={full ? undefined : () => onMore(open.slug)} />
          </div>
        )}
      </div>
    </figure>
  )
}

export default Quadrant
