import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { presentationTool } from 'sanity/presentation'
import { schemaTypes } from './schemas'
import { assist } from '@sanity/assist'
import { locations, mainDocuments } from './lib/presentation/resolve'
import { GeneratePreviewAction } from './actions/generatePreviewAction'
import { DeleteReviewAction } from './actions/deleteReviewAction'
import { OpenReviewsBadge } from './components/sanity/OpenReviewsBadge'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const baseUrl = 'https://hem.so'

export default defineConfig({
  name: 'default',
  title: 'Hemanth\'s CMS',
  projectId,
  dataset,
  basePath: '/cms',
  plugins: [
    structureTool(),
    presentationTool({
      resolve: { locations, mainDocuments },
      previewUrl: {
        origin: baseUrl,
        previewMode: {
          enable: '/api/draft-mode/enable',
          disable: '/api/draft-mode/disable',
        },
      },
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
  document: {
    actions: (prev, context) => {
      // Add generate preview action for posts and places
      if (context.schemaType === 'post' || context.schemaType === 'place') {
        return [...prev, GeneratePreviewAction]
      }
      // Replace default delete action with cleanup version for reviews
      if (context.schemaType === 'review') {
        return prev.map(action => 
          action.action === 'delete' ? DeleteReviewAction : action
        )
      }
      return prev
    },
    badges: (prev, context) => {
      // Add open reviews badge for posts and places
      if (context.schemaType === 'post' || context.schemaType === 'place') {
        return [...prev, OpenReviewsBadge]
      }
      return prev
    },
  },
})
