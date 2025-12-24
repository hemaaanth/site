import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tldr',
      title: 'TL;DR',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'meta',
      title: 'Meta',
      type: 'text',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Default', value: 'default' },
          { title: 'Wide', value: 'wide' },
        ],
      },
      initialValue: 'default',
    }),
    defineField({
      name: 'depth',
      title: 'TOC Depth',
      type: 'number',
      description: 'Maximum depth for table of contents',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL',
                    description: 'Full URL (https://...) or anchor link (#section)',
                    validation: (Rule) =>
                      Rule.custom((value) => {
                        if (!value) return true // Allow empty for optional links
                        // Ensure value is a string
                        if (typeof value !== 'string') return 'Must be a valid URL (https://...) or anchor link (#section)'
                        // Allow anchor links starting with #
                        if (value.startsWith('#')) return true
                        // Allow full URLs
                        try {
                          new URL(value)
                          return true
                        } catch {
                          return 'Must be a valid URL (https://...) or anchor link (#section)'
                        }
                      }),
                  },
                ],
              },
              {
                name: 'linkExternal',
                type: 'object',
                title: 'External Link',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL',
                    description: 'Full URL (https://...) or anchor link (#section)',
                    validation: (Rule) =>
                      Rule.custom((value) => {
                        if (!value) return true // Allow empty for optional links
                        // Ensure value is a string
                        if (typeof value !== 'string') return 'Must be a valid URL (https://...) or anchor link (#section)'
                        // Allow anchor links starting with #
                        if (value.startsWith('#')) return true
                        // Allow full URLs
                        try {
                          new URL(value)
                          return true
                        } catch {
                          return 'Must be a valid URL (https://...) or anchor link (#section)'
                        }
                      }),
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'object',
          name: 'aside',
          title: 'Aside',
          fields: [
            {
              name: 'content',
              type: 'array',
              of: [{ type: 'block' }],
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
                  : 'Aside',
              }
            },
          },
        },
        {
          type: 'table',
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      slug: 'slug.current',
      _id: '_id',
    },
    prepare({ title, date, slug, _id }) {
      return {
        title,
        subtitle: date,
        _id,
      }
    },
  },
})

