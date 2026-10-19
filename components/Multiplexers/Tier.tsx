import { Tip } from './Tip'
import { tierWord } from '../../lib/multiplexers'

interface TierProps {
  /** 1–5, may be fractional for the overall; 0 or null when unscored. */
  value: number | null | undefined
  /** Dimension key, for the tier word in the tooltip. Omit for the overall. */
  dim?: string
  label: string
  accent?: boolean
  /** Show the word after the dots. */
  showWord?: boolean
}

/**
 * Five dots. Filled for the tier, half for a fractional overall, hollow for
 * the rest. The word carries the meaning; no numbers anywhere on the surface.
 */
export function Tier({ value, dim, label, accent = false, showWord = false }: TierProps) {
  const v = value ?? 0
  const word = dim ? tierWord(dim, v) : null
  const title = v ? `${label}: ${word ?? v.toFixed(1)}` : `${label}: not scored`
  const dots = [1, 2, 3, 4, 5].map((i) => (v >= i - 0.25 ? 'on' : v >= i - 0.75 ? 'half' : 'off'))
  return (
    <Tip className={`mx-tier${accent ? ' is-accent' : ''}${v ? '' : ' is-unscored'}`} title={title} label={title}>
      <span className="mx-tier-dots" aria-hidden>
        {dots.map((d, i) => (
          <i key={i} className={`mx-dot is-${d}`} />
        ))}
      </span>
      {showWord && <span className="mx-tier-word">{v ? (word ?? v.toFixed(1)) : '·'}</span>}
    </Tip>
  )
}

export default Tier
