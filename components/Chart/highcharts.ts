/**
 * Single source of truth for the Highcharts instance.
 *
 * Imports the core + every Highcharts (core-product) module as side effects —
 * each self-registers on the shared namespace — and applies the structural
 * brand theme exactly once. ALWAYS import Highcharts from here, never from
 * 'highcharts' directly, so modules + theme are guaranteed to be registered on
 * the same instance we render with.
 *
 * Only ever imported by client-only code (ChartClient), so the heavy Highcharts
 * bundle is code-split out of SSR and chart-free pages.
 */
import Highcharts from 'highcharts/esm/highcharts'

// Foundational
import 'highcharts/esm/highcharts-more' // bubble, packedbubble, polar, gauge, ranges, boxplot, errorbar, waterfall, dumbbell base
import 'highcharts/esm/highcharts-3d'

// Series-type modules (load-order-sensitive chains respected)
import 'highcharts/esm/modules/heatmap'
import 'highcharts/esm/modules/tilemap'
import 'highcharts/esm/modules/treemap'
import 'highcharts/esm/modules/treegraph'
import 'highcharts/esm/modules/sunburst'
import 'highcharts/esm/modules/sankey'
import 'highcharts/esm/modules/dependency-wheel'
import 'highcharts/esm/modules/organization'
import 'highcharts/esm/modules/arc-diagram'
import 'highcharts/esm/modules/networkgraph'
import 'highcharts/esm/modules/funnel'
import 'highcharts/esm/modules/item-series'
import 'highcharts/esm/modules/wordcloud'
import 'highcharts/esm/modules/vector'
import 'highcharts/esm/modules/xrange'
import 'highcharts/esm/modules/bullet'
import 'highcharts/esm/modules/variwide'
import 'highcharts/esm/modules/streamgraph'
import 'highcharts/esm/modules/timeline'
import 'highcharts/esm/modules/venn'
import 'highcharts/esm/modules/solid-gauge'
import 'highcharts/esm/modules/dumbbell'
import 'highcharts/esm/modules/lollipop'
import 'highcharts/esm/modules/histogram-bellcurve'
import 'highcharts/esm/modules/pareto'

// Feature modules
import 'highcharts/esm/modules/pattern-fill'
import 'highcharts/esm/modules/annotations'
import 'highcharts/esm/modules/exporting'
import 'highcharts/esm/modules/export-data'
import 'highcharts/esm/modules/offline-exporting'
import 'highcharts/esm/modules/accessibility' // must load LAST

import { applyBaseTheme } from './theme'

// ESM singleton: this module runs once, so the structural theme is applied once.
// (Re-running on dev HMR is harmless — setOptions just re-merges the same theme.)
applyBaseTheme(Highcharts)

// Expose for console debugging / inspection in development only.
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  ;(window as any).Highcharts = Highcharts
}

export default Highcharts
