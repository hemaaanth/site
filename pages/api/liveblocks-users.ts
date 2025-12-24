import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@sanity/client'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN,
})

/**
 * Resolve LiveBlocks user IDs to user information for display
 * This is called by the LiveBlocks client to show user names in comments
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userIds } = req.body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(200).json([])
    }

    console.log('Resolving users:', userIds)

    // Fetch recent non-expired reviews to find user info
    // Limit to recent sessions for better performance
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const sessions = await sanityClient.fetch(
      `*[_type == "review" && !revoked && expiresAt > $cutoffDate] | order(createdAt desc) [0...100] {
        _id,
        createdBy,
        recipients,
        mode
      }`,
      { cutoffDate: oneMonthAgo.toISOString() }
    )

    const users: any[] = []
    const resolvedIds = new Set<string>()

    // For each requested userId, try to find the user info
    for (const userId of userIds) {
      if (resolvedIds.has(userId)) continue

      let userInfo = null

      // Search through all sessions
      for (const session of sessions) {
        // Check if this userId matches the owner
        const ownerHash = require('crypto')
          .createHash('sha256')
          .update(`${session.createdBy.email}-${session._id}`)
          .digest('hex')
          .substring(0, 16)

        if (userId === ownerHash || userId === session.createdBy.email) {
          userInfo = {
            name: session.createdBy.name,
            email: session.createdBy.email,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.createdBy.name)}`,
          }
          break
        }

        // Check if this userId matches a recipient
        if (session.recipients) {
          for (const recipient of session.recipients) {
            // Check by recipientId (shared mode)
            if (recipient.recipientId === userId) {
              userInfo = {
                name: recipient.name,
                email: recipient.email,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(recipient.name)}`,
              }
              break
            }

            // Check by email hash (private mode)
            const recipientHash = require('crypto')
              .createHash('sha256')
              .update(`${recipient.email}-${session._id}`)
              .digest('hex')
              .substring(0, 16)

            if (userId === recipientHash) {
              userInfo = {
                name: recipient.name,
                email: recipient.email,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(recipient.name)}`,
              }
              break
            }
          }

          if (userInfo) break
        }
      }

      if (userInfo) {
        users.push({
          name: userInfo.name,
          avatar: userInfo.avatar,
        })
        resolvedIds.add(userId)
      } else {
        // Fallback for unknown users
        console.warn(`Could not resolve user ID: ${userId}`)
        users.push({
          name: 'Unknown User',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=Unknown`,
        })
      }
    }

    console.log(`Resolved ${users.length} users:`, users)
    return res.status(200).json(users)
  } catch (error) {
    console.error('Error resolving users:', error)
    return res.status(500).json({ error: 'Failed to resolve users' })
  }
}

