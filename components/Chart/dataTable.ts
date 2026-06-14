// Server-safe text layer for charts: a semantic data table + an alt-text
// summary, both derived from the raw Highcharts config WITHOUT importing
// highcharts. The interactive SVG is client-only (invisible to non-JS crawlers
// / AI and screen readers), so this is what they read instead. Rendered into the
// SSR HTML by components/Chart/index.tsx.
import { safeParse } from './parseBlob'

export interface ChartTable {
  headers: string[]
  rows: (string | number)[][]
}

// Series types that read as "node → node (weight)".
const RELATIONAL = [
  'sankey',
  'dependencywheel',
  'networkgraph',
  'arcdiagram',
  'organization',
]
// Series types that read as a flat "name → value" list.
const NAME_VALUE = [
  'pie',
  'funnel',
  'pyramid',
  'sunburst',
  'treemap',
  'variwide',
  'venn',
]

function chartType(v: any): string {
  return (
    v?.chart?.type ||
    (Array.isArray(v?.series) && v.series[0]?.type) ||
    'line'
  )
}

function xAxis(v: any): any {
  return Array.isArray(v?.xAxis) ? v.xAxis[0] : v?.xAxis
}

function categoriesOf(v: any): any[] | null {
  const ax = xAxis(v)
  return ax && Array.isArray(ax.categories) ? ax.categories : null
}

function seriesName(s: any, i: number): string {
  return (s && typeof s.name === 'string' && s.name) || `Series ${i + 1}`
}

function num(v: any): number | string {
  return typeof v === 'number' ? v : v == null ? '' : String(v)
}

function pointName(p: any, i: number): string {
  if (p && typeof p === 'object' && !Array.isArray(p) && p.name != null) {
    return String(p.name)
  }
  if (Array.isArray(p) && typeof p[0] === 'string') return p[0]
  return String(i + 1)
}

function pointValue(p: any): number | string {
  if (p == null) return ''
  if (typeof p === 'number') return p
  if (Array.isArray(p)) return num(p[p.length - 1])
  if (typeof p === 'object') return num(p.y ?? p.value ?? p.weight ?? '')
  return ''
}

function tableFrom(v: any): ChartTable | null {
  const series = Array.isArray(v?.series) ? v.series : []
  if (!series.length) return null
  const type = chartType(v)

  if (RELATIONAL.includes(type)) {
    const rows: (string | number)[][] = []
    for (const s of series) {
      for (const d of Array.isArray(s?.data) ? s.data : []) {
        if (Array.isArray(d)) rows.push([d[0] ?? '', d[1] ?? '', num(d[2])])
        else if (d && typeof d === 'object') {
          rows.push([d.from ?? '', d.to ?? '', num(d.weight ?? d.value)])
        }
      }
    }
    return rows.length ? { headers: ['From', 'To', 'Weight'], rows } : null
  }

  if (NAME_VALUE.includes(type)) {
    const rows: (string | number)[][] = []
    for (const s of series) {
      ;(Array.isArray(s?.data) ? s.data : []).forEach((p: any, i: number) =>
        rows.push([pointName(p, i), pointValue(p)]),
      )
    }
    return rows.length ? { headers: ['Name', 'Value'], rows } : null
  }

  // Cartesian with categories: category × each series' value.
  const categories = categoriesOf(v)
  if (categories && categories.length) {
    const ax = xAxis(v)
    const xLabel = (ax?.title?.text as string) || ''
    return {
      headers: [xLabel, ...series.map(seriesName)],
      rows: categories.map((c: any, i: number) => [
        typeof c === 'number' ? c : String(c),
        ...series.map((s: any) => pointValue((s?.data || [])[i])),
      ]),
    }
  }

  // No categories, plain numeric series: index × each series' value.
  if (
    series.every(
      (s: any) =>
        Array.isArray(s?.data) && s.data.every((p: any) => typeof p === 'number'),
    )
  ) {
    const len = Math.max(...series.map((s: any) => s.data.length))
    const rows: (string | number)[][] = []
    for (let i = 0; i < len; i++) {
      rows.push([i + 1, ...series.map((s: any) => num(s.data[i]))])
    }
    return { headers: ['#', ...series.map(seriesName)], rows }
  }

  // Single series of [x, y] pairs or {x, y} (scatter-like).
  if (series.length === 1 && Array.isArray(series[0]?.data)) {
    const data = series[0].data
    if (data.length && data.every((p: any) => Array.isArray(p) && p.length >= 2)) {
      return { headers: ['X', 'Y'], rows: data.map((p: any) => [num(p[0]), num(p[1])]) }
    }
    if (data.length && data.every((p: any) => p && typeof p === 'object' && 'x' in p && 'y' in p)) {
      return { headers: ['X', 'Y'], rows: data.map((p: any) => [num(p.x), num(p.y)]) }
    }
  }

  return null
}

function altFrom(v: any, title?: string): string {
  const type = chartType(v)
  const series = Array.isArray(v?.series) ? v.series : []
  const names = series.map(seriesName)
  const cats = categoriesOf(v)
  const parts: string[] = [`${type.charAt(0).toUpperCase()}${type.slice(1)} chart`]
  if (title) parts.push(`titled “${title}”`)
  if (names.length === 1) parts.push(`of ${names[0]}`)
  else if (names.length > 1) parts.push(`with ${names.length} series: ${names.join(', ')}`)
  if (cats && cats.length) parts.push(`across ${cats[0]}–${cats[cats.length - 1]}`)
  return `${parts.join(' ')}.`
}

/** Parse the config once → a data table (or null) + an alt-text summary. */
export function buildChartText(
  config: string | Record<string, any>,
  title?: string,
): { table: ChartTable | null; alt: string } {
  const parsed = safeParse(config)
  if (!parsed.ok || !parsed.value) {
    return { table: null, alt: title || 'Chart' }
  }
  return { table: tableFrom(parsed.value), alt: altFrom(parsed.value, title) }
}
