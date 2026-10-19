import { useRouter } from 'next/router'
import { Search, X } from 'lucide-react'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Compare } from './Compare'
import { Controls } from './Controls'
import { Quadrant } from './Quadrant'
import { RANK_SORT, ScoreTable, sortRows } from './ScoreTable'
import type { TableRow, TableSort } from './ScoreTable'
import { axes, DEFAULT_MUST, DEFAULT_WEIGHTS, RANK_DIMENSIONS, meetsMustHaves, overall, scoreAll, toImportance } from '../../lib/multiplexers'
import { copySnapshot } from '../../lib/multiplexersSnapshot'
import type { Tool, Weights } from '../../lib/multiplexers'

const DORMANT = new Set(['dormant', 'abandoned', 'sunset'])

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])

/* URL state: ?w=.5,1,1.5,1.5,1.5 (RANK_DIMENSIONS order)&must=a.b,c.d&top=10&tool=slug&cmp=a,b
   Defaults are omitted; an explicit empty `must=` means "no requirements". */
function encode(w: Weights, must: string[], top: number, tool: string | null, cmp: string[]): Record<string, string> {
  const q: Record<string, string> = {}
  const ws = RANK_DIMENSIONS.map((d) => w[d.key] ?? 1)
  if (RANK_DIMENSIONS.some((d, i) => ws[i] !== DEFAULT_WEIGHTS[d.key])) q.w = ws.join(',')
  if (!sameSet(must, DEFAULT_MUST)) q.must = must.join(',')
  if (Number.isFinite(top)) q.top = String(top)
  if (tool) q.tool = tool
  if (cmp.length) q.cmp = cmp.join(',')
  return q
}

function decode(query: Record<string, string | string[] | undefined>) {
  const w: Weights = { ...DEFAULT_WEIGHTS }
  const ws = typeof query.w === 'string' ? query.w.split(',').map(Number) : []
  RANK_DIMENSIONS.forEach((d, i) => {
    if (Number.isFinite(ws[i])) w[d.key] = toImportance(ws[i])
  })
  const must = typeof query.must === 'string' ? query.must.split(',').filter(Boolean) : [...DEFAULT_MUST]
  const top = typeof query.top === 'string' && Number.isFinite(Number(query.top)) ? Number(query.top) : Infinity
  const tool = typeof query.tool === 'string' ? query.tool : null
  const cmp = typeof query.cmp === 'string' ? query.cmp.split(',').filter(Boolean) : []
  return { w, must, top, tool, cmp }
}

/**
 * State owner for the whole page: weights, must-haves, dormant toggle,
 * selection and comparison. The page renders the three Explorer* pieces
 * below wherever it likes, so prose can sit between map, controls and table.
 */
export function useExplorer(tools: Tool[]) {
  const router = useRouter()
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS)
  const [must, setMust] = useState<string[]>(DEFAULT_MUST)
  const [top, setTop] = useState<number>(Infinity)
  const [selected, setSelected] = useState<string | null>(null)
  const [card, setCard] = useState<string | null>(null)
  const [compare, setCompare] = useState<string[]>([])
  const hydrated = useRef(false)

  // Read URL state once after mount (never during SSR, so no hydration mismatch).
  useEffect(() => {
    if (!router.isReady || hydrated.current) return
    hydrated.current = true
    const d = decode(router.query)
    setWeights(d.w)
    setMust(d.must)
    setTop(d.top)
    if (d.tool && tools.some((t) => t.slug === d.tool)) setSelected(d.tool)
    setCompare(d.cmp.filter((c) => tools.some((t) => t.slug === c)).slice(0, 4))
  }, [router.isReady, router.query, tools])

  // Write URL state, debounced, shallow.
  useEffect(() => {
    if (!hydrated.current) return
    const id = setTimeout(() => {
      const q = encode(weights, must, top, selected, compare)
      const current = Object.fromEntries(Object.entries(router.query).filter(([k]) => ['w', 'must', 'top', 'tool', 'cmp'].includes(k)))
      if (JSON.stringify(q) !== JSON.stringify(current)) {
        router.replace({ pathname: router.pathname, query: q }, undefined, { shallow: true, scroll: false })
      }
    }, 300)
    return () => clearTimeout(id)
  }, [weights, must, top, selected, compare]) // eslint-disable-line react-hooks/exhaustive-deps

  const scores = useMemo(() => scoreAll(tools), [tools])

  const rows: TableRow[] = useMemo(() => {
    const all = tools.map((tool) => {
      const s = scores[tool.slug]
      const { x, y } = axes(s, weights)
      return { tool, scored: s, overall: overall(s, weights), x, y, missing: meetsMustHaves(tool, must).missing, dimmed: DORMANT.has(tool.status.lifecycle) }
    })
    // Requirements are gates: a tool that misses one is not shown anywhere.
    // Dormant, abandoned and sunset tools stay in, greyed, at the end.
    // Ties go to the better product (the map's x), not the alphabet.
    const kept = all
      .filter((r) => r.missing.length === 0)
      .sort((a, b) => Number(a.dimmed) - Number(b.dimmed) || b.overall - a.overall || b.x - a.x)
      .map((r, i) => ({ ...r, rank: i + 1 }))
    return Number.isFinite(top) ? kept.slice(0, top) : kept
  }, [tools, scores, weights, must, top])

  /** Everything that passes the requirements, before the top-N cut. */
  const matching = useMemo(() => tools.filter((t) => meetsMustHaves(t, must).ok).length, [tools, must])

  const select = useCallback((slug: string | null) => {
    setSelected(slug)
    if (slug) {
      requestAnimationFrame(() => document.getElementById(`tool-${slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    }
  }, [])

  const toggleCompare = useCallback((slug: string) => {
    setCompare((c) => (c.includes(slug) ? c.filter((x) => x !== slug) : c.length >= 4 ? c : [...c, slug]))
  }, [])

  const reset = useCallback(() => {
    setWeights(DEFAULT_WEIGHTS)
    setMust([...DEFAULT_MUST])
    setTop(Infinity)
  }, [])

  /**
   * Apply what the intent box read. The sentence is the spec, so it replaces
   * the requirements; a weight the reader didn't express (neutral 1×) keeps
   * its default.
   */
  const applyIntent = useCallback((m: string[], w: Weights) => {
    setMust(m)
    setWeights((prev) => {
      const next = { ...prev }
      for (const d of RANK_DIMENSIONS) next[d.key] = w[d.key] === 1 || w[d.key] == null ? DEFAULT_WEIGHTS[d.key] : w[d.key]
      return next
    })
  }, [])

  return { weights, setWeights, must, setMust, top, setTop, matching, selected, select, card, setCard, compare, toggleCompare, reset, applyIntent, scores, rows }
}

export type Explorer = ReturnType<typeof useExplorer>

/** Small deterministic offset from a slug, so exact ties fan out the same way every render. */
function jitter(slug: string, salt: number): number {
  let h = 2166136261 ^ salt
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000 - 0.5
}

/**
 * Plot positions (0–100). Three ways to place tools were tried and each
 * failed alone. Strict rank turned every tie into a diagonal staircase.
 * Scaling between the field's own min and max flung a lone outlier into a
 * corner for being last. Scaling on the absolute 1–5 tier scale was honest
 * but squeezed fifty tools into the middle third, because nearly everything
 * scores between 3 and 4.5. So each axis blends the two honest signals:
 * mostly where the tool stands in the field (its percentile, with ties
 * sharing one position), nudged by how big the score gap really is (the
 * absolute scale, median on the midline). The pack fills the plot, the
 * median still sits on the midline, equal scores still sit together, and a
 * tool a whole tier ahead is a little further out than rank alone would put
 * it. Ties are then jittered by a hash and relaxed apart so a cluster reads
 * as a cluster.
 */
const RANK_SHARE = 0.7

function axisMapper(values: number[]): (v: number) => number {
  const lo = 8
  const hi = 92
  const min = 1
  const max = 5
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  if (!n) return () => 50
  const mid = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2
  // Percentile with ties averaged, so equal scores share one spot.
  const percentile = (v: number) => {
    if (n === 1) return 0.5
    const first = sorted.indexOf(v)
    const last = sorted.lastIndexOf(v)
    return (first + last) / 2 / (n - 1)
  }
  // Absolute tier scale, piecewise so the field's median lands on 0.5.
  const absolute = (v: number) => {
    const c = Math.max(min, Math.min(max, v))
    if (c <= mid) return mid - min < 1e-6 ? 0.5 : ((c - min) / (mid - min)) * 0.5
    return max - mid < 1e-6 ? 0.5 : 0.5 + ((c - mid) / (max - mid)) * 0.5
  }
  return (v: number) => lo + (RANK_SHARE * percentile(v) + (1 - RANK_SHARE) * absolute(v)) * (hi - lo)
}

/**
 * Where the plot's own text sits, in plot percent with y up: the corner names
 * and the axis labels. Measured at desktop width, with a mark's half-size added.
 */
const PLOT_TEXT = [
  { x0: 0, x1: 16.5, y0: 90, y1: 100 },
  { x0: 74.5, x1: 100, y0: 90, y1: 100 },
  { x0: 0, x1: 13.5, y0: 0, y1: 10 },
  { x0: 83.5, x1: 100, y0: 0, y1: 10 },
  { x0: 41.5, x1: 58.5, y0: 0, y1: 8 },
  { x0: 0, x1: 6, y0: 40, y1: 60 },
]

function layout(rows: TableRow[]): { x: number; y: number }[] {
  const lo = 7
  const hi = 93
  const mx = axisMapper(rows.map((r) => r.x))
  const my = axisMapper(rows.map((r) => r.y))
  const pts = rows.map((r) => ({ x: mx(r.x) + jitter(r.tool.slug, 1) * 3, y: my(r.y) + jitter(r.tool.slug, 2) * 3 }))
  // The plot is 4:3, so a unit of y is 3/4 of a unit of x on screen.
  const ay = 3 / 4
  const min = 6.2
  for (let iter = 0; iter < 120; iter++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x
        if (dx >= min || dx <= -min) continue
        const dy = (pts[j].y - pts[i].y) * ay
        if (dy >= min || dy <= -min) continue
        const d = Math.sqrt(dx * dx + dy * dy) || 0.001
        if (d >= min - 0.01) continue
        moved = true
        const push = ((min - d) / d) * 0.5
        const ux = dx * push
        const uy = (dy * push) / ay
        pts[i].x -= ux
        pts[i].y -= uy
        pts[j].x += ux
        pts[j].y += uy
      }
    }
    for (const p of pts) {
      p.x = Math.max(lo - 2, Math.min(hi + 2, p.x))
      p.y = Math.max(lo - 2, Math.min(hi + 2, p.y))
      // Step off any plot text along the shorter way out.
      for (const b of PLOT_TEXT) {
        if (p.x <= b.x0 || p.x >= b.x1 || p.y <= b.y0 || p.y >= b.y1) continue
        // Only exits that stay inside the plot.
        const exits: [number, () => void][] = []
        if (b.x0 > 0) exits.push([p.x - b.x0, () => (p.x = b.x0)])
        if (b.x1 < 100) exits.push([b.x1 - p.x, () => (p.x = b.x1)])
        if (b.y0 > 0) exits.push([(p.y - b.y0) * ay, () => (p.y = b.y0)])
        if (b.y1 < 100) exits.push([(b.y1 - p.y) * ay, () => (p.y = b.y1)])
        exits.sort((a, c) => a[0] - c[0])[0]?.[1]()
        moved = true
      }
    }
    // Settled: nothing overlaps, so further passes would change nothing.
    if (!moved) break
  }
  return pts.map((p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 }))
}

export function ExplorerQuadrant({ ex, total, date }: { ex: Explorer; total: number; date: string }) {
  // Quiet tools are greyed in the table, not plotted.
  const live = useMemo(() => ex.rows.filter((r) => !r.dimmed), [ex.rows])
  // The relaxation is the slow part of a render, so it only reruns when the rows change.
  const placed = useMemo(() => layout(live), [live])
  const points = live.map((r, i) => ({
    slug: r.tool.slug,
    name: r.tool.name,
    x: placed[i].x,
    y: placed[i].y,
    overall: r.overall,
    reach: r.scored.dims.reach,
    pace: r.scored.dims.pace,
    tool: r.tool,
    scored: r.scored,
  }))
  const snapshot = () =>
    copySnapshot({
      points,
      must: ex.must,
      weights: ex.weights,
      top: ex.top,
      matching: ex.matching,
      total,
      dark: typeof window !== 'undefined' && (document.body.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches),
      date,
    })
  return (
    <Quadrant
      points={points}
      card={ex.card}
      onCard={ex.setCard}
      onMore={(slug) => {
        ex.setCard(null)
        ex.select(slug)
      }}
      onSnapshot={snapshot}
      empty={live.length === 0}
    />
  )
}

export function ExplorerControls({ ex, total }: { ex: Explorer; total: number }) {
  return (
    <Controls
      weights={ex.weights}
      must={ex.must}
      top={ex.top}
      matching={ex.matching}
      total={total}
      onWeights={ex.setWeights}
      onMust={ex.setMust}
      onTop={ex.setTop}
      onIntent={ex.applyIntent}
      onReset={ex.reset}
    />
  )
}

/** What the search box looks through: name, maker, tagline, value prop, surface and agents. Built once per tool. */
function haystack(t: Tool): string {
  return [t.name, t.maker?.name, t.tagline, t.valueProp, t.taxonomy?.surface, ...(t.supportedAgents || [])].filter(Boolean).join(' ').toLowerCase()
}

/** Rows shown before "Show all". A search, an opened row further down, or the button lifts the cut. */
const TABLE_CUT = 20

export function ExplorerTable({ ex, tools }: { ex: Explorer; tools: Tool[] }) {
  const compared = ex.compare.map((s) => tools.find((t) => t.slug === s)).filter(Boolean) as Tool[]
  const [q, setQ] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [sort, setSort] = useState<TableSort>(RANK_SORT)
  // The input updates at once; the table follows a beat later so typing never waits on a re-render.
  const query = useDeferredValue(q)
  const hays = useMemo(() => new Map(tools.map((t) => [t.slug, haystack(t)])), [tools])
  const sorted = useMemo(() => sortRows(ex.rows, sort), [ex.rows, sort])
  const matched = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length) return sorted
    return sorted.filter((r) => {
      const hay = hays.get(r.tool.slug) || ''
      return words.every((w) => hay.includes(w))
    })
  }, [sorted, query, hays])
  // An opened row below the cut (from the map, Notable names or the URL) must be in the table to scroll to.
  const selectedBelowCut = ex.selected != null && matched.findIndex((r) => r.tool.slug === ex.selected) >= TABLE_CUT
  const cut = !showAll && !query.trim() && !selectedBelowCut && matched.length > TABLE_CUT
  const shown = cut ? matched.slice(0, TABLE_CUT) : matched
  const motionKey = useMemo(() => sorted.map((r) => r.tool.slug).join(' '), [sorted])
  return (
    <>
      <div className="mx-wide">
        <Compare tools={compared} scores={ex.scores} onRemove={ex.toggleCompare} onClear={() => compared.forEach((t) => ex.toggleCompare(t.slug))} />
      </div>
      <div className="mx-index mx-wide">
        <div className="mx-index-bar">
          <label className="mx-search">
            <Search size={14} strokeWidth={2} aria-hidden />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a tool, maker or agent" aria-label="Search the index" spellCheck={false} />
            {q && (
              <button type="button" className="mx-icon-btn" onClick={() => setQ('')} aria-label="Clear search">
                <X size={12} strokeWidth={2} />
              </button>
            )}
          </label>
          <span className="mx-controls-count">
            {query.trim() ? (
              <>
                <b>{shown.length}</b> of {ex.rows.length} match “{query.trim()}”
              </>
            ) : (
              <>
                <b>{ex.rows.length}</b> tools
              </>
            )}
          </span>
        </div>
        <ScoreTable
          rows={shown}
          motionKey={motionKey}
          selected={ex.selected}
          compare={ex.compare}
          onSelect={ex.select}
          onCompare={ex.toggleCompare}
          sort={sort}
          onSort={setSort}
        />
        {cut && (
          <div className="mx-table-more">
            <button type="button" className="mx-btn" onClick={() => setShowAll(true)}>
              Show all {matched.length}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
