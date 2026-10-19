/**
 * Which tools appear in "Notable names", in order. The words themselves are
 * each record's `authorNote`, so the section, the table and the detail view
 * always say the same thing.
 */
export interface NotableEntry {
  slug: string
  /** Optional heading override; the record's name is used otherwise. */
  title?: string
}

export const NOTABLE: NotableEntry[] = [
  { slug: 'bb' },
  { slug: 'paseo' },
  { slug: 'orca' },
  { slug: 'superset' },
  { slug: 'amp' },
  { slug: 'multica' },
  { slug: 'herdr' },
]

/** An author note is plain text; blank lines separate paragraphs. */
export const paragraphs = (note: string | null | undefined) => (note ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
