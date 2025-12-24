import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@sanity/client'
import { nanoid } from 'nanoid'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN,
})

interface Recipient {
  name: string
  email: string
}

interface GeneratePreviewRequest {
  documentId: string
  documentType: 'post' | 'place'
  slug: string
  mode: 'private' | 'shared'
  recipients: Recipient[]
  ownerInfo: {
    id?: string
    name: string
    email: string
  }
  expirationDays?: number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      documentId,
      documentType,
      slug,
      mode,
      recipients,
      ownerInfo,
      expirationDays = 14,
    }: GeneratePreviewRequest = req.body

    // Validate required fields
    if (!documentId || !documentType || !slug || !mode || !recipients || !ownerInfo) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'At least one recipient is required' })
    }

    // Validate mode-specific recipient count
    if (mode === 'private' && recipients.length > 1) {
      return res.status(400).json({ error: 'Private mode allows only one recipient' })
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(ownerInfo.email)) {
      return res.status(400).json({ error: 'Invalid owner email' })
    }

    for (const recipient of recipients) {
      if (!recipient.name || !recipient.email) {
        return res.status(400).json({ error: 'Recipient name and email are required' })
      }
      if (!emailRegex.test(recipient.email)) {
        return res.status(400).json({ error: `Invalid email: ${recipient.email}` })
      }
    }

    // Deduplicate recipients by email
    const uniqueRecipients = recipients.reduce((acc, recipient) => {
      const existing = acc.find(
        (r) => r.email.toLowerCase() === recipient.email.toLowerCase()
      )
      if (!existing) {
        acc.push({
          name: recipient.name,
          email: recipient.email,
        })
      }
      return acc
    }, [] as Recipient[])

    // Calculate expiration date
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + expirationDays)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hem.so'

    if (mode === 'private') {
      // PRIVATE MODE: Create one session per recipient with isolated rooms
      const sessions = []

      // In private mode, create a separate owner token for each session
      // so owner can reply to each recipient individually
      const ownerSessions: any[] = []

      for (const recipient of uniqueRecipients) {
        const recipientToken = nanoid(32)
        const ownerToken = nanoid(32)
        const liveblocksRoomId = `preview-${documentId}-${recipientToken}`
        
        const recipientUrl = `${baseUrl}/preview/${slug}?token=${recipientToken}`
        const ownerUrl = `${baseUrl}/preview/${slug}?token=${ownerToken}&userName=${encodeURIComponent(ownerInfo.name)}&userEmail=${encodeURIComponent(ownerInfo.email)}`

        // Create the recipient's session
        const session = await sanityClient.create({
          _type: 'review',
          token: recipientToken,
          liveblocksRoomId,
          documentReference: {
            _type: 'reference',
            _ref: documentId.replace(/^drafts\./, ''),
            _weak: true, // Allow referencing drafts
          },
          documentSlug: slug,
          documentTitle: `Preview for ${slug}`,
          mode,
          createdBy: {
            id: ownerInfo.id || ownerInfo.email,
            name: ownerInfo.name,
            email: ownerInfo.email,
            reviewUrl: ownerUrl,
          },
          recipients: [{
            _key: nanoid(12),
            name: recipient.name,
            email: recipient.email,
            reviewUrl: recipientUrl,
            token: recipientToken,
            addedAt: new Date().toISOString(),
          }],
          expiresAt: expiresAt.toISOString(),
          revoked: false,
          createdAt: new Date().toISOString(),
          commentCount: 0,
        })

        // Create owner's access to this room
        await sanityClient.create({
          _type: 'review',
          token: ownerToken,
          liveblocksRoomId, // Same room as recipient
          documentReference: {
            _type: 'reference',
            _ref: documentId.replace(/^drafts\./, ''),
            _weak: true, // Allow referencing drafts
          },
          documentSlug: slug,
          documentTitle: `Preview for ${slug}`,
          mode,
          createdBy: {
            id: ownerInfo.id || ownerInfo.email,
            name: ownerInfo.name,
            email: ownerInfo.email,
            reviewUrl: ownerUrl,
          },
          recipients: [{
            _key: nanoid(12),
            name: recipient.name,
            email: recipient.email,
            reviewUrl: recipientUrl,
            token: recipientToken,
            addedAt: new Date().toISOString(),
          }],
          expiresAt: expiresAt.toISOString(),
          revoked: false,
          createdAt: new Date().toISOString(),
          commentCount: 0,
          isOwnerAccess: true, // Flag to identify owner's access token
        })

        sessions.push({
          sessionId: session._id,
          recipient: recipient.email,
          recipientName: recipient.name,
          previewUrl: recipientUrl,
        })

        ownerSessions.push({
          sessionId: 'owner',
          recipient: ownerInfo.email,
          recipientName: `${ownerInfo.name} (You - Owner) → ${recipient.name}`,
          previewUrl: ownerUrl,
        })
      }

      return res.status(200).json({
        success: true,
        mode,
        sessions: [...ownerSessions, ...sessions], // Owner links first
        expiresAt: expiresAt.toISOString(),
      })
    } else {
      // SHARED MODE: Create one session with one room, but generate unique URLs per recipient
      const sharedToken = nanoid(32)
      const liveblocksRoomId = `preview-${documentId}-${sharedToken}`

      // Generate owner URL
      const ownerUrl = `${baseUrl}/preview/${slug}?token=${sharedToken}&userName=${encodeURIComponent(ownerInfo.name)}&userEmail=${encodeURIComponent(ownerInfo.email)}`

      // Add recipient IDs and tokens for URL generation
      const recipientsWithIds = uniqueRecipients.map(recipient => {
        const recipientId = nanoid(16)
        const recipientUrl = `${baseUrl}/preview/${slug}?token=${sharedToken}&recipientId=${recipientId}`
        
        return {
          _key: nanoid(12),
          name: recipient.name,
          email: recipient.email,
          recipientId, // Unique ID for each recipient in shared mode
          reviewUrl: recipientUrl,
          addedAt: new Date().toISOString(),
        }
      })

      const session = await sanityClient.create({
        _type: 'review',
        token: sharedToken,
        liveblocksRoomId,
        documentReference: {
          _type: 'reference',
          _ref: documentId.replace(/^drafts\./, ''),
          _weak: true, // Allow referencing drafts
        },
        documentSlug: slug,
        documentTitle: `Preview for ${slug}`,
        mode,
        createdBy: {
          id: ownerInfo.id || ownerInfo.email,
          name: ownerInfo.name,
          email: ownerInfo.email,
          reviewUrl: ownerUrl,
        },
        recipients: recipientsWithIds,
        expiresAt: expiresAt.toISOString(),
        revoked: false,
        createdAt: new Date().toISOString(),
        commentCount: 0,
      })

      // Generate unique URLs for each recipient with their recipientId
      const recipientUrls = recipientsWithIds.map(recipient => ({
        recipient: recipient.email,
        recipientName: recipient.name,
        previewUrl: recipient.reviewUrl,
      }))

      // Add owner link with owner's email as identifier
      const ownerUrlObj = {
        recipient: ownerInfo.email,
        recipientName: `${ownerInfo.name} (You - Owner)`,
        previewUrl: ownerUrl,
      }

      return res.status(200).json({
        success: true,
        mode,
        sessionId: session._id,
        sessions: [ownerUrlObj, ...recipientUrls], // Owner link first
        sharedToken,
        expiresAt: expiresAt.toISOString(),
        recipientCount: uniqueRecipients.length,
      })
    }
  } catch (error) {
    console.error('Error generating preview:', error)
    return res.status(500).json({ error: 'Failed to generate preview' })
  }
}

