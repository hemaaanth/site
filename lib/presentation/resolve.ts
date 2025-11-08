import { defineDocuments, defineLocations } from 'sanity/presentation'

// Configures the "Used on x pages" banner
export const locations = {
  // Map document types to frontend routes
  post: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [
        { title: doc.title || 'Untitled', href: `/posts/${doc.slug}` },
        { title: 'Posts Index', href: '/posts' },
      ],
    }),
  }),
  place: defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => ({
      locations: [
        { title: doc.title || 'Untitled', href: `/places/${doc.slug}` },
        { title: 'Places Index', href: '/places' },
      ],
    }),
  }),
}

// Configures documents presentation tool should open by default when navigating to an URL
export const mainDocuments = defineDocuments([
  {
    route: '/posts/:slug',
    filter: `_type == "post" && slug.current == $slug`,
  },
  {
    route: '/places/:slug',
    filter: `_type == "place" && slug.current == $slug`,
  },
])

