import type { NextApiRequest, NextApiResponse } from 'next'
import { sendNotificationEmail } from '../../lib/email/sendNotification'
import { getNotifications, clearNotifications } from '../../lib/notificationQueue'

/**
 * Test endpoint to manually trigger email sending
 * Useful for local development and testing without waiting for cron
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { email } = req.query
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ 
      error: 'Email parameter required',
      usage: '/api/test-send-email?email=recipient@example.com'
    })
  }
  
  try {
    const notifications = await getNotifications(email)
    
    if (notifications.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No notifications to send',
        to: email,
      })
    }
    
    console.log(`Manually sending ${notifications.length} notification(s) to ${email}`)
    
    const success = await sendNotificationEmail(email, notifications)
    
    if (success) {
      await clearNotifications(email)
      return res.status(200).json({
        success: true,
        sent: notifications.length,
        to: email,
        message: 'Email sent successfully',
      })
    } else {
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        to: email,
      })
    }
  } catch (error) {
    console.error('Error sending test email:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

