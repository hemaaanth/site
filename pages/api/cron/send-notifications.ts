import type { NextApiRequest, NextApiResponse } from 'next'
import {
  getAllPendingRecipients,
  getNotifications,
  clearNotifications,
  isDebounceActive,
  getOldestNotificationAge,
} from '../../../lib/notificationQueue'
import { sendNotificationEmail } from '../../../lib/email/sendNotification'

const DEBOUNCE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes
const MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes - force send after this

/**
 * Cron job that runs every 5 minutes to send batched notifications
 * 
 * Protected by Vercel Cron secret or custom CRON_SECRET
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is a legitimate cron request
  const authHeader = req.headers.authorization
  const cronSecret = process.env.CRON_SECRET

  // Check Vercel Cron auth header
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  console.log('Starting notification batch send...')

  try {
    const recipients = await getAllPendingRecipients()
    console.log(`Found ${recipients.length} recipients with pending notifications`)

    let sentCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const recipient of recipients) {
      try {
        const notifications = await getNotifications(recipient)

        if (notifications.length === 0) {
          await clearNotifications(recipient)
          continue
        }

        // Check if debounce is still active
        const debounceActive = await isDebounceActive(recipient)
        const oldestAge = await getOldestNotificationAge(recipient)

        // Send if:
        // 1. Debounce window has expired (5 minutes since last notification)
        // 2. OR oldest notification is older than 10 minutes (force send)
        const shouldSend =
          !debounceActive ||
          (oldestAge !== null && oldestAge > MAX_AGE_MS)

        if (!shouldSend) {
          console.log(
            `Skipping ${recipient} - debounce active (${Math.round((oldestAge || 0) / 1000)}s old)`
          )
          skippedCount++
          continue
        }

        console.log(
          `Sending ${notifications.length} notification(s) to ${recipient}`
        )

        const success = await sendNotificationEmail(recipient, notifications)

        if (success) {
          await clearNotifications(recipient)
          sentCount++
        } else {
          errors.push(`Failed to send to ${recipient}`)
        }
      } catch (error) {
        console.error(`Error processing notifications for ${recipient}:`, error)
        errors.push(`Error for ${recipient}: ${error}`)
      }
    }

    const summary = {
      success: true,
      totalRecipients: recipients.length,
      sent: sentCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    }

    console.log('Notification batch send complete:', summary)

    return res.status(200).json(summary)
  } catch (error) {
    console.error('Cron job error:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to process notifications',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

