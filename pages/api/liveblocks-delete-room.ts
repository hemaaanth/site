import type { NextApiRequest, NextApiResponse } from 'next'
import { Liveblocks } from '@liveblocks/node'

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
})

/**
 * Delete a LiveBlocks room
 * Called when a review is permanently deleted
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { roomId } = req.body

    if (!roomId) {
      return res.status(400).json({ error: 'Room ID is required' })
    }

    // Check if LiveBlocks secret key is configured
    if (!process.env.LIVEBLOCKS_SECRET_KEY) {
      console.error('LIVEBLOCKS_SECRET_KEY is not set')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    console.log('Deleting LiveBlocks room:', roomId)

    // Delete the room
    // Note: This will permanently delete all comments and data in the room
    await fetch(`https://api.liveblocks.io/v2/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.LIVEBLOCKS_SECRET_KEY}`,
      },
    })

    console.log('LiveBlocks room deleted successfully:', roomId)

    return res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      roomId,
    })
  } catch (error) {
    console.error('Error deleting LiveBlocks room:', error)
    return res.status(500).json({
      error: 'Failed to delete room',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

