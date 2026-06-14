import { defineArrayMember, defineField, defineType } from 'sanity'
import { ChartTargetInput } from '../components/sanity/ChartTargetInput'

const ACTION_TYPES = ['isolate', 'highlight', 'recolor', 'setData', 'reset']

export default defineType({
  name: 'chartControls',
  title: 'Chart Controls',
  type: 'object',
  description:
    'Standalone buttons that drive one or more charts in this post by their ID.',
  fields: [
    defineField({
      name: 'buttons',
      title: 'Buttons',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'chartButton',
          title: 'Button',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'mode',
              title: 'Mode',
              type: 'string',
              options: {
                list: [
                  { title: 'One-shot (action)', value: 'action' },
                  { title: 'Toggle (on / off)', value: 'toggle' },
                ],
                layout: 'radio',
              },
              initialValue: 'action',
              description:
                'A toggle undoes its own effect when switched off; a one-shot disables until a reset.',
            }),
            defineField({
              name: 'targetIds',
              title: 'Target chart(s)',
              type: 'array',
              of: [{ type: 'string' }],
              components: { input: ChartTargetInput },
              validation: (Rule) => [
                Rule.required().min(1),
                Rule.custom((ids, ctx) => {
                  const list = Array.isArray(ids) ? (ids as string[]) : []
                  const charts: string[] = (
                    Array.isArray((ctx.document as any)?.content)
                      ? (ctx.document as any).content
                      : []
                  )
                    .filter((b: any) => b && b._type === 'chart' && b.id)
                    .map((b: any) => b.id)
                  const missing = list.filter((id) => !charts.includes(id))
                  return missing.length
                    ? `No chart in this post has id: ${missing.join(', ')} (renamed or deleted?)`
                    : true
                }).warning(),
              ],
            }),
            defineField({
              name: 'actions',
              title: 'Action(s) — JSON',
              type: 'text',
              rows: 4,
              initialValue: JSON.stringify(
                [{ type: 'highlight', series: [0] }],
                null,
                2,
              ),
              description:
                'JSON array. Types: highlight (series:[…]), isolate (series:[…]), recolor (series:[…], colorIndex:0–9), setData (series:0, data:[…]), reset. Series are 0-based indices OR names, e.g. [0] or ["Direct"].',
              validation: (Rule) =>
                Rule.custom((value) => {
                  if (typeof value !== 'string' || !value.trim()) {
                    return 'Add at least one action.'
                  }
                  let arr: any
                  try {
                    arr = JSON.parse(value)
                  } catch (err: any) {
                    return `Invalid JSON: ${err?.message || 'could not parse'}`
                  }
                  if (!Array.isArray(arr) || arr.length === 0) {
                    return 'Actions must be a non-empty JSON array.'
                  }
                  const bad = arr.find(
                    (a) => !a || !ACTION_TYPES.includes(a.type),
                  )
                  return bad
                    ? `Each action needs a "type" of: ${ACTION_TYPES.join(', ')}.`
                    : true
                }),
            }),
          ],
          preview: {
            select: { label: 'label', mode: 'mode', targetIds: 'targetIds' },
            prepare({ label, mode, targetIds }) {
              const t = Array.isArray(targetIds) ? targetIds.join(', ') : ''
              return {
                title: label || 'Button',
                subtitle: `${mode || 'action'}${t ? ` → ${t}` : ''}`,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { buttons: 'buttons' },
    prepare({ buttons }) {
      const n = Array.isArray(buttons) ? buttons.length : 0
      return {
        title: 'Chart controls',
        subtitle: `${n} button${n === 1 ? '' : 's'}`,
      }
    },
  },
})
