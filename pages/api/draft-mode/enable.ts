import type { NextApiRequest, NextApiResponse } from 'next'

// Enable draft mode for Sanity live preview
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Enable preview mode (Pages Router uses setPreviewData)
  res.setPreviewData({})
  
  // Redirect to the preview URL if provided
  const slug = req.query.slug as string
  const type = req.query.type as string
  
  if (slug && type) {
    const path = type === 'post' ? `/posts/${slug}` : `/places/${slug}`
    res.redirect(307, path)
  } else {
    res.redirect(307, '/')
  }
}

