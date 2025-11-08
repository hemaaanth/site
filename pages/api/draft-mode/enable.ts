import type { NextApiRequest, NextApiResponse } from 'next'

// Enable draft mode for Sanity live preview
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable preview mode (Pages Router uses setPreviewData)
  res.setPreviewData({})
  
  // Sanity sends pathname in sanity-preview-pathname query param
  // Format: /posts/slug or /places/slug
  const pathname = req.query['sanity-preview-pathname'] as string
  
  // Fallback to old format (slug + type) for backwards compatibility
  const slug = req.query.slug as string
  const type = req.query.type as string
  
  let redirectPath = '/'
  
  if (pathname) {
    // Use the pathname directly from Sanity
    redirectPath = pathname
  } else if (slug && type) {
    // Fallback to old format
    redirectPath = type === 'post' ? `/posts/${slug}` : `/places/${slug}`
  }
  
  res.redirect(307, redirectPath)
}

