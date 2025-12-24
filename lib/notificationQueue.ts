// Try to import Vercel KV, fall back to mock for local dev
let kv: any

try {
  const vercelKV = require('@vercel/kv')
  kv = vercelKV.kv
} catch (e) {
  console.warn('Vercel KV not available, using mock implementation for local dev')
  // Mock KV for local development without Redis
  const mockStore = new Map<string, any>()
  kv = {
    lpush: async (key: string, ...values: any[]) => {
      const current = mockStore.get(key) || []
      mockStore.set(key, [...values, ...current])
      return values.length
    },
    lrange: async (key: string, start: number, stop: number) => {
      const list = mockStore.get(key) || []
      if (stop === -1) return list
      return list.slice(start, stop + 1)
    },
    del: async (...keys: string[]) => {
      let count = 0
      keys.forEach(key => {
        if (mockStore.has(key)) {
          mockStore.delete(key)
          count++
        }
      })
      return count
    },
    expire: async (key: string, seconds: number) => {
      // Mock doesn't actually expire, but that's ok for local testing
      return 1
    },
    set: async (key: string, value: any, options?: any) => {
      mockStore.set(key, value)
      return 'OK'
    },
    get: async (key: string) => {
      return mockStore.get(key)
    },
    exists: async (...keys: string[]) => {
      return keys.filter(key => mockStore.has(key)).length
    },
    keys: async (pattern: string) => {
      const regex = new RegExp(pattern.replace('*', '.*'))
      return Array.from(mockStore.keys()).filter(key => regex.test(key))
    },
  }
}

export interface Notification {
  type: 'comment' | 'resolve'
  sessionId: string
  documentTitle: string
  documentSlug: string
  from: string
  content?: string
  threadId: string
  timestamp: string
}

const QUEUE_PREFIX = 'notifications:'
const DEBOUNCE_KEY_PREFIX = 'debounce:'
const DEBOUNCE_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Add a notification to the queue for a specific recipient
 */
export async function addNotification(
  recipientEmail: string,
  notification: Notification
): Promise<void> {
  const queueKey = `${QUEUE_PREFIX}${recipientEmail}`
  const debounceKey = `${DEBOUNCE_KEY_PREFIX}${recipientEmail}`

  try {
    // Add notification to the list
    await kv.lpush(queueKey, JSON.stringify(notification))

    // Set expiration on the queue (7 days max)
    await kv.expire(queueKey, 7 * 24 * 60 * 60)

    // Set/reset debounce timer
    // This creates a key that expires in 5 minutes
    // When it expires, the cron job will send notifications
    await kv.set(debounceKey, Date.now(), {
      ex: Math.floor(DEBOUNCE_WINDOW_MS / 1000),
      nx: true, // Only set if doesn't exist
    })

    console.log(`Notification queued for ${recipientEmail}`)
  } catch (error) {
    console.error('Error adding notification to queue:', error)
    throw error
  }
}

/**
 * Get all pending notifications for a recipient
 */
export async function getNotifications(
  recipientEmail: string
): Promise<Notification[]> {
  const queueKey = `${QUEUE_PREFIX}${recipientEmail}`

  try {
    const notifications = await kv.lrange(queueKey, 0, -1)
    return notifications.map((n: string) => JSON.parse(n))
  } catch (error) {
    console.error('Error getting notifications:', error)
    return []
  }
}

/**
 * Clear all notifications for a recipient after sending
 */
export async function clearNotifications(recipientEmail: string): Promise<void> {
  const queueKey = `${QUEUE_PREFIX}${recipientEmail}`
  const debounceKey = `${DEBOUNCE_KEY_PREFIX}${recipientEmail}`

  try {
    await kv.del(queueKey)
    await kv.del(debounceKey)
    console.log(`Notifications cleared for ${recipientEmail}`)
  } catch (error) {
    console.error('Error clearing notifications:', error)
    throw error
  }
}

/**
 * Get all recipients who have pending notifications
 * This scans for all queue keys
 */
export async function getAllPendingRecipients(): Promise<string[]> {
  try {
    // Get all keys matching the notification queue pattern
    const keys = await kv.keys(`${QUEUE_PREFIX}*`)
    
    // Extract email addresses from keys
    const recipients = keys
      .map((key: string) => key.replace(QUEUE_PREFIX, ''))
      .filter((email: string) => email.length > 0)

    return recipients
  } catch (error) {
    console.error('Error getting pending recipients:', error)
    return []
  }
}

/**
 * Check if debounce window is still active for a recipient
 */
export async function isDebounceActive(recipientEmail: string): Promise<boolean> {
  const debounceKey = `${DEBOUNCE_KEY_PREFIX}${recipientEmail}`

  try {
    const exists = await kv.exists(debounceKey)
    return exists === 1
  } catch (error) {
    console.error('Error checking debounce:', error)
    return false
  }
}

/**
 * Get the oldest notification timestamp for a recipient
 * Used to determine if we should send despite debounce
 */
export async function getOldestNotificationAge(
  recipientEmail: string
): Promise<number | null> {
  try {
    const notifications = await getNotifications(recipientEmail)
    
    if (notifications.length === 0) {
      return null
    }

    // Get the oldest notification (last in the list)
    const oldest = notifications[notifications.length - 1]
    const oldestTime = new Date(oldest.timestamp).getTime()
    const age = Date.now() - oldestTime

    return age
  } catch (error) {
    console.error('Error getting oldest notification age:', error)
    return null
  }
}
