/**
 * Read the published tool records and turn them into scores.
 *
 * Data shape is owned by multiplexersSchema.mjs; this file only
 * knows how to score it. Everything numeric here is relative to the dataset
 * (log-scaled against the max), so adding a tool with 10x the stars reshapes
 * the traction axis for everyone. That's intended: the map is a snapshot of
 * the field, not an absolute grade.
 */
import { FEATURE_CATEGORIES, LIFECYCLES, STAGES } from './multiplexersSchema.mjs'

export type FeatureValue = true | false | 'partial' | null
export type Lifecycle = (typeof LIFECYCLES)[number]
export type Stage = (typeof STAGES)[number]
export const STAGE_WORD: Record<string, string> = { ga: 'generally available', beta: 'beta', alpha: 'alpha', unknown: 'stage unknown' }

export interface FeatureCategory {
  key: string
  label: string
  features: Record<string, { label: string }>
}

export interface Tool {
  slug: string
  name: string
  tagline: string | null
  valueProp: string | null
  website: string | null
  repo: string | null
  docs: string | null
  changelog: string | null
  license: string | null
  maker: { name: string | null; type: string; funding: string | null }
  pricing: { model: string; notes: string | null }
  taxonomy: { interface: string[]; host: string[]; surface: string | null }
  features: Record<string, Record<string, FeatureValue>>
  featureNotes: Record<string, string>
  supportedAgents: string[]
  traction: {
    github: null | {
      stars: number
      forks: number
      contributors: number | null
      openIssues: number
      releases: { assetDownloadsLast5: number | null; latestTag: string | null }
    }
    downloads: null | { npm: Record<string, number | null>; pypi: Record<string, number | null> }
    social: null | {
      x: null | { handle: string; followers: number | null; lastPostAt: string | null }
      discord: null | { members: number | null; online: number | null }
      hn: null | { stories: number | null; top: null | { title: string; points: number; url: string } }
    }
  }
  activity: null | {
    lastCommitAt?: string | null
    commits30d?: number | null
    commits90d?: number | null
    lastReleaseAt?: string | null
    lastReleaseTag?: string | null
    releases90d?: number | null
    lastChangelogAt?: string | null
    changelogCadence?: string | null
  }
  editorial: {
    reach: number | null
    reachRationale: string | null
    polish: number | null
    depth: number | null
    feel: number | null
    polishRationale: string | null
    depthRationale: string | null
    feelRationale: string | null
  }
  /** The site owner's own hands-on take. Human-written, never by a researcher. */
  authorNote: string | null
  status: {
    lifecycle: Lifecycle
    override: Lifecycle | null
    overrideReason: string | null
    /** The maker's own label for the multiplexing surface today. */
    stage?: Stage
  }
  sourceCount: number
  research: { lastFullRefresh: string | null; lastMetricsRefresh: string | null; confidence: string | null }
}

export const CATEGORIES = FEATURE_CATEGORIES as FeatureCategory[]

/**
 * The five scored dimensions, each a tier from 1 to 5 with a word. Reach,
 * polish, depth and feel are judged by a person and written into the record.
 * Pace is bucketed from cadence and recency. Nothing here is a formula over
 * raw counts: counts aren't comparable across tools, so they are shown as
 * evidence under each tier, never averaged into it.
 */
export const DIMENSIONS: { key: string; label: string; kind: 'signal'; words: [string, string, string, string, string] }[] = [
  { key: 'reach', label: 'Reach', kind: 'signal', words: ['niche', 'emerging', 'established', 'major', 'dominant'] },
  { key: 'pace', label: 'Pace', kind: 'signal', words: ['dormant', 'quiet', 'steady', 'busy', 'relentless'] },
  { key: 'polish', label: 'Polish', kind: 'signal', words: ['rough', 'uneven', 'solid', 'refined', 'finished'] },
  { key: 'depth', label: 'Depth', kind: 'signal', words: ['wrapper', 'basic', 'capable', 'deep', 'platform'] },
  { key: 'feel', label: 'Feel', kind: 'signal', words: ['sluggish', 'sticky', 'fine', 'quick', 'instant'] },
]

/** The word for a tier on a dimension, or null when unscored. */
export function tierWord(key: string, tier: number | null | undefined): string | null {
  const d = DIMENSIONS.find((x) => x.key === key)
  if (!d || !tier) return null
  return d.words[Math.max(1, Math.min(5, Math.round(tier))) - 1]
}

export type Weights = Record<string, number>

/**
 * Only the signal dimensions are weightable. Feature categories are binary
 * questions (you need Windows or you don't), so they act as filters instead,
 * and count at a fixed weight of 1 in the overall score.
 */
export const RANK_DIMENSIONS: { key: string; label: string; hint: string }[] = [
  { key: 'reach', label: 'Reach', hint: 'how widely it’s used' },
  { key: 'pace', label: 'Pace', hint: 'how fast it ships' },
  { key: 'polish', label: 'Polish', hint: 'how finished it is' },
  { key: 'depth', label: 'Depth', hint: 'beyond a tmux wrapper' },
  { key: 'feel', label: 'Feel', hint: 'speed and responsiveness' },
]
/**
 * How much a dimension counts, in words. The overall is a weighted mean, so
 * only the ratios between weights matter; Normal is the plain 1.
 */
export const IMPORTANCE: { value: number; label: string }[] = [
  { value: 0, label: 'Ignore' },
  { value: 0.5, label: 'Less' },
  { value: 1, label: 'Normal' },
  { value: 1.5, label: 'More' },
  { value: 2, label: 'Most' },
]

/** The importance step nearest a weight, so old links with finer weights still land on a step. */
export const toImportance = (w: number) => IMPORTANCE.reduce((a, b) => (Math.abs(b.value - w) < Math.abs(a.value - w) ? b : a)).value

/**
 * The default positioning: reach counts less (popularity matters, but less
 * than the product), pace as normal, and polish, depth and feel more. Readers
 * move from here.
 */
export const DEFAULT_WEIGHTS: Weights = { reach: 0.5, pace: 1, polish: 1.5, depth: 1.5, feel: 1.5 }

/** Requirements on by default: git worktrees, and it must drive both Claude Code and Codex. */
/** No requirements by default: the whole field shows until you say otherwise. */
export const DEFAULT_MUST: string[] = []

/** How many tools to show. Infinity means all. */
export const TOP_OPTIONS: number[] = [5, 10, 20, 50, Infinity]

/** Sentences the intent box types into its own placeholder, one after another, so nobody has to guess what it understands. */
export const EXAMPLES: string[] = [
  'mac, linux and ios, has a kanban, open source',
  'runs on my own remote box, phone app, self-hosted end to end',
  'feels fast, drives claude code and codex, polish matters more than popularity',
  'for a team: shared sessions and multiple users, vendor cloud is fine',
  'terminal-first, git worktrees, plugins',
  'a native mac app that feels instant',
  'chat-first, steer from my phone, uses my own claude subscription',
  'windows and linux, opens pull requests, in-app diff review',
  'agents that spawn agents, scheduled runs, needs-you alerts',
  'inside an ide, drives codex and gemini cli',
  'a board of tasks, containers per task, self-hostable',
  'anything I can point at any cli agent, telemetry I can turn off',
  'a plugin system I can build on, api or mcp server',
  'popular and shipping fast matter more than polish',
  'open source, self-hosted end to end, no vendor cloud',
  'runs in the vendor’s cloud, team plans, shared sessions',
  'depth over everything, I want the most capable one',
  'a desktop workspace with worktrees and merge help',
  'ios and android, voice control',
  'drives cursor and copilot cli, checkpoints and rollback',
  'terminal ui over ssh to a server I own',
  'the fastest-feeling tool that drives claude code',
  'polish matters most, open source doesn’t',
  'chat-first with a task board, drives opencode and pi',
]

/**
 * The requirement questions. Selecting several items in one group means all
 * of them are required, except `shape` and `maturity`: a tool has one surface
 * and one stage, so picking several there means "any of these".
 * `ask` is how the intent box phrases an item when the label alone would mislead.
 */
export const FILTER_GROUPS: { key: string; question: string; items: { key: string; label: string; ask?: string }[] }[] = [
  {
    key: 'shape',
    question: 'What shape should it be?',
    items: [
      { key: 'surface.terminal', label: 'Terminal-first' },
      { key: 'surface.workspace', label: 'Desktop workspace' },
      { key: 'surface.kanban', label: 'Board of tasks' },
      { key: 'surface.chat', label: 'Chat-first' },
      { key: 'surface.ide', label: 'Inside an IDE' },
    ],
  },
  {
    key: 'maturity',
    question: 'How finished must it be?',
    items: [
      { key: 'stage.ga', label: 'Generally available', ask: 'A generally available, stable, released tool' },
      { key: 'stage.beta', label: 'Beta', ask: 'Specifically tools still in beta' },
      { key: 'stage.alpha', label: 'Alpha', ask: 'Specifically tools still in alpha, early or experimental' },
    ],
  },
  {
    key: 'desktop',
    question: 'Which desktop OS do you need?',
    items: [
      { key: 'platforms.macos', label: 'macOS' },
      { key: 'platforms.windows', label: 'Windows' },
      { key: 'platforms.linux', label: 'Linux' },
    ],
  },
  {
    key: 'mobile',
    question: 'Which phone do you need it on?',
    items: [
      { key: 'platforms.ios', label: 'iOS' },
      { key: 'platforms.android', label: 'Android' },
    ],
  },
  {
    key: 'reach',
    question: 'Any other way you want to reach it?',
    items: [
      { key: 'platforms.web', label: 'Browser' },
      { key: 'platforms.cli', label: 'CLI' },
      { key: 'platforms.tui', label: 'Terminal UI' },
    ],
  },
  {
    key: 'execution',
    question: 'Where should the agents run?',
    items: [
      { key: 'execution.local', label: 'My machine' },
      { key: 'execution.remoteOwn', label: 'A remote machine I own' },
      { key: 'execution.cloudManaged', label: 'The vendor’s cloud' },
      { key: 'execution.selfHostServer', label: 'A server I can self-host' },
    ],
  },
  {
    key: 'agents',
    question: 'Which agents must it drive?',
    items: [
      { key: 'agents.claudeCode', label: 'Claude Code' },
      { key: 'agents.codex', label: 'Codex' },
      { key: 'agents.geminiCli', label: 'Gemini CLI' },
      { key: 'agents.copilotCli', label: 'Copilot CLI' },
      { key: 'agents.opencode', label: 'OpenCode' },
      { key: 'agents.cursorAgent', label: 'Cursor agent' },
      { key: 'agents.amp', label: 'Amp' },
      { key: 'agents.pi', label: 'Pi' },
      { key: 'agents.anyCli', label: 'Any CLI I point it at' },
    ],
  },
  {
    key: 'workflow',
    question: 'Which workflow features are non-negotiable?',
    items: [
      { key: 'isolation.worktrees', label: 'Git worktrees' },
      { key: 'openness.pluginSystem', label: 'Plugins that extend the app itself' },
      { key: 'isolation.containers', label: 'Containers or sandboxes' },
      { key: 'isolation.diffReview', label: 'In-app diff review' },
      { key: 'isolation.prCreation', label: 'Opens pull requests' },
      { key: 'orchestration.taskBoard', label: 'Task board' },
      { key: 'orchestration.automations', label: 'Scheduled runs' },
      { key: 'orchestration.notifications', label: 'Needs-you alerts' },
      { key: 'orchestration.subagents', label: 'Agents spawn agents' },
      { key: 'orchestration.voice', label: 'Voice' },
    ],
  },
  {
    key: 'team',
    question: 'Working with other people?',
    items: [
      { key: 'collaboration.multiUser', label: 'Multiple users' },
      { key: 'collaboration.sharedSessions', label: 'Shared sessions' },
      { key: 'collaboration.teamBilling', label: 'Team plans' },
    ],
  },
  {
    key: 'openness',
    question: 'Does it need to be open?',
    items: [
      { key: 'openness.openSource', label: 'Open source' },
      { key: 'openness.selfHostable', label: 'Self-hostable end to end' },
      { key: 'openness.byoSubscription', label: 'Uses my own subscription' },
      { key: 'openness.telemetryOptOut', label: 'Telemetry I can turn off' },
      { key: 'openness.apiOrMcp', label: 'API or MCP server' },
    ],
  },
]

export const MUST_HAVES = FILTER_GROUPS.flatMap((g) => g.items)


export interface Scored {
  slug: string
  /** Every dimension as a tier 1–5; 0 when unscored. */
  dims: Record<string, number>
  /** How many of a category's features are known (not null), 0–1. */
  coverage: Record<string, number>
  /** Evidence behind reach: raw counts, shown but never averaged. */
  signals: { key: string; label: string; value: number | null }[]
  /** Evidence behind pace. */
  paceSignals: { key: string; label: string; value: number | string | null }[]
}

const featureScore = (v: FeatureValue) => (v === true ? 1 : v === 'partial' ? 0.5 : 0)

export function categoryScore(tool: Tool, cat: FeatureCategory): { score: number; coverage: number } {
  const keys = Object.keys(cat.features)
  const vals = keys.map((k) => tool.features?.[cat.key]?.[k] ?? null)
  const score = vals.reduce((s, v) => s + featureScore(v), 0) / keys.length
  const coverage = vals.filter((v) => v !== null).length / keys.length
  return { score, coverage }
}


function sumNpm(t: Tool): number | null {
  const d: any = t.traction?.downloads
  if (!d) return null
  const all = [
    ...Object.values(d.npm || {}),
    ...Object.values(d.pypi || {}),
    ...Object.values(d.crates || {}),
    d.brewCask?.installs30d,
    d.brewFormula?.installs30d,
  ].filter((n): n is number => typeof n === 'number')
  return all.length ? all.reduce((a, b) => a + b, 0) : null
}

const TRACTION_SIGNALS: { key: string; label: string; pick: (t: Tool) => number | null }[] = [
  { key: 'stars', label: 'GitHub stars', pick: (t) => t.traction?.github?.stars ?? null },
  { key: 'contributors', label: 'Contributors', pick: (t) => t.traction?.github?.contributors ?? null },
  { key: 'assets', label: 'Release downloads (last 5)', pick: (t) => t.traction?.github?.releases?.assetDownloadsLast5 ?? null },
  { key: 'npm', label: 'Package downloads / month', pick: sumNpm },
  { key: 'x', label: 'X followers', pick: (t) => t.traction?.social?.x?.followers ?? null },
  { key: 'discord', label: 'Discord members', pick: (t) => t.traction?.social?.discord?.members ?? null },
  { key: 'hn', label: 'Top HN points', pick: (t) => t.traction?.social?.hn?.top?.points ?? null },
]

/** Loose reading of the free-text changelog cadence researchers record. */
function cadenceTier(text: string | null | undefined): number | null {
  if (!text) return null
  const c = text.toLowerCase()
  if (/daily|every day|several per day|every 1-\d days|1-3 days|near-daily/.test(c)) return 5
  if (/per week|every 2-\d days|2-4 days|twice a week|weekly/.test(c)) return 4
  if (/biweekly|fortnight|every two weeks|monthly/.test(c)) return 3
  if (/quarterly|every few months/.test(c)) return 2
  if (/none since|stopped|no longer/.test(c)) return 1
  return 3
}

/**
 * Pace tier. Cadence sets the ceiling (commits per month, releases per
 * quarter, or the changelog rhythm for closed source); recency caps it so a
 * project that stopped can't stay "relentless" on old history. Lifecycle
 * overrides win. Thresholds are tuned to this field, where a busy project
 * lands hundreds of commits a month.
 */
function paceTier(t: Tool, lastSeenDays: number | null): number {
  const life = t.status?.lifecycle
  if (life === 'sunset' || life === 'abandoned') return 1
  const a = t.activity || {}
  const byCommits = a.commits30d == null ? null : a.commits30d >= 600 ? 5 : a.commits30d >= 200 ? 4 : a.commits30d >= 50 ? 3 : a.commits30d > 0 ? 2 : 1
  const byReleases = a.releases90d == null ? null : a.releases90d >= 60 ? 5 : a.releases90d >= 20 ? 4 : a.releases90d >= 5 ? 3 : a.releases90d > 0 ? 2 : 1
  const byChangelog = cadenceTier(a.changelogCadence)
  const cadence = Math.max(byCommits ?? 0, byReleases ?? 0, byChangelog ?? 0) || (lastSeenDays == null ? 0 : 3)
  if (!cadence) return 0
  const cap = lastSeenDays == null ? 3 : lastSeenDays <= 14 ? 5 : lastSeenDays <= 45 ? 4 : lastSeenDays <= 120 ? 3 : lastSeenDays <= 365 ? 2 : 1
  return Math.max(1, Math.min(cadence, cap))
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = Date.now() - Date.parse(iso)
  return isNaN(ms) ? null : ms / 86400000
}

export function scoreAll(tools: Tool[]): Record<string, Scored> {
  const out: Record<string, Scored> = {}
  for (const t of tools) {
    const dims: Record<string, number> = {}
    const coverage: Record<string, number> = {}
    for (const c of CATEGORIES) {
      const { score, coverage: cov } = categoryScore(t, c)
      dims[c.key] = Math.round(score * 100)
      coverage[c.key] = cov
    }

    const signals = TRACTION_SIGNALS.map((s) => ({ key: s.key, label: s.label, value: s.pick(t) }))

    const a = t.activity || {}
    const seen = [a.lastCommitAt, a.lastReleaseAt, a.lastChangelogAt, t.traction?.social?.x?.lastPostAt].map(daysSince).filter((d): d is number => d !== null)
    const lastSeen = seen.length ? Math.min(...seen) : null
    const paceSignals = [
      { key: 'commits30d', label: 'Commits, last 30 days', value: a.commits30d ?? null },
      { key: 'releases90d', label: 'Releases, last 90 days', value: a.releases90d ?? null },
      { key: 'cadence', label: 'Changelog cadence', value: a.changelogCadence ?? null },
      { key: 'recency', label: 'Days since last activity', value: lastSeen == null ? null : Math.round(lastSeen) },
    ]

    dims.reach = t.editorial?.reach ?? 0
    dims.pace = paceTier(t, lastSeen)
    dims.polish = t.editorial?.polish ?? 0
    dims.depth = t.editorial?.depth ?? 0
    dims.feel = t.editorial?.feel ?? 0

    out[t.slug] = { slug: t.slug, dims, coverage, signals, paceSignals }
  }
  return out
}

/** Weighted mean of tiers, on the 1–5 scale, one decimal. Unscored dimensions are left out. */
function weightedMean(s: Scored, w: Weights, keys: string[]): number {
  let num = 0
  let den = 0
  for (const k of keys) {
    const v = s.dims[k] ?? 0
    if (!v) continue
    const weight = w[k] ?? 1
    num += v * weight
    den += weight
  }
  return den ? num / den : 0
}

const round1 = (v: number) => Math.round(v * 10) / 10

/**
 * Overall tier, 1–5. Used for ordering; shown as dots, not a number. Left
 * unrounded: rounding made a dozen tools tie, and ties fell back to
 * alphabetical order.
 */
export function overall(s: Scored, w: Weights): number {
  return weightedMean(s, w, DIMENSIONS.map((d) => d.key))
}

/** Quadrant axes on the 1–5 scale: x = product quality (polish, depth, feel), y = standing (reach, pace). */
export function axes(s: Scored, w: Weights): { x: number; y: number } {
  return { x: round1(weightedMean(s, w, ['polish', 'depth', 'feel'])), y: round1(weightedMean(s, w, ['reach', 'pace'])) }
}

/** Requirements where "partial" isn't good enough: a real plugin system means code extends the app, not a config file. */
const STRICT_KEYS = new Set(['openness.pluginSystem'])

export function meetsMustHaves(tool: Tool, must: string[]): { ok: boolean; missing: string[] } {
  const missing = must.filter((k) => {
    if (k.startsWith('surface.') || k.startsWith('stage.')) return false
    const [cat, f] = k.split('.')
    const v = tool.features?.[cat]?.[f]
    return !(v === true || (v === 'partial' && !STRICT_KEYS.has(k)))
  })
  // Shape is one value per tool, so several selected shapes mean "any of".
  const shapes = must.filter((k) => k.startsWith('surface.')).map((k) => k.slice('surface.'.length))
  if (shapes.length && !shapes.includes(tool.taxonomy?.surface ?? '')) missing.push('surface')
  // Stage is one value too, so several selected stages mean "any of", not a ladder.
  const stages = must.filter((k) => k.startsWith('stage.')).map((k) => k.slice('stage.'.length))
  if (stages.length && !stages.includes(tool.status?.stage ?? 'unknown')) missing.push('stage')
  return { ok: missing.length === 0, missing }
}

export function featureLabel(key: string): string {
  const [cat, f] = key.split('.')
  const c = CATEGORIES.find((x) => x.key === cat)
  return c?.features[f]?.label || key
}

export const QUADRANTS = {
  tr: { name: 'Leaders', hint: 'polished and widely used' },
  tl: { name: 'Challengers', hint: 'widely used, rougher' },
  br: { name: 'Visionaries', hint: 'polished, less known' },
  bl: { name: 'Niche', hint: 'early or focused' },
}

/** Quadrant from plot positions (0–100, midlines at 50). */
export function quadrantOf(x: number, y: number): keyof typeof QUADRANTS {
  return y >= 50 ? (x >= 50 ? 'tr' : 'tl') : x >= 50 ? 'br' : 'bl'
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '·'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}m`
  if (n >= 1e4) return `${Math.round(n / 1e3)}k`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`
  return String(n)
}
