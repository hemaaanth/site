import { validatePreviewUrl } from '@sanity/preview-url-secret'
import type { NextApiRequest, NextApiResponse } from 'next'
import { client } from '../../../lib/sanity'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  res.setHeader('Referrer-Policy', 'no-referrer')

  if (req.method !== 'GET') return void res.status(405).end()
  if (!req.url || !client.config().token) return void res.status(401).end()

  try {
    const url = new URL(req.url, 'https://hem.so')
    const { isValid, redirectTo } = await validatePreviewUrl(
      client.withConfig({ useCdn: false }),
      url.toString(),
    )
    const target = new URL(redirectTo || '/', url)
    if (!isValid || target.origin !== url.origin || target.pathname.startsWith('//')) return void res.status(401).end()

    res.setPreviewData({}, { maxAge: 3600 })
    return void res.redirect(307, target.pathname + target.search + target.hash)
  } catch {
    return void res.status(401).end()
  }
}
