import type { NextApiRequest, NextApiResponse } from 'next'
import { getAllPendingRecipients, getNotifications } from '../../lib/notificationQueue'

/**
 * Test endpoint to check notification queue status
 * Useful for debugging and verifying notifications are being queued
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const recipients = await getAllPendingRecipients()
    
    const queues = await Promise.all(
      recipients.map(async (email) => {
        const notifications = await getNotifications(email)
        return {
          email,
          count: notifications.length,
          notifications: notifications.map(n => ({
            type: n.type,
            from: n.from,
            documentTitle: n.documentTitle,
            timestamp: n.timestamp,
            content: n.content?.substring(0, 100) || '',
          })),
        }
      })
    )
    
    return res.status(200).json({
      success: true,
      totalRecipients: recipients.length,
      queues,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error checking notifications:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to check notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

