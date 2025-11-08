import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { schemaTypes } from './schemas'
import { assist } from '@sanity/assist'
import { locations, mainDocuments } from './lib/presentation/resolve'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const baseUrl = 'https://hem.so'

export default defineConfig({
  name: 'default',
  title: 'Hemanth\'s CMS',
  projectId,
  dataset,
  plugins: [
    structureTool(),
    presentationTool({
      resolve: { locations, mainDocuments },
      previewUrl: {
        initial: baseUrl,
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
      allowOrigins: ['http://localhost:*', 'https://hem.so'],
    }),
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