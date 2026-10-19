/**
 * Render the current map and settings to a PNG, client-side. Built as an SVG
 * from the same positions the page uses, so it is crisp at any size and never
 * depends on what the browser happens to have painted.
 */
import { FILTER_GROUPS, IMPORTANCE, QUADRANTS, RANK_DIMENSIONS, quadrantOf, toImportance } from './multiplexers'
import type { Weights } from './multiplexers'

export interface SnapshotPoint {
  slug: string
  name: string
  x: number
  y: number
}

export interface SnapshotInput {
  points: SnapshotPoint[]
  must: string[]
  weights: Weights
  top: number
  matching: number
  total: number
  dark: boolean
  date: string
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

async function logoInner(slug: string): Promise<{ inner: string; viewBox: string } | null> {
  try {
    const r = await fetch(`/images/multiplexers/${slug}.svg`)
    if (!r.ok) return null
    const text = await r.text()
    const open = text.match(/<svg[^>]*>/)
    if (!open) return null
    const viewBox = open[0].match(/viewBox="([^"]+)"/)?.[1] || '0 0 24 24'
    const inner = text.slice(open.index! + open[0].length).replace(/<\/svg>\s*$/, '')
    return { inner, viewBox }
  } catch {
    return null
  }
}

interface Box {
  x: number
  y: number
  w: number
  h: number
}

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y))

let measureCtx: CanvasRenderingContext2D | null = null
/**
 * Text width at the given size. An SVG drawn as an image can't use the page's
 * web fonts, so it may render in Inter or in a system face; measure both and
 * keep the wider.
 */
function textWidth(text: string, size: number, weight = 400): number {
  if (typeof document !== 'undefined') {
    measureCtx ??= document.createElement('canvas').getContext('2d')
    if (measureCtx) {
      const widths = ['Inter, sans-serif', 'ui-sans-serif, system-ui, sans-serif'].map((family) => {
        measureCtx!.font = `${weight} ${size}px ${family}`
        return measureCtx!.measureText(text).width
      })
      return Math.max(...widths) + 2
    }
  }
  return text.length * size * 0.6
}

interface MarkSize {
  /** Mark radius, the gap kept between any two marks, logo size and name size. */
  r: number
  gap: number
  glyph: number
  label: number
}

/**
 * Fewer tools get bigger marks and names, so a top 10 still reads when X
 * shrinks the image to a timeline column. The full universe stays dense;
 * there the shape is the point.
 */
function markSize(count: number): MarkSize {
  if (count <= 12) return { r: 30, gap: 14, glyph: 34, label: 22 }
  if (count <= 25) return { r: 24, gap: 12, glyph: 28, label: 18 }
  if (count <= 50) return { r: 19, gap: 10, glyph: 22, label: 14 }
  return { r: 15, gap: 8, glyph: 18, label: 11 }
}

/**
 * Spread marks apart in pixels. The page spaces them for its own 4:3 plot;
 * the snapshot has its own shape, so it settles them again at its own size.
 * Each mark claims its circle plus room for its name underneath, and keeps
 * off the corner and axis text.
 */
function spread(pts: { x: number; y: number; w: number }[], bounds: Box, avoid: Box[], s: MarkSize) {
  const R = s.r
  const min = R * 2 + s.gap
  // Half-width and the extent above and below the centre of a mark with its name.
  const half = (p: { w: number }) => Math.max(R, p.w / 2) + 3
  const below = R + s.label + 8
  for (let iter = 0; iter < 300; iter++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]
        const b = pts[j]
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.hypot(dx, dy) || 0.01
        if (d < min) {
          const push = ((min - d) / d) * 0.5
          a.x -= dx * push
          a.y -= dy * push
          b.x += dx * push
          b.y += dy * push
          moved = true
          continue
        }
        // Name boxes: push apart along whichever axis needs the smaller move.
        const ox = half(a) + half(b) - Math.abs(dx)
        const oy = R + below - Math.abs(dy)
        if (ox <= 0 || oy <= 0) continue
        if (ox < oy) {
          const m = (ox / 2) * Math.sign(dx || 1)
          a.x -= m
          b.x += m
        } else {
          const m = (oy / 2) * Math.sign(dy || 1)
          a.y -= m
          b.y += m
        }
        moved = true
      }
    }
    for (const p of pts) {
      for (const b of avoid) {
        const left = p.x + R - b.x
        const right = b.x + b.w - (p.x - R)
        const up = p.y + R - b.y
        const down = b.y + b.h - (p.y - R)
        if (left <= 0 || right <= 0 || up <= 0 || down <= 0) continue
        const m = Math.min(left, right, up, down)
        if (m === left) p.x -= left
        else if (m === right) p.x += right
        else if (m === up) p.y -= up
        else p.y += down
        moved = true
      }
      p.x = Math.max(bounds.x + R, Math.min(bounds.x + bounds.w - R, p.x))
      p.y = Math.max(bounds.y + R, Math.min(bounds.y + bounds.h - R, p.y))
    }
    if (!moved) break
  }
}

interface Placed {
  box: Box
  /** Text anchor point. */
  tx: number
  ty: number
  /** A leader line is drawn when the label sits away from its mark. */
  leader: boolean
}

/**
 * Put each label where it collides with nothing: under its mark first, then
 * above, then slid sideways, beside and on the diagonals, then a ring further
 * out with a leader line. Earlier marks (the higher ranked) choose first.
 * When no spot is clear, the one with the least overlap wins.
 */
function placeLabels(pts: { x: number; y: number; w: number }[], bounds: Box, fixed: Box[], s: MarkSize): Placed[] {
  const R = s.r
  const h = s.label + 2
  const marks: Box[] = pts.map((p) => ({
    x: p.x - R - 1,
    y: p.y - R - 1,
    w: R * 2 + 2,
    h: R * 2 + 2,
  }))
  const taken: Box[] = []
  return pts.map((p, i) => {
    const near = R + 5
    const far = R + s.label * 2.5
    const at = (dx: number, dy: number, leader: boolean): Box => {
      // dx/dy pick a side: -1 left/above, 0 centred, 1 right/below.
      const x = dx < 0 ? p.x + dx * (leader ? far : near) - p.w : dx > 0 ? p.x + dx * (leader ? far : near) : p.x - p.w / 2
      const y = dy < 0 ? p.y + dy * (leader ? far : near) - h : dy > 0 ? p.y + dy * (leader ? far : near) : p.y - h / 2
      return { x, y, w: p.w, h }
    }
    const dirs: [number, number][] = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [0.75, 0.75],
      [-0.75, 0.75],
      [0.75, -0.75],
      [-0.75, -0.75],
    ]
    // Long names can also slide sideways while staying under or over their mark.
    const slid = [0.3, -0.3, 0.45, -0.45].flatMap((f) =>
      [1, -1].map((dy) => ({
        box: { ...at(0, dy, false), x: p.x - p.w / 2 + f * p.w },
        leader: false,
      })),
    )
    const near1 = dirs.map(([dx, dy]) => ({
      box: at(dx, dy, false),
      leader: false,
    }))
    const candidates = [...near1.slice(0, 2), ...slid, ...near1.slice(2), ...dirs.map(([dx, dy]) => ({ box: at(dx, dy, true), leader: true }))]
    let best = candidates[0]
    let bestCost = Infinity
    for (const [k, c] of candidates.entries()) {
      const b = c.box
      const outside = b.x < bounds.x || b.y < bounds.y || b.x + b.w > bounds.x + bounds.w || b.y + b.h > bounds.y + bounds.h
      let cost = outside ? 1e6 : 0
      for (const [j, m] of marks.entries()) if (j !== i) cost += overlap(b, m)
      for (const o of taken) cost += overlap(b, o) * 2
      for (const f of fixed) cost += overlap(b, f) * 2
      if (cost === 0) {
        best = c
        break
      }
      cost += k
      if (cost < bestCost) {
        bestCost = cost
        best = c
      }
    }
    taken.push({
      x: best.box.x - 3,
      y: best.box.y - 2,
      w: best.box.w + 6,
      h: best.box.h + 4,
    })
    return {
      box: best.box,
      tx: best.box.x + best.box.w / 2,
      ty: best.box.y + s.label * 0.92,
      leader: best.leader,
    }
  })
}

/**
 * Type sizes for a 1000-wide image. X shows it about 500 wide on desktop and
 * narrower on a phone, so everything here reads at half size or less.
 */
const TYPE = {
  title: 38,
  count: 17,
  pill: 15,
  scale: 16,
  scaleWord: 15,
  corner: 20,
  hint: 16,
  axis: 16,
  foot: 17,
}

/** A required filter as the page draws it: a tinted pill with a check. Sizes in px. */
const PILL = { h: 30, padL: 10, check: 14, iconGap: 6, padR: 12, gap: 8, rowGap: 8 }

/** Place pills left to right, starting a new row when the next one would pass maxW. */
function placePills(labels: string[], maxW: number): { label: string; x: number; row: number; w: number }[] {
  let x = 0
  let row = 0
  return labels.map((label) => {
    const w = PILL.padL + PILL.check + PILL.iconGap + textWidth(label, TYPE.pill) + PILL.padR
    if (x > 0 && x + w > maxW) {
      x = 0
      row++
    }
    const placed = { label, x, row, w }
    x += w + PILL.gap
    return placed
  })
}

/** A weight as a small copy of its control: name and word over a five-step track. Sizes in px. */
const SCALE = { trackTop: 26, trackH: 14, h: 40, colGap: 16 }

export async function buildSnapshotSvg(input: SnapshotInput): Promise<string> {
  const W = 1000
  const pad = 44
  const bg = input.dark ? '#101010' : '#f5f5f5'
  const card = input.dark ? '#161616' : '#ffffff'
  const line = input.dark ? '#3a3a3a' : '#d4d4d4'
  const faint = input.dark ? '#262626' : '#e8e8e8'
  const ink = input.dark ? '#dfdfde' : '#262626'
  const mute = input.dark ? '#9b9b9b' : '#737373'
  const accent = input.dark ? '#74b98a' : '#2f6b45'
  const font = `font-family="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"`
  const size = markSize(input.points.length)

  // The page's control colours: a sunken track, a raised thumb, tinted pills.
  const track = input.dark ? '#1c1c1c' : '#ebebeb'
  const trackLine = input.dark ? '#2c2c2c' : '#dcdcdc'
  const thumb = input.dark ? '#5a5a5a' : '#ffffff'
  const thumbLine = input.dark ? '#6a6a6a' : '#b8b8b8'
  const dot = input.dark ? '#3c3c3c' : '#c8c8c8'

  const labels = FILTER_GROUPS.flatMap((g) => g.items).filter((i) => input.must.includes(i.key)).map((i) => i.label)
  const topText = Number.isFinite(input.top) ? `top ${input.top} of ${input.matching} matching` : `${input.matching} of ${input.total} tools`

  // Show what the filters require only when they require something. Then the
  // weights, spread across the full width of the plot. The plot sits close
  // under them and above the footer; the image height follows, so the outer
  // margin stays the same on every side.
  const plotW = W - pad * 2
  const titleY = pad + 30
  const pills = placePills(labels, plotW)
  const pillsTop = titleY + 24
  const pillRows = pills.length ? pills[pills.length - 1].row + 1 : 0
  const scalesTop = pillsTop + (pillRows ? pillRows * PILL.h + (pillRows - 1) * PILL.rowGap + 16 : 0)
  const plotTop = scalesTop + SCALE.h + 24
  const plotH = 780
  const footY = plotTop + plotH + 34
  const H = footY + pad - 10
  const px = (x: number) => pad + (x / 100) * plotW
  const py = (y: number) => plotTop + plotH - (y / 100) * plotH

  const logos = await Promise.all(input.points.map((p) => logoInner(p.slug)))

  // Corner names sit `inset` in from the plot edge; the hint line sits under the name.
  const inset = 20
  const hintGap = TYPE.hint + 6
  const cornerTop = plotTop + inset + TYPE.corner
  const cornerBottom = plotTop + plotH - inset - hintGap
  // Text the marks and labels must keep clear of: the corner names and the axis labels.
  const cornerBox = (q: keyof typeof QUADRANTS, x: number, y: number, anchor: 'start' | 'end'): Box => {
    // Measured widths can come up short when the image falls back to a wider face; keep a margin.
    const w = Math.max(textWidth(QUADRANTS[q].name, TYPE.corner, 500), textWidth(QUADRANTS[q].hint, TYPE.hint)) + 12
    return {
      x: anchor === 'start' ? x : x - w,
      y: y - TYPE.corner,
      w,
      h: TYPE.corner + hintGap + 8,
    }
  }
  const xAxis = 'Product quality →'
  const yAxis = 'Reach & pace →'
  const xAxisW = textWidth(xAxis, TYPE.axis) + 12
  const yAxisW = textWidth(yAxis, TYPE.axis) + 12
  const xAxisY = plotTop + plotH - 16
  const yAxisX = pad + 8 + TYPE.axis
  const fixed: Box[] = [
    cornerBox('tl', pad + inset, cornerTop, 'start'),
    cornerBox('tr', pad + plotW - inset, cornerTop, 'end'),
    cornerBox('bl', pad + inset, cornerBottom, 'start'),
    cornerBox('br', pad + plotW - inset, cornerBottom, 'end'),
    {
      x: pad + plotW / 2 - xAxisW / 2,
      y: xAxisY - TYPE.axis,
      w: xAxisW,
      h: TYPE.axis + 6,
    },
    {
      x: pad + 6,
      y: plotTop + plotH / 2 - yAxisW / 2 - 4,
      w: TYPE.axis + 8,
      h: yAxisW + 8,
    },
  ]
  const bounds: Box = {
    x: pad + 6,
    y: plotTop + 6,
    w: plotW - 12,
    h: plotH - 12,
  }
  const pos = input.points.map((p) => ({
    x: px(p.x),
    y: py(p.y),
    w: textWidth(p.name, size.label),
  }))
  spread(pos, bounds, fixed, size)
  const placed = placeLabels(pos, bounds, fixed, size)

  const marks = input.points
    .map((p, i) => {
      const { x: cx, y: cy } = pos[i]
      const l = logos[i]
      const g = size.glyph
      const glyph = l
        ? `<svg x="${cx - g / 2}" y="${cy - g / 2}" width="${g}" height="${g}" viewBox="${esc(l.viewBox)}" fill="${ink}">${l.inner.replace(/currentColor/g, ink)}</svg>`
        : ''
      return `<g><circle cx="${cx}" cy="${cy}" r="${size.r}" fill="${card}" stroke="${line}"/>${glyph}</g>`
    })
    .join('')

  // Labels go above every mark, with leaders under them, so no mark hides a name.
  const names = placed
    .map((pl, i) => {
      const { x: cx, y: cy } = pos[i]
      let lead = ''
      if (pl.leader) {
        const bx = Math.max(pl.box.x, Math.min(pl.box.x + pl.box.w, cx))
        const by = Math.max(pl.box.y, Math.min(pl.box.y + pl.box.h, cy))
        const d = Math.hypot(bx - cx, by - cy) || 1
        lead = `<line x1="${cx + ((bx - cx) / d) * (size.r + 2)}" y1="${cy + ((by - cy) / d) * (size.r + 2)}" x2="${bx}" y2="${by}" stroke="${line}"/>`
      }
      return `${lead}<text x="${pl.tx}" y="${pl.ty}" text-anchor="middle" font-size="${size.label}" fill="${mute}" ${font}>${esc(input.points[i].name)}</text>`
    })
    .join('')

  const corner = (q: keyof typeof QUADRANTS, x: number, y: number, anchor: 'start' | 'end') =>
    `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${TYPE.corner}" font-weight="500" fill="${ink}" ${font}>${esc(QUADRANTS[q].name)}</text><text x="${x}" y="${y + hintGap}" text-anchor="${anchor}" font-size="${TYPE.hint}" fill="${mute}" ${font}>${esc(QUADRANTS[q].hint)}</text>`

  const pillSvg = pills
    .map((p) => {
      const x = pad + p.x
      const y = pillsTop + p.row * (PILL.h + PILL.rowGap)
      const cx = x + PILL.padL
      const cy = y + (PILL.h - PILL.check) / 2
      return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${p.w - 1}" height="${PILL.h - 1}" rx="7" fill="${accent}" fill-opacity="0.1" stroke="${accent}" stroke-opacity="0.45"/><path transform="translate(${cx} ${cy})" d="M3 7.5l2.75 2.75L11 4.75" fill="none" stroke="${accent}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><text x="${cx + PILL.check + PILL.iconGap}" y="${y + PILL.h / 2 + TYPE.pill * 0.36}" font-size="${TYPE.pill}" fill="${accent}" ${font}>${esc(p.label)}</text>`
    })
    .join('')

  const colW = (plotW - SCALE.colGap * (RANK_DIMENSIONS.length - 1)) / RANK_DIMENSIONS.length
  const cell = (colW - 4) / IMPORTANCE.length
  const trackY = scalesTop + SCALE.trackTop
  const scaleSvg = RANK_DIMENSIONS.map((d, i) => {
    const x = pad + i * (colW + SCALE.colGap)
    const step = Math.max(0, IMPORTANCE.findIndex((l) => l.value === toImportance(input.weights[d.key] ?? 1)))
    // Ignored dimensions grey out their name, as on the page.
    const nameFill = step === 0 ? mute : ink
    const dots = IMPORTANCE.map((_, j) => (j === step ? '' : `<circle cx="${x + 2 + cell * (j + 0.5)}" cy="${trackY + SCALE.trackH / 2}" r="1.75" fill="${dot}"/>`)).join('')
    return `<text x="${x}" y="${scalesTop + 16}" font-size="${TYPE.scale}" font-weight="500" fill="${nameFill}" ${font}>${esc(d.label)}</text><text x="${x + colW}" y="${scalesTop + 16}" text-anchor="end" font-size="${TYPE.scaleWord}" fill="${mute}" ${font}>${esc(IMPORTANCE[step].label)}</text><rect x="${x + 0.5}" y="${trackY + 0.5}" width="${colW - 1}" height="${SCALE.trackH - 1}" rx="5" fill="${track}" stroke="${trackLine}"/>${dots}<rect x="${x + 2 + cell * step + 0.5}" y="${trackY + 2.5}" width="${cell - 1}" height="${SCALE.trackH - 5}" rx="3" fill="${thumb}" stroke="${thumbLine}"/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <text x="${pad}" y="${titleY}" font-size="${TYPE.title}" font-weight="500" fill="${ink}" ${font}>The code multiplexer universe</text>
  <text x="${W - pad}" y="${titleY}" text-anchor="end" font-size="${TYPE.count}" fill="${mute}" ${font}>${esc(topText)}</text>
  ${pillSvg}
  ${scaleSvg}
  <rect x="${pad}" y="${plotTop}" width="${plotW}" height="${plotH}" rx="8" fill="${card}" stroke="${line}"/>
  <line x1="${pad + plotW / 4}" y1="${plotTop}" x2="${pad + plotW / 4}" y2="${plotTop + plotH}" stroke="${faint}"/>
  <line x1="${pad + (plotW * 3) / 4}" y1="${plotTop}" x2="${pad + (plotW * 3) / 4}" y2="${plotTop + plotH}" stroke="${faint}"/>
  <line x1="${pad}" y1="${plotTop + plotH / 4}" x2="${pad + plotW}" y2="${plotTop + plotH / 4}" stroke="${faint}"/>
  <line x1="${pad}" y1="${plotTop + (plotH * 3) / 4}" x2="${pad + plotW}" y2="${plotTop + (plotH * 3) / 4}" stroke="${faint}"/>
  <line x1="${pad + plotW / 2}" y1="${plotTop}" x2="${pad + plotW / 2}" y2="${plotTop + plotH}" stroke="${line}"/>
  <line x1="${pad}" y1="${plotTop + plotH / 2}" x2="${pad + plotW}" y2="${plotTop + plotH / 2}" stroke="${line}"/>
  ${corner('tl', pad + inset, cornerTop, 'start')}
  ${corner('tr', pad + plotW - inset, cornerTop, 'end')}
  ${corner('bl', pad + inset, cornerBottom, 'start')}
  ${corner('br', pad + plotW - inset, cornerBottom, 'end')}
  <text x="${pad + plotW / 2}" y="${xAxisY}" text-anchor="middle" font-size="${TYPE.axis}" fill="${mute}" ${font}>${xAxis}</text>
  <text transform="translate(${yAxisX} ${plotTop + plotH / 2}) rotate(-90)" text-anchor="middle" font-size="${TYPE.axis}" fill="${mute}" ${font}>${esc(yAxis)}</text>
  ${marks}
  ${names}
  <text x="${pad}" y="${footY}" font-size="${TYPE.foot}" fill="${mute}" ${font}>${esc(input.date)}</text>
  <text x="${W - pad}" y="${footY}" text-anchor="end" font-size="${TYPE.foot}" fill="${accent}" ${font}>hem.so/multiplexers</text>
</svg>`
}

/** Rasterise the SVG at 2× into a PNG blob. */
export async function snapshotBlob(input: SnapshotInput): Promise<Blob> {
  const svg = await buildSnapshotSvg(input)
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('could not render snapshot'))
    img.src = url
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.width * 2
  canvas.height = img.height * 2
  const ctx = canvas.getContext('2d')!
  ctx.scale(2, 2)
  ctx.drawImage(img, 0, 0)
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) throw new Error('could not encode snapshot')
  return blob
}

/** Hand the browser a PNG download. The fallback when the clipboard can't take an image. */
export async function downloadSnapshot(input: SnapshotInput, filename = 'code-multiplexers.png'): Promise<void> {
  const blob = await snapshotBlob(input)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

/**
 * Put the PNG on the clipboard. Returns 'copied' or, where the clipboard
 * can't take an image, falls back to a download and returns 'downloaded'.
 * The ClipboardItem is built synchronously with a promise for the bytes so
 * Safari still counts this as part of the click. The write is raced against
 * a short timeout because an unfocused Chromium document can leave it
 * pending forever instead of rejecting.
 */
export async function copySnapshot(input: SnapshotInput): Promise<'copied' | 'downloaded'> {
  const bytes = snapshotBlob(input)
  const canCopy = typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write
  if (canCopy) {
    try {
      const item = new ClipboardItem({ 'image/png': bytes })
      const written = navigator.clipboard.write([item]).then(() => true)
      const timedOut = new Promise<boolean>((r) => setTimeout(() => r(false), 4000))
      if (await Promise.race([written, timedOut])) return 'copied'
    } catch {
      // Permission denied or unsupported promise payloads: fall through to a download.
    }
  }
  const blob = await bytes
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'code-multiplexers.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  return 'downloaded'
}
