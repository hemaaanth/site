/** Server-only loaders for the multiplexer data files. Import from getStaticProps only. */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Tool } from './multiplexers'

const TOOLS = join(process.cwd(), 'data', 'multiplexers.json')
const LONGTAIL = join(process.cwd(), 'data', 'multiplexers-longtail.json')
const HORIZON = join(process.cwd(), 'data', 'multiplexers-horizon.json')

/** Every scored tool, sorted by name. */
export function loadTools(): Tool[] {
  return (JSON.parse(readFileSync(TOOLS, 'utf8')) as { tools: Tool[] }).tools
}

/** One line per tool the sweep found but nobody has researched. */
export interface LongTailTool {
  name: string
  group: 'desktop' | 'terminal' | 'web' | 'mobile' | 'vendor' | 'borderline'
  url: string | null
  repo: string | null
  stars: number | null
  closed: boolean
  status: 'active' | 'quiet' | 'dead' | 'unknown'
  note: string | null
  blurb: string
}

export function loadLongTail(): { generatedAt: string; tools: LongTailTool[] } {
  if (!existsSync(LONGTAIL)) return { generatedAt: '', tools: [] }
  return JSON.parse(readFileSync(LONGTAIL, 'utf8'))
}

/** Announced or in beta, nothing to run yet. Hand-written in data/multiplexers-horizon.json. */
export interface HorizonTool {
  slug: string
  name: string
  maker: string
  url: string | null
  status: string
  announced: string
  summary: string
  why?: string
  signals?: string[]
  sources?: { title: string; url: string }[]
}

export function loadHorizon(): { updatedAt: string; tools: HorizonTool[] } {
  if (!existsSync(HORIZON)) return { updatedAt: '', tools: [] }
  return JSON.parse(readFileSync(HORIZON, 'utf8'))
}
