import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemas'
import { assist } from '@sanity/assist'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

export default defineConfig({
  name: 'default',
  title: 'Hemanth\'s CMS',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    assist({
      assist: {
        localeSettings: () => Intl.DateTimeFormat().resolvedOptions(),
        maxPathDepth: 4,
        temperature: 0.3
      },
    }),
  ],
  schema: {
    types: schemaTypes,
  },
})