import { ArrowDown, ArrowUp, ChevronRight, MessageSquareQuote } from 'lucide-react'
import { memo, useEffect, useLayoutEffect, useRef } from 'react'
import { Logo } from './Logo'
import { Tier } from './Tier'
import { Tip } from './Tip'
import { ToolDetail } from './ToolDetail'
import { FeatureIconStrip, ICON_COLUMNS } from './FeatureIcons'
import { DIMENSIONS } from '../../lib/multiplexers'
import type { Scored, Tool } from '../../lib/multiplexers'

export interface TableRow {
  tool: Tool
  scored: Scored
  overall: number
  x: number
  y: number
  missing: string[]
  dimmed: boolean
  /** Position in the ranked list, before any search narrows it. */
  rank: number
}

/** Column the table is ordered by: the ranking, the name, the overall, or one dimension. */
export interface TableSort {
  key: string
  desc: boolean
}
export const RANK_SORT: TableSort = { key: 'rank', desc: false }

/** Rank and name read top-down; scores read best first. */
const firstDesc = (key: string) => key !== 'rank' && key !== 'name'

/** Order rows by a column. Greyed (dormant) rows stay at the end; ties keep the ranking. */
export function sortRows(rows: TableRow[], sort: TableSort): TableRow[] {
  if (sort.key === 'rank' && !sort.desc) return rows
  const value = (r: TableRow): number | string =>
    sort.key === 'rank' ? r.rank : sort.key === 'name' ? r.tool.name.toLowerCase() : sort.key === 'overall' ? r.overall : (r.scored.dims[sort.key] ?? -1)
  const dir = sort.desc ? -1 : 1
  return [...rows].sort((a, b) => {
    const va = value(a)
    const vb = value(b)
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return Number(a.dimmed) - Number(b.dimmed) || cmp * dir || a.rank - b.rank
  })
}

interface ScoreTableProps {
  rows: TableRow[]
  selected: string | null
  compare: string[]
  onSelect: (slug: string | null) => void
  onCompare: (slug: string) => void
  sort: TableSort
  onSort: (sort: TableSort) => void
  /** Changes when the ranking itself changes (not a search), which is when rows glide. */
  motionKey?: string
}

/** Early stages show as a small Greek letter; the hover card names it. */
const STAGE_MARK: Record<string, { mark: string; word: string }> = { alpha: { mark: 'α', word: 'Alpha' }, beta: { mark: 'β', word: 'Beta' } }

const cols = DIMENSIONS
const SPAN = 3 + cols.length + ICON_COLUMNS.length

/** A header label that sorts by its column; a second click flips the direction. */
function SortButton({ col, label, sort, onSort }: { col: string; label: string; sort: TableSort; onSort: (sort: TableSort) => void }) {
  const active = sort.key === col
  const Arrow = sort.desc ? ArrowDown : ArrowUp
  return (
    <button
      type="button"
      className={`mx-sort${active ? ' is-active' : ''}`}
      onClick={() => onSort(active && col !== 'rank' ? { key: col, desc: !sort.desc } : { key: col, desc: firstDesc(col) })}
      title={`Sort by ${label === '#' ? 'rank' : label.toLowerCase()}`}
    >
      {label}
      {active && col !== 'rank' && <Arrow size={11} strokeWidth={2.25} className="mx-sort-arrow" aria-hidden />}
    </button>
  )
}

const ariaSort = (sort: TableSort, col: string) => (sort.key === col ? (sort.desc ? 'descending' : 'ascending') : undefined)

interface RowProps {
  r: TableRow
  isOpen: boolean
  compared: boolean
  compareFull: boolean
  onSelect: (slug: string | null) => void
  onCompare: (slug: string) => void
}

/**
 * One ranked row plus, when open, its detail. Memoised on its own props so a
 * search that drops other rows, or a click that opens another row, does not
 * re-render every glyph in the table.
 */
const Row = memo(function Row({ r, isOpen, compared, compareFull, onSelect, onCompare }: RowProps) {
  const toggleRow = () => onSelect(isOpen ? null : r.tool.slug)
  return (
    <>
      <tr id={`tool-${r.tool.slug}`} data-flip={r.tool.slug} className={`mx-row${isOpen ? ' is-open' : ''}${r.dimmed ? ' is-dimmed' : ''}`} onClick={toggleRow} aria-expanded={isOpen}>
        <td className="mx-col-tool">
          <span className="mx-col-tool-inner">
            <span className="mx-col-rank">{r.rank}</span>
            <span className="mx-tool-slot">
              <button
                type="button"
                className="mx-tool-btn"
                aria-expanded={isOpen}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleRow()
                }}
              >
                <Logo slug={r.tool.slug} name="" size={18} />
                <span className="mx-tool-name">{r.tool.name}</span>
                {r.dimmed && <span className="mx-lifecycle">{r.tool.status.lifecycle}</span>}
                {STAGE_MARK[r.tool.status.stage] && (
                  <Tip className="mx-stage" title={STAGE_MARK[r.tool.status.stage].word} label={STAGE_MARK[r.tool.status.stage].word}>
                    <span aria-hidden>{STAGE_MARK[r.tool.status.stage].mark}</span>
                  </Tip>
                )}
                {r.tool.authorNote && (
                  <Tip className="mx-row-note" title="Hemanth’s note" body={r.tool.authorNote} label="Hemanth’s note">
                    <MessageSquareQuote size={13} strokeWidth={2} />
                  </Tip>
                )}
              </button>
            </span>
          </span>
        </td>
        <td className="mx-col-overall">
          <Tier value={r.overall} label="Overall" accent />
        </td>
        {cols.map((c) => (
          <td key={c.key}>
            <Tier value={r.scored.dims[c.key]} dim={c.key} label={c.label} />
          </td>
        ))}
        {ICON_COLUMNS.map((c) => (
          <td key={c.key} className="mx-col-icons">
            <FeatureIconStrip tool={r.tool} keys={c.keys} />
          </td>
        ))}
        <td className="mx-col-chev" aria-hidden>
          <ChevronRight size={14} strokeWidth={2} className={`mx-chev${isOpen ? ' is-open' : ''}`} />
        </td>
      </tr>
      {isOpen && (
        <tr className="mx-row-detail" data-flip={`${r.tool.slug}:detail`}>
          <td colSpan={SPAN}>
            <div className="mx-detail-pin">
              <ToolDetail tool={r.tool} scored={r.scored} overall={r.overall} compared={compared} compareFull={compareFull} onCompare={() => onCompare(r.tool.slug)} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
})

const GLIDE = 'cubic-bezier(0.25, 1, 0.5, 1)'

/**
 * Rows that just left the view slide down under the table's bottom edge. React
 * has already detached them, so they go into a throwaway copy of the table,
 * laid over the real one with the same column widths, and that copy is removed
 * once they are out of sight.
 */
function sink(scroll: HTMLElement, body: HTMLTableSectionElement, rows: { tr: HTMLElement; top: number }[], end: number) {
  const table = body.parentElement as HTMLTableElement
  const ghost = document.createElement('table')
  ghost.className = 'mx-table mx-table-ghost'
  ghost.setAttribute('aria-hidden', 'true')
  ghost.style.width = `${table.offsetWidth}px`
  ghost.style.top = `${table.offsetTop}px`
  const colgroup = document.createElement('colgroup')
  for (const th of Array.from(table.tHead?.rows[0]?.cells ?? [])) {
    const col = document.createElement('col')
    col.style.width = `${th.getBoundingClientRect().width}px`
    colgroup.appendChild(col)
  }
  const tbody = document.createElement('tbody')
  ghost.append(colgroup, tbody)
  rows.sort((a, b) => a.top - b.top).forEach(({ tr }) => {
    tr.getAnimations().forEach((a) => a.cancel())
    tbody.appendChild(tr)
  })
  scroll.appendChild(ghost)
  const runs = rows.map(({ tr, top }, i) => {
    const at = tr.offsetTop
    return tr.animate([{ transform: `translateY(${top - at}px)` }, { transform: `translateY(${end + i * tr.offsetHeight - at}px)` }], { duration: 380, easing: GLIDE, fill: 'forwards' }).finished
  })
  Promise.allSettled(runs).then(() => ghost.remove())
}

/** Ranked table. Click a row for the detail; tick to compare. */
export function ScoreTable({ rows, selected, compare, onSelect, onCompare, sort, onSort, motionKey }: ScoreTableProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const bodyRef = useRef<HTMLTableSectionElement | null>(null)
  const tops = useRef(new Map<string, number>())
  const nodes = useRef(new Map<string, HTMLElement>())
  const lastKey = useRef(motionKey)

  // When the ranking changes, each row glides from where it was to where it now
  // is (FLIP: measure, then play the difference back). A row caught mid-glide
  // starts from where it is drawn, not where it sits. Rows that come up from
  // past the 20-row cut rise from under the table's bottom edge, and rows that
  // drop past it sink under that edge, so nothing blinks in or out.
  useLayoutEffect(() => {
    const body = bodyRef.current
    if (!body) return
    const animate = motionKey !== lastKey.current && typeof body.animate === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    lastKey.current = motionKey
    // Read every row first, then write. Mixing reads with animate() and
    // cancel() forced a fresh style pass per row.
    const trs = Array.from(body.querySelectorAll<HTMLElement>('tr[data-flip]'))
    const read = trs.map((tr) => {
      const t = animate ? getComputedStyle(tr).transform : 'none'
      return { tr, id: tr.dataset.flip, top: tr.offsetTop, drawn: t && t !== 'none' ? new DOMMatrixReadOnly(t).m42 : 0, running: animate ? tr.getAnimations() : [] }
    })
    const before = tops.current
    const beforeNodes = nodes.current
    tops.current = new Map(read.map((r) => [r.id, r.top]))
    nodes.current = new Map(read.map((r) => [r.id, r.tr]))
    if (!animate) return
    const rowH = read[0]?.tr.offsetHeight || 44
    const end = body.offsetTop + body.offsetHeight
    let rising = 0
    for (const { tr, id, top, drawn, running } of read) {
      const was = before.get(id) ?? end + rising++ * rowH
      const dy = was + drawn - top
      running.forEach((a) => a.cancel())
      if (Math.abs(dy) < 1) continue
      tr.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 380, easing: GLIDE })
    }
    const gone = [...beforeNodes].filter(([id]) => !tops.current.has(id) && !id.endsWith(':detail')).map(([id, tr]) => ({ tr, top: before.get(id) }))
    if (gone.length && scrollRef.current) sink(scrollRef.current, body, gone, end)
  })

  // The table is wider than its container; the expanded detail must not be.
  // Publish the visible width as a CSS variable and pin the detail to it.
  useEffect(() => {
    const el = scrollRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const apply = () => el.style.setProperty('--mx-table-w', `${el.clientWidth}px`)
    apply()
    const ro = new ResizeObserver(apply)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const compareFull = compare.length >= 4

  return (
    <div className="mx-table-scroll mx-scroll" ref={scrollRef}>
      <table className="mx-table">
        <thead>
          <tr>
            <th scope="col" className="mx-col-tool" aria-sort={ariaSort(sort, 'rank') ?? ariaSort(sort, 'name')}>
              <span className="mx-col-tool-inner">
                <span className="mx-col-rank">
                  <SortButton col="rank" label="#" sort={sort} onSort={onSort} />
                </span>
                <SortButton col="name" label="Tool" sort={sort} onSort={onSort} />
              </span>
            </th>
            <th scope="col" className="mx-col-overall" aria-sort={ariaSort(sort, 'overall')}>
              <SortButton col="overall" label="Overall" sort={sort} onSort={onSort} />
            </th>
            {cols.map((c) => (
              <th key={c.key} scope="col" aria-sort={ariaSort(sort, c.key)}>
                <SortButton col={c.key} label={c.label} sort={sort} onSort={onSort} />
              </th>
            ))}
            {ICON_COLUMNS.map((c) => (
              <th key={c.key} scope="col" className="mx-col-icons">
                {c.label}
              </th>
            ))}
            <th scope="col" className="mx-col-chev">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {rows.map((r) => (
            <Row key={r.tool.slug} r={r} isOpen={selected === r.tool.slug} compared={compare.includes(r.tool.slug)} compareFull={compareFull} onSelect={onSelect} onCompare={onCompare} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ScoreTable
