import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface TipProps {
  /** Bold first line. */
  title: string
  /** Optional detail under the title. */
  body?: string | null
  className?: string
  /** Accessible name for the target, when its children don't carry one. */
  label?: string
  children: React.ReactNode
}

const GAP = 8
const MARGIN = 8

/**
 * A small hover card in place of the browser's native title tooltip. It
 * renders into a portal with fixed positioning, so overflow on the detail
 * panel or table can't clip it. It sits above the target and flips below
 * when there is no room, and it stays inside the viewport.
 */
export function Tip({ title, body, className, label, children }: TipProps) {
  const id = useId()
  const anchor = useRef<HTMLSpanElement | null>(null)
  const tip = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchor.current || !tip.current) return
    const a = anchor.current.getBoundingClientRect()
    const t = tip.current.getBoundingClientRect()
    const below = a.top - GAP - t.height < MARGIN
    const left = Math.max(MARGIN, Math.min(window.innerWidth - t.width - MARGIN, a.left + a.width / 2 - t.width / 2))
    setPos({ left, top: below ? a.bottom + GAP : a.top - GAP - t.height, below })
  }, [open])

  // Fixed positioning drifts on scroll, so close instead.
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const show = () => {
    setPos(null)
    setOpen(true)
  }

  return (
    <span
      ref={anchor}
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-describedby={open ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={() => setOpen(false)}
      onFocus={show}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={tip}
            id={id}
            role="tooltip"
            className={`mx-tip${pos ? ' is-placed' : ''}${pos?.below ? ' is-below' : ''}`}
            style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0 }}
          >
            <b>{title}</b>
            {body && <span>{body}</span>}
          </div>,
          (document.fullscreenElement as HTMLElement | null) ?? document.body,
        )}
    </span>
  )
}

export default Tip
