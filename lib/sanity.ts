import { createClient } from '@sanity/client'
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2024-01-01'
const token = process.env.SANITY_API_TOKEN || process.env.SANITY_API_READ_TOKEN
const studioUrl = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
}

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  token,
  // Enable Content Source Maps for visual editing (only in preview mode)
  perspective: 'published',
  stega: {
    enabled: false, // Disable stega encoding by default (only enable in preview)
  },
})

const builder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// GROQ queries
// Exclude drafts by checking if _id is not in drafts path
export const postsQuery = `*[_type == "post" && !(_id in path("drafts.**"))] | order(date desc) {
  _id,
  title,
  slug,
  date
}`

export const postBySlugQuery = `*[_type == "post" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  _id,
  title,
  slug,
  date,
  author,
  tldr,
  meta,
  category,
  depth,
  content
}`

// Query that includes drafts (for preview mode)
export const postBySlugQueryWithDrafts = `*[_type == "post" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  date,
  author,
  tldr,
  meta,
  category,
  depth,
  content
}`

export const publishedPostsQuery = `*[_type == "post" && !(_id in path("drafts.**"))] | order(date desc) {
  slug
}`

// Query for all posts including drafts (for admin/index page)
export const allPostsQuery = `*[_type == "post"] | order(date desc) {
  _id,
  title,
  slug,
  date
}`

// Places query - includes both published and drafts (drafts show as WIP)
// Note: Sanity includes drafts by default, but we query explicitly to be sure
export const placesQuery = `*[_type == "place"] | order(date desc, rank asc) {
  _id,
  title,
  slug,
  date,
  rank
}`

export const placeBySlugQuery = `*[_type == "place" && slug.current == $slug && !(_id in path("drafts.**"))][0] {
  _id,
  title,
  slug,
  date,
  rank,
  places
}`

// Query that includes drafts (for preview mode)
export const placeBySlugQueryWithDrafts = `*[_type == "place" && slug.current == $slug][0] {
  _id,
  title,
  slug,
  date,
  rank,
  places
}`

// Only published places for getStaticPaths (drafts don't have pages)
export const publishedPlacesQuery = `*[_type == "place" && !(_id in path("drafts.**"))] | order(date desc) {
  slug
}`

// Helper functions
export async function getAllPosts() {
  return await client.fetch(postsQuery)
}

export async function getAllPostsIncludingDrafts() {
  return await client.fetch(allPostsQuery)
}

export async function getPostBySlug(slug: string, includeDrafts = false) {
  const query = includeDrafts ? postBySlugQueryWithDrafts : postBySlugQuery
  // Use a client without CDN when fetching drafts, with Content Source Maps for visual editing
  const fetchClient = includeDrafts 
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false, // Drafts aren't in CDN
        token,
        perspective: 'previewDrafts', // Enable preview drafts perspective
        stega: {
          enabled: true, // Enable stega encoding for visual editing overlays
          studioUrl, // Required when stega is enabled
        },
      })
    : client
  return await fetchClient.fetch(query, { slug })
}

export async function getPublishedPostSlugs() {
  return await client.fetch(publishedPostsQuery)
}

export async function getAllPlaces() {
  // Use a client without CDN to ensure drafts are included
  // Drafts are not cached in CDN, so we need to bypass it
  return await client.fetch(placesQuery)
}

export async function getPlaceBySlug(slug: string, includeDrafts = false) {
  const query = includeDrafts ? placeBySlugQueryWithDrafts : placeBySlugQuery
  // Use a client without CDN when fetching drafts, with Content Source Maps for visual editing
  const fetchClient = includeDrafts 
    ? createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false, // Drafts aren't in CDN
        token,
        perspective: 'previewDrafts', // Enable preview drafts perspective
        stega: {
          enabled: true, // Enable stega encoding for visual editing overlays
          studioUrl, // Required when stega is enabled
        },
      })
    : client
  return await fetchClient.fetch(query, { slug })
}

export async function getPublishedPlaceSlugs() {
  return await client.fetch(publishedPlacesQuery)
}

