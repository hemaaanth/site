import { X } from 'lucide-react'
import { Fragment } from 'react'
import { Logo } from './Logo'
import { Tier } from './Tier'
import { Tip } from './Tip'
import { FeatureMark } from './ToolDetail'
import { CATEGORIES, DIMENSIONS } from '../../lib/multiplexers'
import type { Scored, Tool } from '../../lib/multiplexers'

/** Side-by-side: the five tiers, then a feature-by-feature matrix. */
export function Compare({ tools, scores, onRemove, onClear }: { tools: Tool[]; scores: Record<string, Scored>; onRemove: (slug: string) => void; onClear: () => void }) {
  if (tools.length < 2) return null
  return (
    <div className="mx-compare">
      <div className="mx-compare-head">
        <span className="chart-title">Comparing {tools.length} tools</span>
        <button type="button" className="mx-btn" onClick={onClear}>
          Clear
        </button>
      </div>
      <div className="mx-matrix-scroll mx-scroll">
        <table className="mx-matrix">
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Score</span>
              </th>
              {tools.map((t) => (
                <th key={t.slug} scope="col">
                  <span className="mx-matrix-tool">
                    <Logo slug={t.slug} name="" size={16} />
                    {t.name}
                    <button type="button" className="mx-icon-btn" onClick={() => onRemove(t.slug)} aria-label={`Remove ${t.name} from comparison`} title="Remove">
                      <X size={12} strokeWidth={2} />
                    </button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map((d) => (
              <tr key={d.key}>
                <th scope="row">{d.label}</th>
                {tools.map((t) => (
                  <td key={t.slug} className="mx-matrix-score">
                    <Tier value={scores[t.slug].dims[d.key]} dim={d.key} label={d.label} showWord />
                  </td>
                ))}
              </tr>
            ))}
            {CATEGORIES.map((c) => (
              <Fragment key={c.key}>
                <tr className="mx-matrix-cat">
                  <th scope="rowgroup" colSpan={tools.length + 1}>
                    {c.label}
                  </th>
                </tr>
                {Object.entries(c.features).map(([k, f]) => (
                  <tr key={`${c.key}.${k}`}>
                    <th scope="row">{f.label}</th>
                    {tools.map((t) => {
                      const v = t.features?.[c.key]?.[k] ?? null
                      const note = t.featureNotes?.[`${c.key}.${k}`]
                      return (
                        <td key={t.slug}>
                          {note ? (
                            <Tip title={`${t.name} · ${f.label}`} body={note}>
                              <FeatureMark value={v} />
                            </Tip>
                          ) : (
                            <FeatureMark value={v} />
                          )}
                          {note && <span className="sr-only"> {note}</span>}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Compare
