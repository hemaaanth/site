import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'rows',
      title: 'Rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'row',
          title: 'Row',
          fields: [
            {
              name: 'cells',
              title: 'Cells',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'cell',
                  fields: [
                    {
                      name: 'content',
                      type: 'array',
                      of: [{ type: 'block' }],
                      title: 'Cell Content',
                    },
                    {
                      name: 'isHeader',
                      type: 'boolean',
                      title: 'Header Cell',
                      initialValue: false,
                    },
                  ],
                  preview: {
                    select: {
                      content: 'content',
                    },
                    prepare({ content }) {
                      const block = (content || []).find((item) => item._type === 'block')
                      return {
                        title: block
                          ? block.children
                              .filter((child) => child._type === 'span')
                              .map((span) => span.text)
                              .join('')
                              .substring(0, 50) || 'Empty cell'
                          : 'Empty cell',
                      }
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {
              cells: 'cells',
            },
            prepare({ cells }) {
              const cellCount = cells?.length || 0
              const firstCell = cells?.[0]?.content
              const block = firstCell?.find((item: any) => item._type === 'block')
              const preview = block
                ? block.children
                    .filter((child: any) => child._type === 'span')
                    .map((span: any) => span.text)
                    .join('')
                    .substring(0, 30)
                : 'Empty row'
              return {
                title: `${cellCount} cells: ${preview}...`,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      rows: 'rows',
    },
    prepare({ rows }) {
      const rowCount = rows?.length || 0
      const colCount = rows?.[0]?.cells?.length || 0
      return {
        title: `Table (${rowCount}×${colCount})`,
      }
    },
  },
})

