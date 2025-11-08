import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'place',
  title: 'Place',
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
      type: 'string',
      description: 'Year visited (e.g., "2025")',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'rank',
      title: 'Rank',
      type: 'number',
      description: 'Optional rank for sorting within the same year',
    }),
    defineField({
      name: 'places',
      title: 'Places',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'location',
              title: 'Location',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'types',
              title: 'Types',
              type: 'array',
              of: [{ type: 'string' }],
              options: {
                list: [
                  { title: 'Activity', value: 'activity' },
                  { title: 'Beer', value: 'beer' },
                  { title: 'Cocktails', value: 'cocktails' },
                  { title: 'Coffee', value: 'coffee' },
                  { title: 'Favourite', value: 'favourite' },
                  { title: 'Food', value: 'food' },
                  { title: 'Party', value: 'party' },
                  { title: 'Shop', value: 'shop' },
                  { title: 'Wine', value: 'wine' },
                  { title: 'Work', value: 'work' },
                ],
                layout: 'grid',
              },
              validation: (Rule) =>
                Rule.required().custom((types: string[] | undefined) => {
                  const allowedTypes = [
                    'activity',
                    'beer',
                    'cocktails',
                    'coffee',
                    'favourite',
                    'food',
                    'party',
                    'shop',
                    'wine',
                    'work',
                  ]
                  if (!types || types.length === 0) {
                    return 'At least one type is required'
                  }
                  const invalidTypes = types.filter(
                    (type) => !allowedTypes.includes(type),
                  )
                  if (invalidTypes.length > 0) {
                    return `Invalid types: ${invalidTypes.join(', ')}. Allowed types: ${allowedTypes.join(', ')}`
                  }
                  return true
                }),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              validation: (Rule) => Rule.required(),
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
    },
    prepare({ title, date }) {
      return {
        title,
        subtitle: date,
      }
    },
  },
})

