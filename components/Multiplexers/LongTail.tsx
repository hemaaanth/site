import { Check, Plus, Search, X } from 'lucide-react'
import posthog from 'posthog-js'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import type { LongTailTool } from '../../lib/multiplexersData'

const GROUPS: { key: string; label: string }[] = [
  { key: 'desktop', label: 'Desktop apps' },
  { key: 'terminal', label: 'Terminal apps, TUIs and CLIs' },
  { key: 'web', label: 'Web dashboards and self-hosted servers' },
  { key: 'mobile', label: 'Phone companions and remote control' },
  { key: 'vendor', label: 'Vendor clouds and editor fleets' },
  { key: 'borderline', label: 'Borderline' },
]

const VOTES_KEY = 'mx-longtail-votes'
const SUGGEST_URL =
  'https://github.com/hemaaanth/site/issues/new?labels=multiplexers&title=' +
  encodeURIComponent('Multiplexer suggestion: ') +
  '&body=' +
  encodeURIComponent('Name:\nLink:\nWhat it is (one line):\nWhy it belongs in the index:\n')

const fmtStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))
const idOf = (t: LongTailTool) => (t.repo || t.url || t.name).toLowerCase()

/** Names come from the sweep with disambiguators in brackets; the row is one line, so keep the name short and put the rest in the title. */
const shortName = (name: string) => name.replace(/\s*\([^)]*\)\s*$/, '')

function useVotes(): [Set<string>, (t: LongTailTool) => void] {
  const [votes, setVotes] = useState<Set<string>>(() => new Set())
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(VOTES_KEY)
      if (raw) setVotes(new Set(JSON.parse(raw)))
    } catch {
      // Private mode or blocked storage: votes just won't persist.
    }
  }, [])
  const vote = (t: LongTailTool) => {
    const id = idOf(t)
    if (votes.has(id)) return
    const next = new Set(votes).add(id)
    setVotes(next)
    try {
      window.localStorage.setItem(VOTES_KEY, JSON.stringify([...next]))
    } catch {
      // ignore
    }
    try {
      posthog.capture('multiplexer_vote', { tool: t.name, repo: t.repo, url: t.url, group: t.group })
    } catch {
      // Analytics blocked: the local mark still shows.
    }
  }
  return [votes, vote]
}

/**
 * Everything the sweep found that hasn't earned a full record. Indexed, not
 * scored: a name, a link, one line, and whether it's still alive. Grouped by
 * surface, collapsed until searched. +1 sends a vote for a full scan.
 */
export function LongTail({ tools }: { tools: LongTailTool[] }) {
  const [q, setQ] = useState('')
  const query = useDeferredValue(q)
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [votes, vote] = useVotes()

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return tools
    return tools.filter((t) => {
      const hay = `${t.name} ${t.blurb} ${t.repo || ''} ${t.note || ''}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [tools, query])

  const searching = query.trim().length > 0
  const dead = tools.filter((t) => t.status === 'dead').length

  return (
    <div className="mx-longtail mx-wide">
      <div className="mx-index-bar">
        <label className="mx-search">
          <Search size={14} strokeWidth={2} aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a name in the long tail" aria-label="Search the long tail" spellCheck={false} />
          {q && (
            <button type="button" className="mx-icon-btn" onClick={() => setQ('')} aria-label="Clear search">
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </label>
        <a className="mx-btn mx-lt-suggest" href={SUGGEST_URL} target="_blank" rel="noopener noreferrer">
          Suggest a tool
        </a>
        <span className="mx-controls-count">
          {searching ? (
            <>
              <b>{shown.length}</b> of {tools.length} match “{query.trim()}”
            </>
          ) : (
            <>
              <b>{tools.length}</b> more tools · {dead} dead
            </>
          )}
        </span>
      </div>
      <div className="mx-lt-groups">
        {GROUPS.map((g) => {
          const items = shown.filter((t) => t.group === g.key)
          if (!items.length) return null
          const isOpen = searching || !!open[g.key]
          return (
            <section key={g.key} className={`mx-lt-group${isOpen ? ' is-open' : ''}`}>
              <button type="button" className="mx-lt-head" aria-expanded={isOpen} onClick={() => setOpen((o) => ({ ...o, [g.key]: !o[g.key] }))}>
                <span className="mx-lt-title">{g.label}</span>
                <span className="mx-lt-count">{items.length}</span>
              </button>
              {isOpen && (
                <ul className="mx-lt-list">
                  {items.map((t) => {
                    const voted = votes.has(idOf(t))
                    const status = t.status !== 'unknown' && t.status !== 'active' ? t.status : ''
                    return (
                      <li key={idOf(t)} className={`mx-lt-row${t.status === 'dead' ? ' is-dead' : ''}`}>
                        <span className="mx-lt-name" title={t.name}>
                          {t.url ? (
                            <a href={t.url} target="_blank" rel="noopener noreferrer">
                              {shortName(t.name)}
                            </a>
                          ) : (
                            shortName(t.name)
                          )}
                        </span>
                        <span className="mx-lt-blurb" title={t.blurb}>
                          {t.blurb}
                        </span>
                        <span className="mx-lt-status">{status || (t.closed ? 'closed' : '')}</span>
                        <span className="mx-lt-stars">{t.stars != null ? `${fmtStars(t.stars)}★` : ''}</span>
                        <button
                          type="button"
                          className={`mx-lt-vote${voted ? ' is-voted' : ''}`}
                          onClick={() => vote(t)}
                          disabled={voted}
                          aria-label={voted ? `Voted for a full scan of ${t.name}` : `Vote for a full scan of ${t.name}`}
                          title={voted ? 'Voted' : 'Vote for a full scan'}
                        >
                          {voted ? <Check size={12} strokeWidth={2.2} /> : <Plus size={12} strokeWidth={2.2} />}
                          <span>1</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
        {searching && shown.length === 0 && (
          <p className="mx-lt-empty">
            Nothing in the long tail matches that.{' '}
            <a href={SUGGEST_URL} target="_blank" rel="noopener noreferrer">
              Suggest it
            </a>
            .
          </p>
        )}
      </div>
    </div>
  )
}

export default LongTail
