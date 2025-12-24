import type { NextApiRequest, NextApiResponse } from 'next'
import { Liveblocks } from '@liveblocks/node'
import { createClient } from '@sanity/client'
import crypto from 'crypto'

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { room, sessionId, userEmail, userName, recipientId } = req.body

    console.log('Auth request:', { room, sessionId, userEmail, userName, recipientId })

    if (!room || !sessionId || !userEmail || !userName) {
      console.error('Missing parameters:', { room, sessionId, userEmail, userName })
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    // Fetch the review from Sanity
    console.log('Fetching session:', sessionId)
    const session = await sanityClient.fetch(
      `*[_type == "review" && _id == $sessionId && !revoked][0]{
        _id,
        liveblocksRoomId,
        mode,
        createdBy,
        recipients,
        expiresAt
      }`,
      { sessionId }
    )

    console.log('Session found:', session ? 'yes' : 'no')

    if (!session) {
      console.error('No session found for sessionId:', sessionId)
      return res.status(403).json({ error: 'Invalid or revoked session' })
    }

    // Check if session is expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Session expired' })
    }

    // Verify room ID matches
    if (session.liveblocksRoomId !== room) {
      return res.status(403).json({ error: 'Room mismatch' })
    }

    // Determine if user is the owner or a recipient
    const isOwner = session.createdBy.email.toLowerCase() === userEmail.toLowerCase()
    
    // In shared mode with recipientId, verify it matches
    let matchingRecipient = null
    if (recipientId) {
      matchingRecipient = session.recipients?.find(
        (r: any) => r.recipientId === recipientId
      )
      if (!matchingRecipient) {
        return res.status(403).json({ error: 'Invalid recipient ID' })
      }
    } else {
      // Fallback: find by email
      matchingRecipient = session.recipients?.find(
        (r: any) => r.email.toLowerCase() === userEmail.toLowerCase()
      )
    }
    
    const isRecipient = !!matchingRecipient

    if (!isOwner && !isRecipient) {
      return res.status(403).json({ error: 'User not authorized for this session' })
    }

    // Generate a stable user ID
    // In shared mode, use recipientId for unique identification
    // In private mode, use email + sessionId (since each recipient has their own session)
    let userId: string
    if (recipientId && session.mode === 'shared') {
      // Use recipientId directly for shared mode to ensure unique user IDs
      userId = recipientId
    } else {
      // For private mode or when no recipientId, use email + session hash
      userId = crypto
        .createHash('sha256')
        .update(`${userEmail}-${sessionId}`)
        .digest('hex')
        .substring(0, 16)
    }

    // Get the user's name from session data
    let displayName = userName
    if (isOwner) {
      displayName = session.createdBy.name
    } else if (matchingRecipient) {
      displayName = matchingRecipient.name || userName
    }

    // Check Liveblocks secret key
    if (!process.env.LIVEBLOCKS_SECRET_KEY) {
      console.error('LIVEBLOCKS_SECRET_KEY is not set')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    console.log('Authorizing with Liveblocks:', { room, userId, displayName, email: userEmail, isOwner, mode: session.mode })

    // Use prepareSession (access tokens) for preview mode
    // This is simpler and appropriate for "anyone with token can access" use case
    const liveblocksSession = liveblocks.prepareSession(userId, {
      userInfo: {
        name: displayName,
        email: userEmail,
        isOwner: isOwner,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      },
    })

    // Grant full access to the preview room
    liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS)

    // Authorize the session
    const { body, status } = await liveblocksSession.authorize()

    console.log('Liveblocks auth successful for user:', displayName)
    return res.status(status).send(body)
  } catch (error) {
    console.error('Liveblocks auth error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack)
    }
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

