# Email Notifications Testing Guide

## Overview
The email notification system uses **Resend** to send batched notifications about comments and feedback on reviews. Notifications are queued and sent via a cron job that runs every 5 minutes.

---

## 📋 Prerequisites

### 1. **Resend Account & API Key**
- Sign up at [resend.com](https://resend.com)
- Get your API key from the dashboard
- Verify your domain (or use Resend's test domain)

### 2. **Environment Variables**
Add these to your `.env.local`:

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=previews@hem.so  # Or your verified domain

# Optional (for cron security)
CRON_SECRET=your-secret-here

# Already set
LIVEBLOCKS_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Or your production URL
```

### 3. **LiveBlocks Webhook Setup**
1. Go to [liveblocks.io/dashboard](https://liveblocks.io/dashboard)
2. Navigate to your project → Webhooks
3. Add a new webhook:
   - **URL**: `https://your-domain.com/api/webhooks/liveblocks` (needs to be publicly accessible)
   - **Events**: Check `commentCreated`, `threadResolved`
   - **Secret**: Copy to `LIVEBLOCKS_WEBHOOK_SECRET`

### 4. **Vercel Cron Setup** (Production only)
Add to `vercel.json` (should already exist):

```json
{
  "crons": [{
    "path": "/api/cron/send-notifications",
    "schedule": "*/5 * * * *"
  }]
}
```

---

## 🧪 Testing Steps

### **Test 1: Check Configuration**

Run the test setup endpoint:

```bash
curl http://localhost:3000/api/preview/test-setup
```

Look for:
- ✅ `Resend API Key: Configured`
- ✅ `LiveBlocks Webhook Secret: Set`
- ✅ `Sanity API Token: Present`

---

### **Test 2: Create a Review**

1. Open Sanity Studio: `http://localhost:3000/studio`
2. Go to a **Post** or **Place**
3. Click **Generate Preview Link**
4. Add recipients with **real email addresses** (ones you can check)
5. Click **Generate**
6. Copy the generated URLs

---

### **Test 3: Leave Comments**

1. **As Recipient**: Open the recipient URL
   - Enter name and email when prompted
   - Leave a comment on the preview
   
2. **As Owner**: Open your owner URL
   - Should auto-detect you as Hemanth
   - Reply to the comment

---

### **Test 4: Check Notification Queue**

Create a test endpoint to check the queue (temporary):

```bash
# Create: pages/api/test-notifications.ts
```

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'
import { getAllPendingRecipients, getNotifications } from '../../lib/notificationQueue'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const recipients = await getAllPendingRecipients()
  const queues = await Promise.all(
    recipients.map(async (email) => ({
      email,
      notifications: await getNotifications(email),
    }))
  )
  
  return res.status(200).json({ recipients, queues })
}
```

Then check:
```bash
curl http://localhost:3000/api/test-notifications
```

You should see queued notifications for the recipient/owner emails.

---

### **Test 5: Manual Trigger Email Send**

#### **Local Development** (no cron):

Create a test trigger endpoint:

```typescript
// pages/api/test-send-email.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { sendNotificationEmail } from '../../lib/email/sendNotification'
import { getNotifications } from '../../lib/notificationQueue'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email } = req.query
  
  if (!email) {
    return res.status(400).json({ error: 'Email required' })
  }
  
  const notifications = await getNotifications(email as string)
  
  if (notifications.length === 0) {
    return res.status(200).json({ message: 'No notifications to send' })
  }
  
  const success = await sendNotificationEmail(email as string, notifications)
  
  return res.status(200).json({
    success,
    sent: notifications.length,
    to: email,
  })
}
```

Trigger manually:
```bash
curl "http://localhost:3000/api/test-send-email?email=recipient@example.com"
```

#### **Production** (Vercel Cron):

The cron job runs automatically every 5 minutes. You can also trigger it manually:

```bash
curl -X POST https://your-domain.com/api/cron/send-notifications \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

---

### **Test 6: Verify Email Received**

Check your inbox for:

**Owner Email** (when recipient comments):
- Subject: "New comments on your draft"
- Shows comment content
- "View and Respond" button

**Recipient Email** (when owner replies):
- Subject: "Updates on your feedback"
- Shows reply content
- "View Updates" button

---

## 🔍 Debugging

### Check LiveBlocks Webhook Logs
1. Go to LiveBlocks dashboard → Webhooks
2. View delivery logs
3. Look for failed deliveries

### Check Server Logs

**Local:**
```bash
# Watch terminal where `npm run dev` is running
# Should see:
# "Liveblocks webhook event: commentCreated"
# "Notification queued for recipient@example.com"
```

**Vercel:**
```bash
vercel logs --follow
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Webhook not firing | Make sure URL is publicly accessible (use ngrok for local) |
| No emails sent | Check `RESEND_API_KEY` is set correctly |
| Email domain not verified | Use Resend test domain or verify your domain |
| Cron not running | Check `vercel.json` cron config |
| Queue empty | Verify webhook is being received |

---

## 📧 Email Flow Summary

```
1. User leaves comment → LiveBlocks
2. LiveBlocks fires webhook → /api/webhooks/liveblocks
3. Webhook adds notification to queue
4. Cron job runs every 5 minutes → /api/cron/send-notifications
5. Checks debounce (5 min since last notification)
6. If ready, sends batched email via Resend
7. Clears queue after successful send
```

---

## 🚀 Quick Local Test

For local testing without webhooks:

1. **Install ngrok**: `npm install -g ngrok`
2. **Expose local server**: `ngrok http 3000`
3. **Copy ngrok URL** (e.g., `https://abc123.ngrok.io`)
4. **Add webhook in LiveBlocks**:
   - URL: `https://abc123.ngrok.io/api/webhooks/liveblocks`
5. **Test comments** as described above
6. **Monitor logs** in terminal

---

## ✅ Success Checklist

- [ ] Resend API key configured
- [ ] Domain verified in Resend (or using test domain)
- [ ] LiveBlocks webhook set up and delivering
- [ ] Comments trigger webhook (check logs)
- [ ] Notifications queued (check test endpoint)
- [ ] Emails sent successfully (check inbox)
- [ ] Email links work and load preview correctly
- [ ] Cron job running on production (Vercel)

---

## 📝 Notes

- **Debounce**: Notifications are batched for 5 minutes to avoid spam
- **Force Send**: After 10 minutes, emails are sent regardless of debounce
- **Local Dev**: Uses mock KV store (in-memory), won't persist across restarts
- **Production**: Uses Vercel KV (Redis) for persistent queue
- **Rate Limits**: Resend free tier: 3,000 emails/month

---

Need help? Check:
- Resend Docs: https://resend.com/docs
- LiveBlocks Webhooks: https://liveblocks.io/docs/platform/webhooks
- Vercel Cron: https://vercel.com/docs/cron-jobs

