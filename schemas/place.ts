import { defineField, defineType } from 'sanity'
import { AreaPolygonInput } from '../components/sanity/AreaPolygonInput'

// Validates that a string field contains a well-formed GeoJSON Polygon geometry.
// Mirrors the parseAreaGeometry helper in lib/areas.ts — kept inline here to avoid
// pulling the broader codebase into Studio bundles via schema imports.
function validatePolygonGeojson(value: string | undefined): true | string {
  if (!value) return 'Required'
  if (value.length > 200_000) return 'Polygon too large (>200KB)'
  let parsed: unknown
  try {
    parsed = JSON.parse(value, (k, v) =>
      k === '__proto__' || k === 'constructor' || k === 'prototype' ? undefined : v,
    )
  } catch {
    return 'Invalid JSON'
  }
  if (!parsed || typeof parsed !== 'object') return 'Not a geometry object'
  const g = parsed as { type?: unknown; coordinates?: unknown }
  if (g.type !== 'Polygon') return 'Must be GeoJSON Polygon'
  if (!Array.isArray(g.coordinates) || g.coordinates.length === 0) return 'Missing coordinates'
  return true
}

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
      name: 'geocodeHint',
      title: 'Geocode hint',
      type: 'string',
      description:
        'Optional. Overrides the title for Mapbox geocoding when the city name is ambiguous (e.g., "Cambridge, UK").',
    }),
    defineField({
      name: 'areas',
      title: 'Areas',
      description:
        'Polygon overlays on the city map. First row is the top recommendation.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'area',
          fields: [
            {
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              description:
                'Shown on hover/tap. Plain text, line breaks allowed. Best for: ___ . Tradeoff: ___',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'kind',
              title: 'Kind',
              type: 'string',
              options: {
                list: [
                  { title: 'General', value: 'general' },
                  { title: 'Where to stay', value: 'stay' },
                  { title: 'Day trip', value: 'daytrip' },
                  { title: 'Avoid', value: 'avoid' },
                ],
                layout: 'radio',
              },
              initialValue: 'general',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'geojson',
              title: 'Polygon',
              type: 'text',
              options: { aiAssist: { exclude: true } },
              components: { input: AreaPolygonInput },
              validation: (Rule) =>
                Rule.required().custom(validatePolygonGeojson),
            },
          ],
          preview: {
            select: { title: 'title', subtitle: 'kind' },
          },
        },
      ],
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
                  { title: 'Food', value: 'food' },
                  { title: 'Party', value: 'party' },
                  { title: 'Photo', value: 'photo' },
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
                    'food',
                    'party',
                    'photo',
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
                  if (types.includes('photo') && types.length > 1) {
                    return 'Photo cannot be combined with other types'
                  }
                  return true
                }),
            },
            {
              name: 'favourite',
              title: 'Favourite',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              description: 'Required for Photo venues. Otherwise ignored.',
              options: { hotspot: true },
              validation: (Rule) =>
                Rule.custom((image, ctx) => {
                  const types = (ctx.parent as { types?: string[] })?.types ?? []
                  if (types.includes('photo') && !image) {
                    return 'Photo venues need an image'
                  }
                  return true
                }),
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text',
              validation: (Rule) =>
                Rule.custom((value, ctx) => {
                  const types = (ctx.parent as { types?: string[] })?.types ?? []
                  // Photo venues don't need a description — the image speaks.
                  if (types.includes('photo')) return true
                  if (!value) return 'Required'
                  return true
                }),
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
      slug: 'slug.current',
    },
    prepare({ title, date, slug }) {
      return {
        title,
        subtitle: date,
      }
    },
  },
})

