import type { NextApiRequest, NextApiResponse } from 'next'

// Enable draft mode for Sanity live preview
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable preview mode (Pages Router uses setPreviewData)
  res.setPreviewData({})
  
  // Sanity Presentation tool sends the preview path in these params:
  // - sanity-preview-pathname: the path from locations resolver
  // - sanity-preview-secret: optional secret for verification
  const pathname = req.query['sanity-preview-pathname'] as string
  
  // Also check for redirect param (some Sanity versions use this)
  const redirect = req.query['redirect'] as string
  
  // Fallback to old format (slug + type) for backwards compatibility
  const slug = req.query.slug as string
  const type = req.query.type as string
  
  let redirectPath = '/'
  
  if (pathname && pathname !== '/') {
    // Use the pathname directly from Sanity
    redirectPath = pathname
  } else if (redirect && redirect !== '/') {
    // Use redirect param if provided
    redirectPath = redirect
  } else if (slug && type) {
    // Fallback to old format
    redirectPath = type === 'post' ? `/posts/${slug}` : `/places/${slug}`
  }
  
  // Log for debugging (remove in production)
  console.log('[draft-mode/enable] Query params:', req.query)
  console.log('[draft-mode/enable] Redirecting to:', redirectPath)
  
  res.redirect(307, redirectPath)
}

