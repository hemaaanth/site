import { LinkExternal } from '../Links'
import type { HorizonTool } from '../../lib/multiplexersData'

/** Announced, funded or in beta, but nothing you can run today. Named, dated, unscored. */
export function Horizon({ tools }: { tools: HorizonTool[] }) {
  return (
    <div className="mx-horizon">
      {tools.map((t) => (
        <article key={t.slug} className="mx-horizon-card">
          <header className="mx-horizon-head">
            <h3 className="mx-horizon-name">
              {t.url ? <LinkExternal href={t.url}>{t.name}</LinkExternal> : t.name}
            </h3>
            <span className="mx-horizon-status">{t.status}</span>
          </header>
          <p className="mx-horizon-meta">
            {t.maker} · announced {t.announced}
          </p>
          <p>{t.summary}</p>
          {t.why && <p className="mx-horizon-why">{t.why}</p>}
          {t.signals?.length > 0 && (
            <ul className="mx-horizon-signals">
              {t.signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {t.sources?.length > 0 && (
            <p className="mx-horizon-sources">
              {t.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ' · '}
                  <LinkExternal href={s.url}>{s.title}</LinkExternal>
                </span>
              ))}
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

export default Horizon
