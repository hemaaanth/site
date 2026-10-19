import type { KeyboardEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { IMPORTANCE } from '../../lib/multiplexers'

interface ImportanceProps {
  label: string
  hint: string
  value: number
  /** This dimension's part of the overall score, 0–1, if it were set to v. */
  share: (v: number) => number
  onChange: (v: number) => void
}

/** Pixels the pointer must travel before a press becomes a drag. */
const DRAG_SLOP = 3
/** Past either end, the first pixels do nothing; then the thumb gives a little, less and less, up to MAX_STRETCH. */
const DEAD_ZONE = 12
const MAX_STRETCH = 5
/** Spring tuned to settle quickly with a hint of overshoot. */
const STIFFNESS = 420
const DAMPING = 34
/** The scale's inner padding, which the thumb sits inside. */
const PAD = 2

const LAST = IMPORTANCE.length - 1
const stepOf = (v: number) => Math.max(0, IMPORTANCE.findIndex((l) => l.value === v))
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * How much one dimension counts: Ignore, Less, Normal, More or Most, with its
 * resulting share of the overall score on the right. Click a word, or drag
 * across the scale: the thumb follows the pointer freely and springs to the
 * nearest word on release. The ranking updates once, then.
 */
export function Importance({ label, hint, value, share, onChange }: ImportanceProps) {
  const scale = useRef<HTMLDivElement>(null)
  // Motion state lives in refs and is written straight to CSS variables, so a
  // drag only re-renders this row, and only when the word under the thumb changes.
  const s = useRef({ t: stepOf(value), vel: 0, over: 0, target: stepOf(value), raf: 0, last: 0 })
  const drag = useRef<{ id: number; x: number; moved: boolean; left: number; cell: number } | null>(null)
  const [live, setLive] = useState<number | null>(null)
  const shown = live ?? value
  const word = IMPORTANCE[stepOf(shown)].label
  const pct = Math.round(share(shown) * 100)

  const paint = () => {
    const el = scale.current
    if (!el) return
    el.style.setProperty('--t', String(s.current.t))
    el.style.setProperty('--over', `${s.current.over}px`)
  }

  const tick = (now: number) => {
    const m = s.current
    const dt = Math.min(1 / 30, (now - (m.last || now)) / 1000 || 1 / 60)
    m.last = now
    const a = -STIFFNESS * (m.t - m.target) - DAMPING * m.vel
    m.vel += a * dt
    m.t += m.vel * dt
    m.over *= 0.75
    if (Math.abs(m.t - m.target) < 0.002 && Math.abs(m.vel) < 0.01 && Math.abs(m.over) < 0.1) {
      m.t = m.target
      m.vel = m.over = 0
      m.raf = 0
    } else {
      m.raf = requestAnimationFrame(tick)
    }
    paint()
  }

  const springTo = (i: number) => {
    const m = s.current
    m.target = i
    if (reducedMotion()) {
      cancelAnimationFrame(m.raf)
      m.raf = 0
      m.t = i
      m.vel = m.over = 0
      paint()
      return
    }
    if (!m.raf) {
      m.last = 0
      m.raf = requestAnimationFrame(tick)
    }
  }

  const emit = (v: number) => {
    if (v !== value) onChange(v)
  }

  useEffect(() => {
    const m = s.current
    paint()
    return () => {
      cancelAnimationFrame(m.raf)
      // A stale id would stop the next spring from starting.
      m.raf = 0
    }
  }, [])

  // Outside changes (reset, the intent box) spring the thumb to the new word.
  useEffect(() => {
    if (!drag.current) springTo(stepOf(value))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  /** The step under the pointer, unrounded: 0 is the middle of Ignore, LAST the middle of Most. */
  const stepAt = (clientX: number) => {
    const d = drag.current!
    return (clientX - d.left - PAD) / d.cell - 0.5
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = scale.current!.getBoundingClientRect()
    drag.current = { id: e.pointerId, x: e.clientX, moved: false, left: r.left, cell: (r.width - PAD * 2) / IMPORTANCE.length }
  }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.moved) {
      if (Math.abs(e.clientX - d.x) < DRAG_SLOP) return
      d.moved = true
      scale.current!.setAttribute('data-drag', '')
    }
    const m = s.current
    cancelAnimationFrame(m.raf)
    m.raf = 0
    m.vel = 0
    const raw = stepAt(e.clientX)
    m.t = m.target = Math.max(0, Math.min(LAST, raw))
    const beyond = (raw < 0 ? -raw : raw > LAST ? raw - LAST : 0) * d.cell
    const past = Math.max(0, beyond - DEAD_ZONE)
    m.over = Math.sign(raw) * ((MAX_STRETCH * past) / (past + 40))
    paint()
    setLive(IMPORTANCE[Math.round(m.t)].value)
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    const i = Math.round(Math.max(0, Math.min(LAST, d.moved ? s.current.t : stepAt(e.clientX))))
    drag.current = null
    scale.current!.removeAttribute('data-drag')
    setLive(null)
    emit(IMPORTANCE[i].value)
    springTo(i)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = stepOf(value)
    const keys: Record<string, number> = { ArrowLeft: i - 1, ArrowDown: i - 1, ArrowRight: i + 1, ArrowUp: i + 1, Home: 0, End: LAST }
    if (!(e.key in keys)) return
    e.preventDefault()
    emit(IMPORTANCE[Math.max(0, Math.min(LAST, keys[e.key]))].value)
  }

  return (
    <div className={`mx-imp${shown === 0 ? ' is-off' : ''}`}>
      <span className="mx-imp-label">
        {label} <i>{hint}</i>
      </span>
      <div
        ref={scale}
        className="mx-imp-scale"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={IMPORTANCE[0].value}
        aria-valuemax={IMPORTANCE[LAST].value}
        aria-valuenow={shown}
        aria-valuetext={`${word}, ${pct}% of the ranking`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <span className="mx-imp-thumb" aria-hidden />
        {IMPORTANCE.map((l) => (
          <span key={l.value} className="mx-imp-step" data-on={l.value === shown || undefined} aria-hidden>
            {l.label}
          </span>
        ))}
      </div>
      <span className="mx-imp-share" title="Share of the overall score" aria-hidden>
        {pct}%
      </span>
    </div>
  )
}

export default Importance
