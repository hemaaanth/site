import type { Options } from 'highcharts'

// A small color swatch (matches the legend symbol) prefixing each tooltip row.
const SWATCH = '<span class="highcharts-color-{point.colorIndex} hc-sw">▪</span> '

/**
 * Structural / behavioural defaults that CSS cannot own. ALL presentation
 * (colors, fonts, weights, strokes) lives in styles/highcharts.css via styled
 * mode. Applied once via Highcharts.setOptions (see highcharts.ts).
 */
export const baseTheme: Options = {
  chart: {
    styledMode: true,
    // The card's padding provides outer breathing room, so keep chart spacing
    // modest — just enough for axis labels to clear the canvas edge.
    spacing: [16, 12, 10, 12],
    animation: { duration: 350 },
  },
  // Title & subtitle are rendered as HTML chrome by <Chart>, never by Highcharts.
  title: { text: undefined },
  subtitle: { text: undefined },
  credits: { enabled: false },
  legend: {
    align: 'center',
    verticalAlign: 'bottom',
    squareSymbol: true,
    symbolRadius: 6,
    events: {
      // Prevent hiding the last visible series (which would empty the chart).
      // Per the v13 API, returning false / preventDefault cancels the toggle.
      itemClick: function (this: any, e: any): boolean | void {
        const item = e && e.legendItem
        if (!item || item.series) return // skip points (pie/funnel slices)
        const chart = item.chart || (this && this.chart)
        if (!chart || !chart.series) return
        const visibleCount = chart.series.filter((s: any) => s.visible).length
        if (item.visible && visibleCount <= 1) {
          if (e.preventDefault) e.preventDefault()
          return false
        }
      },
    },
  },
  tooltip: {
    shared: true,
    outside: true,
    // A plain rounded box (the SVG box supplies the background) — never a
    // callout pointer.
    shape: 'rect',
    borderRadius: 8,
    padding: 10,
    // No header: the category/name just repeats what's already on the chart.
    // A small square swatch (matching the legend symbol) carries the color.
    headerFormat: '',
    pointFormat: `${SWATCH}{series.name}: <b>{point.y}</b><br/>`,
  },
  // Tighten layout when the CHART (not the viewport) is small — covers narrow
  // columns and phones alike. Font sizes are styled-mode CSS, so those shrink
  // via a viewport @media rule in highcharts.css instead.
  responsive: {
    rules: [
      {
        condition: { maxWidth: 520 },
        chartOptions: {
          chart: { spacing: [12, 8, 8, 8] },
          legend: { symbolRadius: 5, itemDistance: 12 },
        },
      },
    ],
  },
  plotOptions: {
    series: {
      events: {
        // Guarantee: if anything hides the last visible series (legend or
        // otherwise), immediately re-show it so the chart is never empty.
        hide: function (this: any) {
          const chart = this.chart
          if (
            chart &&
            chart.series &&
            chart.series.filter((s: any) => s.visible).length === 0
          ) {
            this.setVisible(true)
          }
        },
      },
    },
    // Clean editorial lines: no static markers (they still appear on hover).
    // pointPlacement:'on' makes the line span the full plot width on category
    // axes (first point at the y-axis, last at the right edge) instead of
    // leaving a half-category gap. Columns/bars keep their default band placement.
    line: { marker: { enabled: false }, pointPlacement: 'on' },
    spline: { marker: { enabled: false }, pointPlacement: 'on' },
    area: { marker: { enabled: false }, pointPlacement: 'on' },
    areaspline: { marker: { enabled: false }, pointPlacement: 'on' },
    // Spread these across the palette instead of a single hue, and override the
    // tooltip: the global {series.name}: {point.y} is wrong for these types —
    // the slice/node NAME carries the meaning, and several store the number in
    // `value`/`weight`/`sum` rather than `y`. (Funnel/pyramid are pie-family and
    // already color by point in styled mode.)
    treemap: {
      colorByPoint: true,
      tooltip: { headerFormat: '', pointFormat: `${SWATCH}{point.name}: <b>{point.value}</b>` },
    },
    sunburst: {
      colorByPoint: true,
      tooltip: { headerFormat: '', pointFormat: `${SWATCH}{point.name}: <b>{point.value}</b>` },
    },
    pie: {
      tooltip: { headerFormat: '', pointFormat: `${SWATCH}{point.name}: <b>{point.y}</b>` },
    },
    funnel: {
      tooltip: { headerFormat: '', pointFormat: `${SWATCH}{point.name}: <b>{point.y}</b>` },
    },
    pyramid: {
      tooltip: { headerFormat: '', pointFormat: `${SWATCH}{point.name}: <b>{point.y}</b>` },
    },
    heatmap: {
      tooltip: { headerFormat: '', pointFormat: '<b>{point.value}</b>' },
    },
    sankey: {
      tooltip: {
        headerFormat: '',
        nodeFormat: '{point.name}: <b>{point.sum}</b>',
        pointFormat: '{point.from} → {point.to}: <b>{point.weight}</b>',
      },
    },
    dependencywheel: {
      tooltip: {
        headerFormat: '',
        nodeFormat: '{point.name}: <b>{point.sum}</b>',
        pointFormat: '{point.from} → {point.to}: <b>{point.weight}</b>',
      },
    },
  },
  lang: { thousandsSep: ',' },
  accessibility: { enabled: true },
  exporting: { enabled: false },
}

export function applyBaseTheme(H: { setOptions: (o: Options) => void }): void {
  H.setOptions(baseTheme)
}
