import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EXAMPLES } from '../../lib/multiplexers'
import type { Weights } from '../../lib/multiplexers'

interface IntentProps {
  onApply: (must: string[], weights: Weights) => void
  /** Called when the box is cleared, so the page returns to its defaults. */
  onClear: () => void
}

const STATIC_HINT = 'Say what you need'

/**
 * Types the example sentences into the placeholder one after another, with a
 * pause, a backspace, and the next. Placeholder only: nothing is sent until
 * the reader types. Off (static hint) when the reader prefers reduced motion
 * or once they have started typing.
 */
function useTypedHint(active: boolean): string {
  const [hint, setHint] = useState(STATIC_HINT)
  useEffect(() => {
    if (!active) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHint(`${STATIC_HINT}, e.g. ${EXAMPLES[0]}`)
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    // Start somewhere different each visit so the box doesn't always open on the same line.
    let index = Math.floor(Math.random() * EXAMPLES.length)
    const step = (fn: () => void, ms: number) => {
      timer = setTimeout(() => {
        if (!cancelled) fn()
      }, ms)
    }
    // Keystroke timing with a human cadence: quick inside a word, a beat at
    // spaces and punctuation, an occasional stumble, and bursts that speed up
    // and slow down over a few letters.
    let burst = 1
    const delayFor = (text: string, i: number) => {
      const ch = text[i - 1] ?? ''
      const next = text[i] ?? ''
      if (i % 4 === 0) burst = 0.75 + Math.random() * 0.6
      let ms = (14 + Math.random() * 22) * burst
      if (ch === ' ') ms += 30 + Math.random() * 50
      if (/[,.:;]/.test(ch)) ms += 80 + Math.random() * 90
      if (next === ch) ms += 12
      if (Math.random() < 0.05) ms += 90 + Math.random() * 130
      return ms
    }
    const type = (text: string, i: number) => {
      setHint(text.slice(0, i))
      if (i < text.length) step(() => type(text, i + 1), delayFor(text, i + 1))
      else step(() => erase(text, text.length), 2100)
    }
    const erase = (text: string, i: number) => {
      setHint(text.slice(0, i))
      // Backspace held down: a slow first few, then the key repeats fast.
      if (i > 0) step(() => erase(text, i - 1), text.length - i < 3 ? 70 : 7)
      else {
        index = (index + 1) % EXAMPLES.length
        step(() => type(EXAMPLES[index], 0), 300)
      }
    }
    type(EXAMPLES[index], 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active])
  return active ? hint : STATIC_HINT
}

/**
 * A sentence in, filters and weights out, re-evaluated as you type. Backed by
 * a decision model that answers every requirement and weight in one cheap
 * call, so there is no button: the page just follows the text.
 */
export function Intent({ onApply, onClear }: IntentProps) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  // Only failures are shown, inside the box, so the layout never moves. What
  // was understood is visible in the Fine-tune bar and the panel behind it.
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const inflight = useRef<AbortController | null>(null)
  const applied = useRef(false)
  const hint = useTypedHint(text === '')

  // Grow with the text instead of scrolling inside a fixed box.
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  // Evaluate on every change after a short settle; the newest request wins.
  useEffect(() => {
    const trimmed = text.trim()
    inflight.current?.abort()
    if (!trimmed) {
      setBusy(false)
      setError(null)
      if (applied.current) {
        applied.current = false
        onClear()
      }
      return
    }
    const controller = new AbortController()
    inflight.current = controller
    const id = setTimeout(async () => {
      setBusy(true)
      try {
        const r = await fetch('/api/multiplexers/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: trimmed }),
          signal: controller.signal,
        })
        const j = await r.json()
        if (controller.signal.aborted) return
        if (!r.ok) {
          setError(j.error || 'Something went wrong.')
        } else {
          applied.current = true
          onApply(j.must, j.weights)
          setError(null)
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError('Could not reach the assistant.')
      } finally {
        if (!controller.signal.aborted) setBusy(false)
      }
    }, 40)
    return () => {
      clearTimeout(id)
      controller.abort()
    }
    // onApply/onClear are stable callbacks from the explorer hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <section className="mx-intent">
      <label htmlFor="mx-intent-text" className="sr-only">
        Say what you need
      </label>
      <div className={`mx-composer${busy ? ' is-busy' : ''}`}>
        <textarea
          id="mx-intent-text"
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={hint}
          maxLength={400}
          rows={1}
          spellCheck={false}
        />
        <span className="mx-composer-pulse" aria-hidden />
        {error && (
          <span className="mx-composer-error" role="status" aria-live="polite">
            {error}
          </span>
        )}
      </div>
    </section>
  )
}

export default Intent
