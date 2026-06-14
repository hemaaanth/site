import type { ChartAction } from './types'

// Stega/zero-width strip, matching parseBlob.ts.
const ZERO_WIDTH = new RegExp('[\\u200B-\\u200D\\uFEFF\\u2060]', 'g')

/** Original per-series state, captured at chart creation, for `reset`. */
export interface SeriesSnapshot {
  visible: boolean
  colorIndex: number | undefined
  data: any
  /** '' (normal) or 'inactive' (dimmed by a highlight). */
  state: string
}

export function snapshotSeries(chart: any): SeriesSnapshot[] {
  if (!chart || !chart.series) return []
  return chart.series.map((s: any) => ({
    visible: s.visible,
    // The ACTUAL rendered index (default = series order), not s.options.colorIndex
    // which is undefined for default-colored series — so reset can restore it.
    colorIndex: s.colorIndex,
    // A deep copy, so a later setData can't mutate the original we restore to.
    data:
      s.options && s.options.data
        ? JSON.parse(JSON.stringify(s.options.data))
        : undefined,
    state: s.state || '',
  }))
}

/** Restore series to a captured snapshot (visibility, color, data, state). */
export function restoreSnapshot(chart: any, snapshot: SeriesSnapshot[]): void {
  if (!chart || !chart.series) return
  chart.series.forEach((s: any, i: number) => {
    const snap = snapshot[i]
    if (!snap) return
    // Only touch what actually changed (so an unrelated update/setData can't
    // re-trigger an inactive/highlight state), and set the state LAST so it wins.
    if (s.colorIndex !== snap.colorIndex) {
      s.update({ colorIndex: snap.colorIndex }, false)
    }
    if (s.visible !== snap.visible) s.setVisible(snap.visible, false)
    if (
      Array.isArray(snap.data) &&
      JSON.stringify(s.options && s.options.data) !== JSON.stringify(snap.data)
    ) {
      s.setData(snap.data, false)
    }
    s.setState(snap.state || '')
  })
}

/** True if the chart still matches its original snapshot (nothing to reset). */
export function isPristine(chart: any, snapshot: SeriesSnapshot[]): boolean {
  if (!chart || !chart.series) return true
  return chart.series.every((s: any, i: number) => {
    const snap = snapshot[i]
    if (!snap) return true
    if (s.visible !== snap.visible) return false
    if (s.colorIndex !== snap.colorIndex) return false
    if (s.state === 'inactive') return false // a highlight has dimmed it
    const data = s.options ? s.options.data : undefined
    return JSON.stringify(data) === JSON.stringify(snap.data)
  })
}

/** Parse a JSON array spec (array, or JSON string from the CMS). Never eval. */
export function parseJsonArray<T>(input: T[] | string | undefined): T[] {
  if (Array.isArray(input)) return input
  if (typeof input !== 'string' || !input.trim()) return []
  try {
    const value = JSON.parse(input.replace(ZERO_WIDTH, ''))
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

/**
 * Resolve an action's `series` spec to concrete indices. Accepts indices,
 * series NAMES (case-insensitive, matched against series.name), or a mix — so
 * CMS authors can write ["Direct"] instead of [0]. Unknown names are dropped
 * (with a dev warning).
 */
function resolveIndices(
  chart: any,
  spec: number | string | (number | string)[] | undefined,
): number[] {
  if (spec == null) return []
  const series = chart.series || []
  const one = (v: number | string): number => {
    if (typeof v === 'number') return v
    const i = series.findIndex(
      (s: any) => (s.name || '').toLowerCase() === String(v).toLowerCase(),
    )
    if (i < 0 && process.env.NODE_ENV !== 'production') {
      console.warn(`[chart] no series named "${v}"`)
    }
    return i
  }
  return (Array.isArray(spec) ? spec : [spec]).map(one).filter((i) => i >= 0)
}

function applyAction(
  chart: any,
  action: ChartAction,
  snapshot: SeriesSnapshot[],
): void {
  const series = chart.series || []
  const targets = resolveIndices(chart, action.series)
  switch (action.type) {
    case 'isolate':
      series.forEach((s: any, i: number) =>
        s.setVisible(targets.includes(i), false),
      )
      break
    case 'highlight':
      // Dim the non-targets via Highcharts' inactive state (CSS opacity).
      series.forEach((s: any, i: number) =>
        s.setState(targets.includes(i) ? '' : 'inactive'),
      )
      break
    case 'recolor':
      if (action.colorIndex != null) {
        targets.forEach(
          (i) =>
            series[i] &&
            series[i].update({ colorIndex: action.colorIndex }, false),
        )
      }
      break
    case 'setData': {
      const i = targets[0]
      if (typeof i === 'number' && series[i] && Array.isArray(action.data)) {
        series[i].setData(action.data, false)
      }
      break
    }
    case 'reset':
      restoreSnapshot(chart, snapshot)
      break
  }
}

/** Apply a list of actions and redraw once. */
export function applyActions(
  chart: any,
  actions: ChartAction[] | undefined,
  snapshot: SeriesSnapshot[],
): void {
  if (!chart || !Array.isArray(actions)) return
  actions.forEach((a) => applyAction(chart, a, snapshot))
  chart.redraw()
}
