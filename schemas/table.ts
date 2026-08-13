import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'table',
  title: 'Table',
  type: 'object',
  fields: [
    defineField({
      name: 'headerRows',
      type: 'number',
    }),
    defineField({
      name: 'rows',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'row',
          fields: [
            {
              name: 'cells',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'cell',
                  fields: [
                    {
                      name: 'value',
                      type: 'array',
                      of: [{ type: 'block' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  ],
})
