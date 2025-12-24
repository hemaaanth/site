import { Resend } from 'resend'
import type { Notification } from '../notificationQueue'

const resend = new Resend(process.env.RESEND_API_KEY)

interface GroupedNotifications {
  [sessionId: string]: {
    documentTitle: string
    documentSlug: string
    notifications: Notification[]
  }
}

/**
 * Group notifications by session/document
 */
function groupNotifications(notifications: Notification[]): GroupedNotifications {
  return notifications.reduce((acc, notification) => {
    if (!acc[notification.sessionId]) {
      acc[notification.sessionId] = {
        documentTitle: notification.documentTitle,
        documentSlug: notification.documentSlug,
        notifications: [],
      }
    }
    acc[notification.sessionId].notifications.push(notification)
    return acc
  }, {} as GroupedNotifications)
}

/**
 * Generate HTML for owner notification email (when recipients comment)
 */
function generateOwnerEmailHTML(
  recipientEmail: string,
  grouped: GroupedNotifications
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hem.so'
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .document { margin-bottom: 30px; border-left: 4px solid #3b82f6; padding-left: 16px; }
    .document-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
    .comment { background-color: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; }
    .comment-author { font-weight: 600; color: #3b82f6; }
    .comment-content { margin-top: 4px; color: #666; }
    .cta { display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">New Comments on Your Drafts</h1>
    <p style="margin: 8px 0 0 0; color: #6b7280;">You have received feedback from your reviewers.</p>
  </div>
  `

  Object.entries(grouped).forEach(([sessionId, data]) => {
    const comments = data.notifications.filter((n) => n.type === 'comment')
    
    if (comments.length > 0) {
      html += `
  <div class="document">
    <div class="document-title">${data.documentTitle}</div>
    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 12px 0;">${comments.length} new comment(s)</p>
      `
      
      comments.forEach((comment) => {
        html += `
    <div class="comment">
      <div class="comment-author">${comment.from}</div>
      <div class="comment-content">${comment.content || 'Left a comment'}</div>
    </div>
        `
      })
      
      // Generate preview URL with token from first notification
      const token = sessionId // This needs to be fetched from session
      html += `
    <a href="${baseUrl}/preview/${data.documentSlug}?token=${token}" class="cta">View and Respond</a>
  </div>
      `
    }
  })

  html += `
  <div class="footer">
    <p>You're receiving this email because reviewers left comments on your draft content.</p>
    <p>This is an automated notification from your preview system.</p>
  </div>
</body>
</html>
  `

  return html
}

/**
 * Generate HTML for reviewer notification email (when owner responds/resolves)
 */
function generateReviewerEmailHTML(
  recipientEmail: string,
  grouped: GroupedNotifications
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hem.so'
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .document { margin-bottom: 30px; border-left: 4px solid #10b981; padding-left: 16px; }
    .document-title { font-size: 18px; font-weight: 600; margin-bottom: 10px; }
    .activity { background-color: #f8f9fa; padding: 12px; margin: 8px 0; border-radius: 6px; }
    .activity-type { font-weight: 600; color: #10b981; }
    .activity-content { margin-top: 4px; color: #666; }
    .cta { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1 style="margin: 0; font-size: 24px;">Updates on Your Feedback</h1>
    <p style="margin: 8px 0 0 0; color: #6b7280;">The author has responded to your comments.</p>
  </div>
  `

  Object.entries(grouped).forEach(([sessionId, data]) => {
    const activities = data.notifications
    
    html += `
  <div class="document">
    <div class="document-title">${data.documentTitle}</div>
    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 12px 0;">${activities.length} update(s)</p>
    `
    
    activities.forEach((activity) => {
      if (activity.type === 'comment') {
        html += `
    <div class="activity">
      <div class="activity-type">${activity.from} replied</div>
      <div class="activity-content">${activity.content || 'Left a response'}</div>
    </div>
        `
      } else if (activity.type === 'resolve') {
        html += `
    <div class="activity">
      <div class="activity-type">${activity.from} resolved a thread</div>
      <div class="activity-content">Your feedback has been addressed</div>
    </div>
        `
      }
    })
    
    const token = sessionId
    html += `
    <a href="${baseUrl}/preview/${data.documentSlug}?token=${token}" class="cta">View Updates</a>
  </div>
    `
  })

  html += `
  <div class="footer">
    <p>You're receiving this email because the author responded to your feedback.</p>
    <p>This is an automated notification from the preview system.</p>
  </div>
</body>
</html>
  `

  return html
}

/**
 * Determine if notifications are for owner or reviewer
 */
function isOwnerNotification(notifications: Notification[]): boolean {
  // If all notifications are comments from reviewers, it's for the owner
  return notifications.every((n) => n.type === 'comment')
}

/**
 * Send batched notifications via email
 */
export async function sendNotificationEmail(
  recipientEmail: string,
  notifications: Notification[]
): Promise<boolean> {
  if (notifications.length === 0) {
    return false
  }

  try {
    const grouped = groupNotifications(notifications)
    const isOwner = isOwnerNotification(notifications)
    
    const subject = isOwner
      ? `New comments on your draft${Object.keys(grouped).length > 1 ? 's' : ''}`
      : `Updates on your feedback`

    const html = isOwner
      ? generateOwnerEmailHTML(recipientEmail, grouped)
      : generateReviewerEmailHTML(recipientEmail, grouped)

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'previews@hem.so',
      to: recipientEmail,
      subject,
      html,
    })

    console.log(`Email sent to ${recipientEmail}:`, result)
    return true
  } catch (error) {
    console.error(`Error sending email to ${recipientEmail}:`, error)
    return false
  }
}

