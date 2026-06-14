import { useEffect, useMemo, useRef } from 'react'
import type { Chart as HCChart } from 'highcharts'
import Highcharts from './highcharts'
import { normalizeChartOptions } from './normalize'
import { snapshotSeries } from './controls'
import { registerChart, unregisterChart } from './registry'
import type { ChartProps } from './types'

/**
 * Client-only renderer. Owns the Highcharts lifecycle on OUR instance and, when
 * given an `id`, registers the live chart so standalone <ChartControls> buttons
 * (anywhere on the page) can target it.
 */
export default function ChartClient({
  config,
  variant,
  id,
}: Pick<ChartProps, 'config' | 'variant' | 'id'>) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<HCChart | null>(null)

  const { options, error } = useMemo(
    () => normalizeChartOptions(config, { variant }),
    [config, variant],
  )

  // Create / update / teardown in response to option (config) changes.
  useEffect(() => {
    if (error || !containerRef.current) {
      chartRef.current?.destroy()
      chartRef.current = null
      return
    }
    if (!chartRef.current) {
      chartRef.current = Highcharts.chart(containerRef.current, options)
    } else {
      chartRef.current.update(options, true, true)
    }
  }, [options, error])

  // Register in the shared registry (runs after the create/update effect above,
  // so chartRef is set) with a fresh reset-snapshot. Re-runs on id/options.
  useEffect(() => {
    if (!id || error || !chartRef.current) return
    registerChart(id, chartRef.current, snapshotSeries(chartRef.current))
    return () => unregisterChart(id)
  }, [id, options, error])

  // Reflow on container resize.
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => chartRef.current?.reflow())
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Destroy on unmount.
  useEffect(
    () => () => {
      chartRef.current?.destroy()
      chartRef.current = null
    },
    [],
  )

  if (error) {
    return (
      <div className="chart-error" role="alert">
        <strong>Chart config error:</strong> {error}
      </div>
    )
  }

  return <div ref={containerRef} className="chart-canvas-inner" />
}
