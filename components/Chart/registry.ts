import { isPristine } from './controls'
import type { SeriesSnapshot } from './controls'

/**
 * Client-side registry mapping a chart's `id` to its live Highcharts instance
 * (plus its reset-snapshot and a `dirty` flag). Charts register on mount;
 * standalone <ChartControls> buttons look them up by id, act on them, and
 * subscribe to dirty changes to enable/disable themselves.
 *
 * Only ever touched on the client, so there's no SSR/shared-state concern.
 */
interface RegistryEntry {
  chart: any
  snapshot: SeriesSnapshot[]
  dirty: boolean
}

const registry = new Map<string, RegistryEntry>()
const listeners = new Set<() => void>()

function emit(): void {
  listeners.forEach((l) => l())
}

/** Subscribe to registry changes (register/unregister/dirty). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function registerChart(
  id: string,
  chart: any,
  snapshot: SeriesSnapshot[],
): void {
  registry.set(id, { chart, snapshot, dirty: false })
  emit()
}

export function unregisterChart(id: string): void {
  if (registry.delete(id)) emit()
}

export function getChartEntry(id: string): RegistryEntry | undefined {
  return registry.get(id)
}

/** Recompute a chart's dirty flag (call after applying actions to it). */
export function refreshDirty(id: string): void {
  const entry = registry.get(id)
  if (!entry) return
  const dirty = !isPristine(entry.chart, entry.snapshot)
  if (entry.dirty !== dirty) {
    entry.dirty = dirty
    emit()
  }
}

export function isDirty(id: string): boolean {
  return !!registry.get(id)?.dirty
}
