import type { Options } from 'highcharts'

export type ChartWidth = 'column' | 'wide' | 'full'

/** A single declarative manipulation applied to the live chart. */
export type ChartActionType =
  | 'isolate'
  | 'highlight'
  | 'recolor'
  | 'setData'
  | 'reset'

export interface ChartAction {
  type: ChartActionType
  /** Target series — index(es) or name(s), matched against series.name. */
  series?: number | string | (number | string)[]
  /** For recolor: brand palette index (0–9). */
  colorIndex?: number
  /** For setData: the replacement data array. */
  data?: any[]
}

/** One chart targeted by a button, with the actions to run on it. */
export interface ChartButtonTarget {
  chartId: string
  actions: ChartAction[]
}

/**
 * A standalone storytelling button (rendered by <ChartControls>, placed
 * anywhere in the post). It targets one or more charts by id — use the single-
 * chart shorthand (chartId + actions) or the multi-chart `targets` form. A
 * 'toggle' button restores the chart's pre-toggle state when switched off.
 */
export interface ChartButtonDef {
  label: string
  /** 'toggle' = stateful on/off button; default 'action' = one-shot. */
  mode?: 'action' | 'toggle'
  // Single-chart shorthand:
  chartId?: string
  actions?: ChartAction[]
  // Multi-chart form:
  targets?: ChartButtonTarget[]
}

/** Shape of the Sanity `chart` block and the <Chart> component props. */
export interface ChartProps {
  /** Raw Highcharts options as a JSON string (the CMS blob) or a parsed object. */
  config: string | Record<string, any>
  /** HTML chrome — rendered by us, NOT by Highcharts. */
  title?: string
  subtitle?: string
  caption?: string
  /** Accessibility / SEO description. Falls back to the title. */
  altText?: string
  width?: ChartWidth
  /** CSS aspect-ratio for the canvas box, e.g. '16/9'. */
  aspectRatio?: string
  frame?: boolean
  /**
   * 'simple' = illustrative: strips numeric axis labels, ticks and gridlines so
   * only the shape reads (axis titles are kept). For "time vs happiness" charts
   * where the specifics don't matter. Defaults to 'standard'.
   */
  variant?: 'standard' | 'simple'
  /** Stable id so standalone <ChartControls> buttons can target this chart. */
  id?: string
}

export interface ParseResult {
  ok: boolean
  /** Present when ok. */
  value?: Record<string, any>
  /** Present when not ok. */
  error?: string
}

export interface NormalizeResult {
  options: Options
  warnings: string[]
  error?: string
}
