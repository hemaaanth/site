import { useEffect, useRef, useState } from 'react'
import {
  applyActions,
  parseJsonArray,
  restoreSnapshot,
  snapshotSeries,
} from '../Chart/controls'
import type { SeriesSnapshot } from '../Chart/controls'
import { getChartEntry, isDirty, refreshDirty, subscribe } from '../Chart/registry'
import type { ChartButtonDef, ChartButtonTarget } from '../Chart/types'

/**
 * Standalone storytelling buttons. Placed anywhere in a post (independent of the
 * charts), each button targets one or more charts BY ID and runs declarative
 * actions on them — so many buttons → one chart, one button → many charts.
 *
 * Buttons reflect chart state: a "reset" button is disabled until its target(s)
 * have something to reset; a one-shot action button disables once its target is
 * modified (until reset); toggles stay enabled.
 *
 * Interactivity is client-only and registry-dependent, so it renders nothing on
 * the server / first paint (no hydration mismatch).
 */
interface ChartControlsProps {
  /** Button definitions, or their JSON string (from the CMS). */
  buttons: ChartButtonDef[] | string
}

function targetsOf(btn: ChartButtonDef): ChartButtonTarget[] {
  if (btn.targets && btn.targets.length) return btn.targets
  if (btn.chartId) return [{ chartId: btn.chartId, actions: btn.actions || [] }]
  return []
}

function isResetButton(btn: ChartButtonDef): boolean {
  const ts = targetsOf(btn)
  return (
    ts.length > 0 &&
    ts.every(
      (t) =>
        (t.actions || []).length > 0 && t.actions.every((a) => a.type === 'reset'),
    )
  )
}

function runTargets(targets: ChartButtonTarget[]): void {
  targets.forEach((t) => {
    const entry = getChartEntry(t.chartId)
    if (entry) applyActions(entry.chart, t.actions, entry.snapshot)
    refreshDirty(t.chartId)
  })
}

// Per-toggle pre-state: a snapshot of each targeted chart taken when the toggle
// is switched ON, so switching OFF restores exactly that — undoing only the
// toggle's own effect, not other buttons' changes.
type PreStates = Record<number, Record<string, SeriesSnapshot[]>>

function captureToggle(btn: ChartButtonDef, i: number, store: PreStates): void {
  store[i] = {}
  targetsOf(btn).forEach((t) => {
    const entry = getChartEntry(t.chartId)
    if (entry) store[i][t.chartId] = snapshotSeries(entry.chart)
  })
}

function restoreToggle(btn: ChartButtonDef, i: number, store: PreStates): void {
  targetsOf(btn).forEach((t) => {
    const entry = getChartEntry(t.chartId)
    if (!entry) return
    restoreSnapshot(entry.chart, (store[i] && store[i][t.chartId]) || entry.snapshot)
    entry.chart.redraw()
    refreshDirty(t.chartId)
  })
}

export function ChartControls({ buttons }: ChartControlsProps) {
  const defs = parseJsonArray<ChartButtonDef>(buttons)
  const [mounted, setMounted] = useState(false)
  const [, bump] = useState(0)
  const [toggles, setToggles] = useState<Record<number, boolean>>({})
  // Per one-shot button: has IT fired (until its target(s) reset)? Tracked
  // explicitly so another button dirtying the same chart doesn't disable it.
  const [fired, setFired] = useState<Record<number, boolean>>({})
  const preStatesRef = useRef<PreStates>({})

  // Mount + subscribe to registry changes (dirty flags, (un)registration).
  useEffect(() => {
    setMounted(true)
    return subscribe(() => bump((v) => v + 1))
  }, [])

  // Keep button state honest: when a button's target chart(s) all go pristine
  // (e.g. a reset elsewhere), turn off any toggle and clear any one-shot
  // "fired" flag pointing at it, so it re-enables. Runs on every registry-
  // driven render by design; each setState is a no-op when nothing changed,
  // so there's no update loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const allPristine = (btn: ChartButtonDef) =>
      targetsOf(btn).every((t) => !isDirty(t.chartId))
    setToggles((prev) => {
      let changed = false
      const next = { ...prev }
      defs.forEach((btn, i) => {
        if (btn.mode === 'toggle' && next[i] && allPristine(btn)) {
          next[i] = false
          changed = true
        }
      })
      return changed ? next : prev
    })
    setFired((prev) => {
      let changed = false
      const next = { ...prev }
      defs.forEach((btn, i) => {
        if (next[i] && allPristine(btn)) {
          next[i] = false
          changed = true
        }
      })
      return changed ? next : prev
    })
  })

  if (!mounted || !defs.length) return null

  return (
    <div
      className="chart-controls chart-controls-standalone"
      role="group"
      aria-label="Chart controls"
    >
      {defs.map((btn, i) => {
        const ids = targetsOf(btn).map((t) => t.chartId)
        const reset = isResetButton(btn)
        const anyDirty = ids.some((id) => isDirty(id))
        // Reset: enabled only when there's something to reset. One-shot action:
        // disabled once IT has fired (until its target(s) reset), regardless of
        // what other buttons did to the chart. Toggles: always enabled.
        const disabled = reset ? !anyDirty : btn.mode !== 'toggle' && !!fired[i]

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            className={`chart-control-btn${toggles[i] ? ' is-active' : ''}`}
            aria-pressed={btn.mode === 'toggle' ? !!toggles[i] : undefined}
            onClick={() => {
              if (btn.mode === 'toggle') {
                const active = !!toggles[i]
                if (active) {
                  // Turning off: undo only this toggle's own effect by
                  // restoring the snapshot taken when it was switched on.
                  restoreToggle(btn, i, preStatesRef.current)
                } else {
                  captureToggle(btn, i, preStatesRef.current)
                  runTargets(targetsOf(btn))
                }
                setToggles((p) => ({ ...p, [i]: !active }))
              } else {
                runTargets(targetsOf(btn))
                // One-shot (non-reset): mark fired so it disables until reset.
                if (!reset) setFired((p) => ({ ...p, [i]: true }))
              }
            }}
          >
            {btn.label}
          </button>
        )
      })}
    </div>
  )
}

export default ChartControls
