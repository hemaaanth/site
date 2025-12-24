import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@sanity/client'
import { WebhookHandler } from '@liveblocks/node'
import { addNotification } from '../../../lib/notificationQueue'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN,
})

const webhookHandler = new WebhookHandler(
  process.env.LIVEBLOCKS_WEBHOOK_SECRET || ''
)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify webhook signature
    const event = webhookHandler.verifyRequest({
      headers: req.headers as Record<string, string>,
      rawBody: JSON.stringify(req.body),
    })

    console.log('Liveblocks webhook event:', event.type)

    // Extract room ID from event
    const roomId = event.data.roomId

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
      console.error('Session not found for room:', roomId)
      return res.status(404).json({ error: 'Session not found' })
    }

    // Handle different event types
    switch (event.type) {
      case 'commentCreated': {
        const { userId, threadId, comment } = event.data as any

        console.log('Comment created by userId:', userId)

        // Determine if the commenter is the owner
        const isOwnerComment = userId.includes(session.createdBy.email)

        if (isOwnerComment) {
          // Owner commented - notify all recipients
          console.log('Owner commented, notifying recipients')
          for (const recipient of session.recipients) {
            await addNotification(recipient.email, {
              type: 'comment',
              sessionId: session._id,
              documentTitle: session.documentReference.title,
              documentSlug: session.documentReference.slug.current,
              from: session.createdBy.name,
              content: comment.body?.content || 'New comment',
              threadId,
              timestamp: new Date().toISOString(),
            })
          }
        } else {
          // Recipient/guest commented - notify owner
          console.log('Recipient/guest commented, notifying owner')
          
          // Try to find the commenter in recipients
          const commenterRecipient = session.recipients.find((r: any) =>
            userId.includes(r.email) || userId.includes(r.recipientId)
          )

          // Get commenter name from the comment metadata if available
          const commenterName = commenterRecipient?.name || 
                               (comment.createdBy as any)?.name || 
                               'A reviewer'

          await addNotification(session.createdBy.email, {
            type: 'comment',
            sessionId: session._id,
            documentTitle: session.documentReference.title,
            documentSlug: session.documentReference.slug.current,
            from: commenterName,
            content: comment.body?.content || 'New comment',
            threadId,
            timestamp: new Date().toISOString(),
          })
        }

        // Update comment count in session
        await sanityClient
          .patch(session._id)
          .inc({ commentCount: 1 })
          .commit()

        break
      }

      case 'threadResolved': {
        const { userId, threadId } = event.data as any

        // If owner resolved, notify recipients
        const isOwnerResolve = userId.includes(session.createdBy.email)

        if (isOwnerResolve) {
          for (const recipient of session.recipients) {
            await addNotification(recipient.email, {
              type: 'resolve',
              sessionId: session._id,
              documentTitle: session.documentReference.title,
              documentSlug: session.documentReference.slug.current,
              from: session.createdBy.name,
              threadId,
              timestamp: new Date().toISOString(),
            })
          }
        }
        break
      }

      case 'threadUnresolved': {
        // Optional: handle unresolve events
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return res.status(400).json({ error: 'Webhook verification failed' })
  }
}

// Disable body parsing, we need the raw body for webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
}

