import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@sanity/client'
import { addNotification } from '../../lib/notificationQueue'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN,
})

/**
 * Test endpoint to manually simulate a webhook event
 * Use this for local testing when LiveBlocks webhooks can't reach localhost
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { roomId, userId, userName, commentContent } = req.body

    if (!roomId) {
      return res.status(400).json({ 
        error: 'roomId is required',
        usage: 'POST with body: { roomId: "preview-...", userId: "user123", userName: "John", commentContent: "Test comment" }'
      })
    }

    console.log('Test webhook triggered for room:', roomId)

    // Fetch review info from Sanity
    const session = await sanityClient.fetch(
      `*[_type == "review" && liveblocksRoomId == $roomId][0]{
        _id,
        mode,
        createdBy,
        recipients,
        documentReference->{
          _id,
          title,
          slug
        }
      }`,
      { roomId }
    )

    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found for room',
        roomId,
        hint: 'Make sure you created a review and copied the correct room ID'
      })
    }

    console.log('Session found:', {
      sessionId: session._id,
      owner: session.createdBy.email,
      recipients: session.recipients.map((r: any) => r.email),
    })

    // Simulate a comment event
    const isOwnerComment = userId && userId.includes(session.createdBy.email)

    if (isOwnerComment) {
      // Owner commented - notify all recipients
      console.log('Simulating owner comment -> notifying recipients')
      for (const recipient of session.recipients) {
        await addNotification(recipient.email, {
          type: 'comment',
          sessionId: session._id,
          documentTitle: session.documentReference.title,
          documentSlug: session.documentReference.slug.current,
          from: session.createdBy.name,
          content: commentContent || 'Test comment from owner',
          threadId: 'test-thread',
          timestamp: new Date().toISOString(),
        })
        console.log(`Notification queued for recipient: ${recipient.email}`)
      }

      return res.status(200).json({
        success: true,
        message: 'Owner comment simulated',
        notified: session.recipients.map((r: any) => r.email),
      })
    } else {
      // Guest/recipient commented - notify owner
      console.log('Simulating guest comment -> notifying owner')
      
      await addNotification(session.createdBy.email, {
        type: 'comment',
        sessionId: session._id,
        documentTitle: session.documentReference.title,
        documentSlug: session.documentReference.slug.current,
        from: userName || 'Test Guest',
        content: commentContent || 'Test comment from guest',
        threadId: 'test-thread',
        timestamp: new Date().toISOString(),
      })
      console.log(`Notification queued for owner: ${session.createdBy.email}`)

      return res.status(200).json({
        success: true,
        message: 'Guest comment simulated',
        notified: [session.createdBy.email],
      })
    }
  } catch (error) {
    console.error('Test webhook error:', error)
    return res.status(500).json({
      error: 'Failed to process test webhook',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

