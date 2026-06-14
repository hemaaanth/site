import type { ParseResult } from './types'

// Sanity visual editing (stega) can inject zero-width characters into
// stringified field values; strip them before parsing. Mirrors the strip in
// lib/portableTextUtils.ts. Built via RegExp() so the source stays pure ASCII.
// Covers U+200B–U+200D, U+FEFF, U+2060.
const ZERO_WIDTH = new RegExp('[\\u200B-\\u200D\\uFEFF\\u2060]', 'g')

/** Parse the raw chart config. Pure, server-safe, and NEVER evaluates code. */
export function safeParse(input: string | Record<string, any>): ParseResult {
  if (input && typeof input === 'object') {
    return { ok: true, value: input as Record<string, any> }
  }
  if (typeof input !== 'string') {
    return { ok: false, error: 'Chart config is empty.' }
  }
  const cleaned = input.replace(ZERO_WIDTH, '').trim()
  if (!cleaned) return { ok: false, error: 'Chart config is empty.' }
  try {
    const value = JSON.parse(cleaned)
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ok: false, error: 'Chart config must be a JSON object.' }
    }
    return { ok: true, value }
  } catch (err: any) {
    return { ok: false, error: `Invalid JSON: ${err.message}` }
  }
}
