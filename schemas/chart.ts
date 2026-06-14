import { defineField, defineType } from 'sanity'

// A starter so the JSON field is never a blank wall.
const STARTER_CONFIG = JSON.stringify(
  {
    chart: { type: 'line' },
    xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
    series: [{ name: 'Series 1', data: [3, 5, 4, 7, 6, 9] }],
  },
  null,
  2,
)

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export default defineType({
  name: 'chart',
  title: 'Chart',
  type: 'object',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'display', title: 'Display' },
    { name: 'advanced', title: 'Advanced' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description: 'Rendered as HTML above the chart (not inside the chart image).',
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      group: 'content',
    }),
    defineField({
      name: 'caption',
      title: 'Source / caption',
      type: 'string',
      group: 'content',
      description: 'Small line below the chart, e.g. "Source: internal analytics."',
    }),
    defineField({
      name: 'altText',
      title: 'Alt text',
      type: 'text',
      rows: 2,
      group: 'content',
      description:
        'Plain-language description for screen readers & AI crawlers. Auto-generated from the data if left blank.',
    }),
    defineField({
      name: 'config',
      title: 'Config (Highcharts JSON)',
      type: 'text',
      rows: 14,
      group: 'content',
      initialValue: STARTER_CONFIG,
      description:
        'Data & structure only. Do NOT set titles, colors or credits — the Title field above and the brand theme own those. Pick a palette slot per series with "colorIndex": 0–9.',
      validation: (Rule) => [
        Rule.required(),
        Rule.custom((value) => {
          if (typeof value !== 'string' || !value.trim()) return true // required handles empty
          let parsed: unknown
          try {
            parsed = JSON.parse(value)
          } catch (err: any) {
            return `Invalid JSON: ${err?.message || 'could not parse'}`
          }
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return 'Config must be a JSON object.'
          }
          return true
        }),
        Rule.custom((value) => {
          if (typeof value !== 'string' || !value.trim()) return true
          let v: any
          try {
            v = JSON.parse(value)
          } catch {
            return true // parse error is reported by the rule above
          }
          const bad: string[] = []
          if (v && typeof v === 'object') {
            for (const key of ['title', 'subtitle', 'colors']) {
              if (key in v) bad.push(key)
            }
            const series = Array.isArray(v.series) ? v.series : []
            if (series.some((s: any) => s && typeof s === 'object' && 'color' in s)) {
              bad.push('series[].color')
            }
          }
          return bad.length
            ? `These are applied by the brand theme/fields and will be ignored — remove: ${bad.join(', ')}.`
            : true
        }).warning(),
      ],
    }),
    defineField({
      name: 'variant',
      title: 'Variant',
      type: 'string',
      group: 'display',
      options: {
        list: [
          { title: 'Standard', value: 'standard' },
          { title: 'Simple (illustrative)', value: 'simple' },
        ],
        layout: 'radio',
      },
      initialValue: 'standard',
      description:
        'Simple strips axis labels, ticks, gridlines and interactivity — for illustrative "shape only" charts.',
    }),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      group: 'display',
      options: {
        list: [
          { title: 'Column', value: 'column' },
          { title: 'Wide', value: 'wide' },
          { title: 'Full bleed', value: 'full' },
        ],
      },
      initialValue: 'column',
    }),
    defineField({
      name: 'aspectRatio',
      title: 'Aspect ratio',
      type: 'string',
      group: 'display',
      options: { list: ['16/9', '4/3', '1/1', '21/9', '3/1'] },
      initialValue: '16/9',
    }),
    defineField({
      name: 'frame',
      title: 'Show card frame',
      type: 'boolean',
      group: 'display',
      initialValue: true,
      description: 'Wrap the chart in the bordered card (like text diagrams). Off = bare.',
    }),
    defineField({
      name: 'id',
      title: 'ID',
      type: 'string',
      group: 'advanced',
      description:
        'Optional. Set this only if a Chart Controls block needs to target this chart. Lowercase kebab-case, e.g. revenue-by-channel. Must be unique within the post.',
      validation: (Rule) =>
        Rule.custom((value, ctx) => {
          if (!value) return true
          if (typeof value !== 'string') return 'Invalid id'
          if (!KEBAB.test(value)) {
            return 'Use lowercase kebab-case, e.g. revenue-by-channel'
          }
          const blocks: any[] = Array.isArray((ctx.document as any)?.content)
            ? (ctx.document as any).content
            : []
          const count = blocks.filter(
            (b) => b && b._type === 'chart' && b.id === value,
          ).length
          return count > 1
            ? 'Another chart in this post already uses this id — ids must be unique.'
            : true
        }),
    }),
  ],
  preview: {
    select: { title: 'title', config: 'config' },
    prepare({ title, config }) {
      let type = 'chart'
      try {
        const v = JSON.parse(config || '{}')
        type =
          v?.chart?.type ||
          (Array.isArray(v?.series) && v.series[0]?.type) ||
          'line'
      } catch {
        // ignore — invalid JSON is surfaced by field validation
      }
      return { title: title || 'Chart', subtitle: `${type} chart` }
    },
  },
})
