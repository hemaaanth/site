import { noul, score, TypeSafeClient, APIError, APIConnectionError, RateLimitError } from '@typesafe-ai/sdk'
import type { NextApiRequest, NextApiResponse } from 'next'
import { FILTER_GROUPS, RANK_DIMENSIONS } from '../../../lib/multiplexers'

/**
 * Turn a sentence of intent ("something fast that runs on my own server and
 * drives Claude Code") into requirement toggles and ranking weights.
 *
 * Runs on TypeSafe's Jev, a decision model: it answers typed questions about
 * the text with probabilities instead of writing anything. One request asks
 * a yes/no per requirement and a five-level rubric per ranking dimension,
 * all evaluated in parallel. It is cheap enough to call on every keystroke.
 */

const client = new TypeSafeClient()

/** How sure Jev must be before a requirement is switched on. Requirements are gates, so lean conservative. */
const NEED_THRESHOLD = 0.6

/** Rubric for each ranking dimension. The score is an expected level 0–4; weight = level / 2, so the middle level is neutral (1×). */
const WEIGHT_LEVELS = [
  'The reader says this does not matter to them, or dismisses it',
  'The reader would rather de-emphasise this',
  'The reader does not mention this, or is neutral about it',
  'The reader mentions this as something they want',
  'The reader stresses this as the main thing they want',
] as const

const HINTS: Record<string, string> = {
  reach: 'how widely used and well known the tool is: popular, mainstream, everyone uses it',
  pace: 'how fast the tool ships: actively developed, frequent releases, moving fast',
  polish: 'how finished and refined the product is',
  depth: 'how much the tool does beyond the basics: full workflow, does a lot, powerful',
  feel: 'how fast and responsive the interface itself is: snappy, slick, instant, smooth, native',
}

const questions = {
  ...Object.fromEntries(
    FILTER_GROUPS.flatMap((g) =>
      g.items.map((item) => [
        `need:${item.key}`,
        noul(
          { context: g.question, question: `Does the reader say they need this: ${item.ask ?? item.label}?` },
          {
            true: `They name it, or a plain synonym for it, as something the tool must have or do`,
            false: `They do not mention it, or they only mention something adjacent`,
          },
        ),
      ]),
    ),
  ),
  ...Object.fromEntries(
    RANK_DIMENSIONS.map((d) => [`weight:${d.key}`, score(`How much does the reader care about ${d.label.toLowerCase()} (${HINTS[d.key]})?`, WEIGHT_LEVELS)]),
  ),
}

// Small in-memory limiter. Jev is cheap, but the box fires per keystroke.
const hits = new Map<string, number[]>()
function limited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  arr.push(now)
  hits.set(ip, arr)
  return arr.length > 300
}

function describe(must: string[], weights: Record<string, number>): string {
  const labels = FILTER_GROUPS.flatMap((g) => g.items).filter((i) => must.includes(i.key)).map((i) => i.label)
  const up = RANK_DIMENSIONS.filter((d) => weights[d.key] > 1).map((d) => d.label.toLowerCase())
  const down = RANK_DIMENSIONS.filter((d) => weights[d.key] < 1).map((d) => d.label.toLowerCase())
  const parts: string[] = []
  if (labels.length) parts.push(`Requiring ${labels.join(', ')}`)
  if (up.length) parts.push(`weighting ${up.join(' and ')} higher`)
  if (down.length) parts.push(`${up.length ? '' : 'weighting '}${down.join(' and ')} lower`)
  return parts.length ? parts.join('; ') + '.' : 'Nothing specific yet; keep typing.'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
  if (!text) return res.status(400).json({ error: 'Say what you need first.' })
  if (text.length > 400) return res.status(400).json({ error: 'Keep it under 400 characters.' })
  if (!process.env.TYPESAFE_API_KEY) return res.status(503).json({ error: 'The assistant is not configured on this deployment.' })

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown'
  if (limited(ip)) return res.status(429).json({ error: 'Too many requests. Try again in a few minutes.' })

  // If the browser moves on (next keystroke), stop this request too.
  const controller = new AbortController()
  req.on('close', () => controller.abort())

  try {
    const { answers, model } = await client.systemOne({ state: text, questions }, { signal: controller.signal, timeout: 8000 })
    const must: string[] = []
    for (const g of FILTER_GROUPS) {
      for (const item of g.items) {
        const a = answers[`need:${item.key}` as keyof typeof answers] as { noul: number }
        if (a && a.noul >= NEED_THRESHOLD) must.push(item.key)
      }
    }
    const weights: Record<string, number> = {}
    for (const d of RANK_DIMENSIONS) {
      const a = answers[`weight:${d.key}` as keyof typeof answers] as { score: number }
      const level = a ? Math.max(0, Math.min(4, a.score)) : 2
      weights[d.key] = Math.round(level) / 2
    }
    return res.status(200).json({ must, weights, summary: describe(must, weights), model })
  } catch (error) {
    if (controller.signal.aborted) return res.status(499).end()
    if (error instanceof RateLimitError) return res.status(429).json({ error: 'The assistant is busy. Try again shortly.' })
    if (error instanceof APIError && (error as { status?: number }).status === 401) return res.status(503).json({ error: 'The assistant is not configured on this deployment.' })
    if (error instanceof APIError) return res.status(502).json({ error: 'The assistant returned an error.' })
    if (error instanceof APIConnectionError) return res.status(502).json({ error: 'Could not reach the assistant.' })
    return res.status(500).json({ error: 'Something went wrong.' })
  }
}
