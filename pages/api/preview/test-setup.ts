import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@sanity/client'
import { kv } from '@vercel/kv'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN,
})

interface SetupCheck {
  name: string
  status: 'ok' | 'warning' | 'error'
  message: string
  details?: any
}

/**
 * Test endpoint to validate preview system setup
 * Access: GET /api/preview/test-setup
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const checks: SetupCheck[] = []

  // 1. Check Sanity Connection
  try {
    const testQuery = await sanityClient.fetch(
      `*[_type == "review"][0...1]{_id}`
    )
    checks.push({
      name: 'Sanity Connection',
      status: 'ok',
      message: 'Successfully connected to Sanity',
      details: { hasReviews: testQuery.length > 0 },
    })
  } catch (error) {
    checks.push({
      name: 'Sanity Connection',
      status: 'error',
      message: 'Failed to connect to Sanity',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // 2. Check Liveblocks Secret Key
  if (process.env.LIVEBLOCKS_SECRET_KEY) {
    checks.push({
      name: 'Liveblocks Secret Key',
      status: 'ok',
      message: 'Liveblocks secret key is configured',
    })
  } else {
    checks.push({
      name: 'Liveblocks Secret Key',
      status: 'error',
      message: 'LIVEBLOCKS_SECRET_KEY environment variable is missing',
    })
  }

  // 3. Check Liveblocks Webhook Secret
  if (process.env.LIVEBLOCKS_WEBHOOK_SECRET) {
    checks.push({
      name: 'Liveblocks Webhook Secret',
      status: 'ok',
      message: 'Liveblocks webhook secret is configured',
    })
  } else {
    checks.push({
      name: 'Liveblocks Webhook Secret',
      status: 'warning',
      message: 'LIVEBLOCKS_WEBHOOK_SECRET environment variable is missing',
    })
  }

  // 4. Check Resend API Key
  if (process.env.RESEND_API_KEY) {
    checks.push({
      name: 'Resend API Key',
      status: 'ok',
      message: 'Resend API key is configured',
    })
  } else {
    checks.push({
      name: 'Resend API Key',
      status: 'error',
      message: 'RESEND_API_KEY environment variable is missing',
    })
  }

  // 5. Check Vercel KV Connection
  try {
    await kv.set('test-key', 'test-value', { ex: 10 })
    const value = await kv.get('test-key')
    await kv.del('test-key')
    
    // Check if this is mock or real KV
    const isMock = process.env.NODE_ENV === 'development' && !process.env.KV_URL
    
    checks.push({
      name: 'Vercel KV (Redis)',
      status: 'ok',
      message: isMock 
        ? 'Using mock KV for local development (notifications will work but won\'t persist)'
        : 'Successfully connected to Vercel KV',
      details: { testPassed: value === 'test-value', usingMock: isMock },
    })
  } catch (error) {
    checks.push({
      name: 'Vercel KV (Redis)',
      status: 'warning',
      message: 'KV connection failed, using in-memory mock (OK for local testing)',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  // 6. Check Cron Secret
  if (process.env.CRON_SECRET) {
    checks.push({
      name: 'Cron Secret',
      status: 'ok',
      message: 'Cron secret is configured',
    })
  } else {
    checks.push({
      name: 'Cron Secret',
      status: 'warning',
      message: 'CRON_SECRET environment variable is missing',
    })
  }

  // 7. Check Base URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    checks.push({
      name: 'Base URL',
      status: 'ok',
      message: 'Base URL is configured',
      details: { url: process.env.NEXT_PUBLIC_BASE_URL },
    })
  } else {
    checks.push({
      name: 'Base URL',
      status: 'warning',
      message: 'NEXT_PUBLIC_BASE_URL not set, using default',
    })
  }

  // Calculate overall status
  const hasErrors = checks.some((c) => c.status === 'error')
  const hasWarnings = checks.some((c) => c.status === 'warning')

  const overallStatus = hasErrors ? 'error' : hasWarnings ? 'warning' : 'ok'

  return res.status(200).json({
    overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    summary: {
      total: checks.length,
      ok: checks.filter((c) => c.status === 'ok').length,
      warnings: checks.filter((c) => c.status === 'warning').length,
      errors: checks.filter((c) => c.status === 'error').length,
    },
    nextSteps:
      overallStatus === 'ok'
        ? ['All systems operational! You can start generating preview links.']
        : overallStatus === 'warning'
        ? [
            'Some optional features are not configured.',
            'The system will work but with reduced functionality.',
          ]
        : [
            'Critical configuration missing.',
            'Please check the errors above and configure required environment variables.',
            'See PREVIEW_SYSTEM_SETUP.md for detailed instructions.',
          ],
  })
}

