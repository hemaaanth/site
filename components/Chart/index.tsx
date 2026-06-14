import dynamic from 'next/dynamic'
import type { CSSProperties } from 'react'
import type { ChartProps } from './types'
import { buildChartText } from './dataTable'

// Client-only: Highcharts touches the DOM, so keep it out of SSR (and out of
// chart-free pages' bundles). Mirrors the repo's Globe dynamic import. The
// loading placeholder is sized via the --chart-ar var on the figure, so there's
// no layout shift before the chart mounts.
const ChartClient = dynamic(() => import('./ChartClient'), {
  ssr: false,
  loading: () => <div className="chart-canvas-inner chart-loading" aria-hidden />,
})

export function Chart({
  config,
  title,
  subtitle,
  caption,
  altText,
  width = 'column',
  aspectRatio = '16/9',
  frame = true,
  variant = 'standard',
  id,
}: ChartProps) {
  // Server-safe text layer (no highcharts): crawlers / AI / screen readers read
  // this instead of the client-only SVG.
  const { table, alt } = buildChartText(config, title)
  const label = altText || alt
  return (
    <figure
      className={`chart-card chart-${width}${frame ? '' : ' chart-bare'}`}
      style={{ '--chart-ar': aspectRatio } as CSSProperties}
      role="group"
      aria-label={label}
    >
      {(title || subtitle) && (
        <div className="chart-head">
          {title && <div className="chart-title">{title}</div>}
          {subtitle && <div className="chart-subtitle">{subtitle}</div>}
        </div>
      )}
      {/* The .chart-canvas box is server-rendered (sized via --chart-ar, no
          layout shift); only the inner canvas + chart are client-only. It's
          aria-hidden when a data table exists so assistive tech reads the table
          (one source of truth) rather than an empty/duplicate SVG. */}
      <div className="chart-canvas" aria-hidden={table ? true : undefined}>
        <ChartClient config={config} variant={variant} id={id} />
      </div>
      {table && (
        <details className="chart-data">
          <summary>Data table</summary>
          <div className="chart-data-scroll">
            <table>
              <thead>
                <tr>
                  {table.headers.map((h, i) => (
                    <th key={i} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) =>
                      ci === 0 ? (
                        <th key={ci} scope="row">
                          {cell}
                        </th>
                      ) : (
                        <td key={ci}>{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
      {caption && <figcaption className="chart-caption">{caption}</figcaption>}
    </figure>
  )
}

export default Chart
