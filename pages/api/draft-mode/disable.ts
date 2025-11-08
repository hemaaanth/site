import type { NextApiRequest, NextApiResponse } from 'next'

// Disable draft mode for Sanity live preview
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Disable preview mode
  res.clearPreviewData()
  
  // Redirect to home or the page they were on
  const redirect = (req.query.redirect as string) || '/'
  res.redirect(307, redirect)
}

