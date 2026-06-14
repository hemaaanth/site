import type { Options } from 'highcharts'
import Highcharts from './highcharts'
import { safeParse } from './parseBlob'
import type { ChartProps, NormalizeResult } from './types'

/**
 * styled mode is the one invariant the whole color/theme system relies on, so
 * re-assert it after merging the CMS blob — a stray `styledMode:false` would
 * break all theming. Everything else (palette, no native title/subtitle,
 * credits off) is owned by the global theme in theme.ts.
 */
const ENFORCED: Options = {
  chart: { styledMode: true },
}

// 'simple' / illustrative mode: strip the quantitative scaffolding (numeric
// labels, ticks, gridlines) so only the shape reads. Axis titles are kept.
const SIMPLE_AXIS = {
  labels: { enabled: false },
  gridLineWidth: 0,
  minorGridLineWidth: 0,
  tickWidth: 0,
  tickLength: 0,
  lineWidth: 1,
}

// For line/area on a NUMERIC x-axis: drop the default ~1% min/maxPadding so the
// shape hugs the y-axis (and right edge) edge-to-edge — matching how category
// charts sit on the axis via plotOptions.*.pointPlacement:'on'.
const SIMPLE_XAXIS_HUG = Highcharts.merge(SIMPLE_AXIS, {
  minPadding: 0,
  maxPadding: 0,
  startOnTick: false,
  endOnTick: false,
})

// Only the line family should hug the axis — columns/scatter would clip their
// first/last column or edge markers. Mirrors the pointPlacement:'on' set in
// theme.ts for exactly these types.
const LINE_FAMILY = ['line', 'spline', 'area', 'areaspline']

function isLineFamily(options: any): boolean {
  const chartType = (options.chart && options.chart.type) || 'line'
  const series = Array.isArray(options.series) ? options.series : []
  const types = series.length
    ? series.map((s: any) => s.type || chartType)
    : [chartType]
  return types.every((t: string) => LINE_FAMILY.includes(t))
}

function applySimpleMode(options: Options): Options {
  const clone = Highcharts.merge(true, {}, options) as any
  const apply = (axis: any, cfg: any) =>
    Array.isArray(axis)
      ? axis.map((a: any) => Highcharts.merge(a, cfg))
      : Highcharts.merge(axis || {}, cfg)
  clone.xAxis = apply(clone.xAxis, isLineFamily(clone) ? SIMPLE_XAXIS_HUG : SIMPLE_AXIS)
  clone.yAxis = apply(clone.yAxis, SIMPLE_AXIS)
  // gridLineWidth:0 is ignored in styled mode (stroke comes from CSS), so tag
  // the chart and hide gridlines via the .hc-simple rule in highcharts.css.
  clone.chart = clone.chart || {}
  clone.chart.className =
    (clone.chart.className ? clone.chart.className + ' ' : '') + 'hc-simple'
  // Fully static — illustrative charts are "practically jpegs": no tooltips, no
  // hover highlight, no point selection.
  return Highcharts.merge(clone, {
    tooltip: { enabled: false },
    plotOptions: {
      series: {
        enableMouseTracking: false,
        states: { inactive: { enabled: false } },
      },
    },
  })
}

export function normalizeChartOptions(
  config: string | Record<string, any>,
  opts: { variant?: ChartProps['variant'] } = {},
): NormalizeResult {
  const parsed = safeParse(config)
  if (parsed.ok) {
    let options = Highcharts.merge(parsed.value as Options, ENFORCED)
    if (opts.variant === 'simple') {
      options = applySimpleMode(options)
    }
    return { options, warnings: [] }
  }
  return { options: {}, warnings: [], error: parsed.error }
}
