import {
  AppWindow,
  Asterisk,
  BellRing,
  Box,
  CalendarClock,
  Check,
  ChevronRight,
  CreditCard,
  EyeOff,
  FileDiff,
  FlaskConical,
  GitBranch,
  GitPullRequest,
  KeyRound,
  MessagesSquare,
  Mic,
  Network,
  Package,
  PanelsTopLeft,
  Plug,
  Plus,
  ServerCog,
  Share2,
  SquareCode,
  SquareKanban,
  SquareTerminal,
  Sprout,
  Users,
} from 'lucide-react'
import type { ComponentType, KeyboardEvent, ReactNode, SVGProps } from 'react'
import { useLayoutEffect, useRef, useState } from 'react'
import { ICONS } from './FeatureIcons'
import { Importance } from './Importance'
import { Intent } from './Intent'
import { Logo } from './Logo'
import { DEFAULT_MUST, DEFAULT_WEIGHTS, FILTER_GROUPS, RANK_DIMENSIONS, TOP_OPTIONS } from '../../lib/multiplexers'
import type { Weights } from '../../lib/multiplexers'

interface ControlsProps {
  weights: Weights
  must: string[]
  top: number
  matching: number
  total: number
  onWeights: (w: Weights) => void
  onMust: (m: string[]) => void
  onTop: (n: number) => void
  onIntent: (must: string[], weights: Weights) => void
  onReset: () => void
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i])
const isDefault = (w: Weights, m: string[], top: number) =>
  sameSet(m, DEFAULT_MUST) && !Number.isFinite(top) && RANK_DIMENSIONS.every((x) => (w[x.key] ?? 1) === DEFAULT_WEIGHTS[x.key])

const GLYPH = 14
const lucide = (C: ComponentType<SVGProps<SVGSVGElement>>) => <C width={GLYPH} height={GLYPH} strokeWidth={2} aria-hidden />
const agent = (slug: string) => <Logo slug={slug} name="" size={GLYPH} />

/** A glyph per requirement, so the eye finds "iOS" or "Claude Code" before reading. */
const PILL_ICONS: Record<string, ReactNode> = {
  'surface.terminal': lucide(SquareTerminal),
  'surface.workspace': lucide(AppWindow),
  'surface.kanban': lucide(SquareKanban),
  'surface.chat': lucide(MessagesSquare),
  'surface.ide': lucide(SquareCode),
  'stage.ga': lucide(Package),
  'stage.beta': lucide(FlaskConical),
  'stage.alpha': lucide(Sprout),
  'platforms.tui': lucide(PanelsTopLeft),
  'execution.selfHostServer': lucide(ServerCog),
  'agents.claudeCode': agent('claude-code'),
  'agents.codex': agent('codex'),
  'agents.geminiCli': agent('agents/gemini-cli'),
  'agents.copilotCli': agent('agents/copilot-cli'),
  'agents.opencode': agent('agents/opencode'),
  'agents.cursorAgent': agent('cursor'),
  'agents.amp': agent('amp'),
  'agents.pi': agent('agents/pi'),
  'agents.anyCli': lucide(Asterisk),
  'isolation.worktrees': lucide(GitBranch),
  'isolation.containers': lucide(Box),
  'isolation.diffReview': lucide(FileDiff),
  'isolation.prCreation': lucide(GitPullRequest),
  'orchestration.taskBoard': lucide(SquareKanban),
  'orchestration.automations': lucide(CalendarClock),
  'orchestration.notifications': lucide(BellRing),
  'orchestration.subagents': lucide(Network),
  'orchestration.voice': lucide(Mic),
  'collaboration.multiUser': lucide(Users),
  'collaboration.sharedSessions': lucide(Share2),
  'collaboration.teamBilling': lucide(CreditCard),
  'openness.byoSubscription': lucide(KeyRound),
  'openness.telemetryOptOut': lucide(EyeOff),
  'openness.apiOrMcp': lucide(Plug),
}
const pillIcon = (key: string) => {
  if (PILL_ICONS[key]) return PILL_ICONS[key]
  const Shared = ICONS[key]
  return Shared ? <Shared size={GLYPH} /> : lucide(Plus)
}

/** Keep "non-negotiable" and "Chat-first" whole when a line wraps. */
const keepHyphens = (s: string) =>
  s.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  )

/**
 * A toggle whose glyph swaps for a check when it is on. The two glyphs cross
 * through a short blur, so the swap reads as one shape changing, not a cut.
 */
function Pill({ on, icon, label, onClick }: { on: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button type="button" className="mx-pill" aria-pressed={on} onClick={onClick}>
      <span className="mx-pill-glyph" aria-hidden>
        <span className="mx-pill-icon">{icon}</span>
        <span className="mx-pill-check">
          <Check width={GLYPH} height={GLYPH} strokeWidth={2.5} />
        </span>
      </span>
      <span>{keepHyphens(label)}</span>
    </button>
  )
}

/** One-of-N choice with a thumb that slides to the picked option. */
function Segmented<T>({ label, options, value, format, onChange }: { label: string; options: T[]; value: T; format: (v: T) => string; onChange: (v: T) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [thumb, setThumb] = useState<{ x: number; w: number; still: boolean } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-checked="true"]')
    if (el) setThumb((t) => ({ x: el.offsetLeft, w: el.offsetWidth, still: !t }))
  }, [value])
  const step = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!d) return
    e.preventDefault()
    const next = (i + d + options.length) % options.length
    onChange(options[next])
    ref.current?.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus()
  }
  return (
    <div ref={ref} className="mx-segmented" role="radiogroup" aria-label={label}>
      {thumb && <span className="mx-segmented-thumb" aria-hidden style={{ translate: `${thumb.x}px 0`, width: thumb.w, transition: thumb.still ? 'none' : undefined }} />}
      {options.map((o, i) => (
        <button
          key={String(o)}
          type="button"
          role="radio"
          className="mx-segment"
          aria-checked={o === value}
          tabIndex={o === value ? 0 : -1}
          onClick={() => onChange(o)}
          onKeyDown={(e) => step(e, i)}
        >
          {format(o)}
        </button>
      ))}
    </div>
  )
}

/**
 * The sentence is the interface. Everything else lives behind "Fine-tune":
 * the yes/no requirements that gate what appears, the weights that order
 * what's left, and how many to show.
 */
export function Controls({ weights, must, top, matching, total, onWeights, onMust, onTop, onIntent, onReset }: ControlsProps) {
  const [openDetails, setOpenDetails] = useState(false)
  const toggle = (k: string) => onMust(must.includes(k) ? must.filter((x) => x !== k) : [...must, k])
  const pristine = isDefault(weights, must, top)
  const movedWeights = RANK_DIMENSIONS.filter((d) => (weights[d.key] ?? 1) !== DEFAULT_WEIGHTS[d.key]).length
  const weightSum = RANK_DIMENSIONS.reduce((sum, d) => sum + (weights[d.key] ?? 1), 0)

  return (
    <div className="mx-controls">
      <Intent onApply={onIntent} onClear={onReset} />

      <div className="mx-controls-bar">
        <button type="button" className="mx-disclose" aria-expanded={openDetails} onClick={() => setOpenDetails((v) => !v)}>
          <ChevronRight size={14} strokeWidth={2} className={`mx-chev${openDetails ? ' is-open' : ''}`} aria-hidden />
          Fine-tune
          <span className="mx-disclose-hint">{pristine ? 'defaults' : `${must.length} required · ${movedWeights} weight${movedWeights === 1 ? '' : 's'} moved`}</span>
        </button>
        <span className="mx-controls-count">
          {Number.isFinite(top) && matching > top ? (
            <>
              top <b>{top}</b> of {matching} matching
            </>
          ) : (
            <>
              <b>{matching}</b> of {total} tools
            </>
          )}
        </span>
        <button type="button" className="mx-btn" disabled={pristine} onClick={onReset}>
          Reset
        </button>
      </div>

      {openDetails && (
        <div className="mx-details">
          <div className="mx-questions">
            {FILTER_GROUPS.map((g) => {
              const active = g.items.filter((m) => must.includes(m.key)).length
              return (
                <section key={g.key} className={`mx-question${active ? ' has-active' : ''}`}>
                  <h4 className="mx-label">{keepHyphens(g.question)}</h4>
                  <div className="mx-pills" role="group" aria-label={g.question}>
                    {g.items.map((m) => (
                      <Pill key={m.key} on={must.includes(m.key)} icon={pillIcon(m.key)} label={m.label} onClick={() => toggle(m.key)} />
                    ))}
                  </div>
                </section>
              )
            })}
            <section className="mx-question">
              <h4 className="mx-label">How many to show?</h4>
              <Segmented label="How many to show" options={TOP_OPTIONS} value={top} format={(n) => (Number.isFinite(n) ? `Top ${n}` : 'All')} onChange={onTop} />
            </section>
          </div>

          <section className="mx-ranking">
            <h4 className="mx-label">What should count most in the ranking?</h4>
            <ul className="mx-sliders">
              {RANK_DIMENSIONS.map((d) => {
                const own = weights[d.key] ?? 1
                // Its share if it were set to v, with the others as they are.
                const share = (v: number) => (weightSum - own + v ? v / (weightSum - own + v) : 0)
                return (
                  <li key={d.key}>
                    <Importance label={d.label} hint={d.hint} value={own} share={share} onChange={(v) => onWeights({ ...weights, [d.key]: v })} />
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

export default Controls
