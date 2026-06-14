// Custom Sanity Studio input for a `chartButton.targetIds` field.
//
// Contract:
//  - Field is `type: 'array', of: [{ type: 'string' }]` storing the IDs of the
//    `chart` blocks this button drives.
//  - Options are the chart blocks IN THE CURRENT DOCUMENT that have an `id`,
//    read via useFormValue(['content']) (absolute path from the doc root, so it
//    resolves regardless of how deeply this control block is nested).
//  - Renders a checkbox list (replaces the default array editor); writes the
//    whole array via set()/unset().
//  - Stale selections (a chart that was renamed/deleted) still render so the
//    author can clear them; schema validation also warns about them.

import { Card, Checkbox, Flex, Stack, Text } from '@sanity/ui'
import {
  set,
  unset,
  useFormValue,
  type ArrayOfPrimitivesInputProps,
} from 'sanity'

interface ChartOption {
  id: string
  title: string
  missing?: boolean
}

export function ChartTargetInput(props: ArrayOfPrimitivesInputProps) {
  const { value, onChange } = props
  const selected: string[] = Array.isArray(value) ? (value as string[]) : []

  const content = useFormValue(['content'])
  const charts: ChartOption[] = (Array.isArray(content) ? content : [])
    .filter(
      (b: any) => b && b._type === 'chart' && typeof b.id === 'string' && b.id,
    )
    .map((b: any) => ({
      id: b.id as string,
      title: (typeof b.title === 'string' && b.title.trim()) || b.id,
    }))

  // Keep stale selections visible so they can be removed.
  const options: ChartOption[] = [
    ...charts,
    ...selected
      .filter((id) => !charts.some((c) => c.id === id))
      .map((id) => ({ id, title: id, missing: true })),
  ]

  const toggle = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id]
    onChange(next.length ? set(next) : unset())
  }

  if (options.length === 0) {
    return (
      <Card padding={3} radius={2} tone="caution" border>
        <Text size={1}>
          No chart in this post has an ID yet. Add an ID to a Chart block to
          target it.
        </Text>
      </Card>
    )
  }

  return (
    <Stack space={3}>
      {options.map((c) => (
        <Flex key={c.id} align="center" gap={3}>
          <Checkbox
            id={`chart-target-${c.id}`}
            checked={selected.includes(c.id)}
            onChange={() => toggle(c.id)}
          />
          <Stack space={1}>
            <Text size={1}>
              {c.title}
              {c.missing ? ' — missing' : ''}
            </Text>
            <Text size={0} muted>
              {c.id}
            </Text>
          </Stack>
        </Flex>
      ))}
    </Stack>
  )
}

export default ChartTargetInput
