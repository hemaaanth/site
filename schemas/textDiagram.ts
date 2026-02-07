import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'textDiagram',
  title: 'Text Diagram',
  type: 'object',
  fields: [
    defineField({
      name: 'content',
      title: 'Diagram Content',
      type: 'text',
      description: 'ASCII art or text-based diagram. Use monospace characters for alignment.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional caption for the diagram',
    }),
    defineField({
      name: 'captionPosition',
      title: 'Caption Position',
      type: 'string',
      options: {
        list: [
          { title: 'Top', value: 'top' },
          { title: 'Bottom', value: 'bottom' },
        ],
      },
      initialValue: 'bottom',
    }),
    defineField({
      name: 'minWidth',
      title: 'Minimum Width (characters)',
      type: 'number',
      description: 'Minimum character width to preserve. Leave empty for auto.',
      initialValue: undefined,
    }),
  ],
  preview: {
    select: {
      content: 'content',
      caption: 'caption',
    },
    prepare({ content, caption }) {
      const lines = (content || '').split('\n')
      const preview = lines[0]?.substring(0, 40) || 'Empty diagram'
      return {
        title: caption || 'Text Diagram',
        subtitle: `${lines.length} lines: ${preview}...`,
      }
    },
  },
})
