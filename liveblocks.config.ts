import { createClient } from '@liveblocks/client'
import { createRoomContext } from '@liveblocks/react'

// Define user metadata type
declare global {
  interface Liveblocks {
    // User info set when authenticating
    UserMeta: {
      id: string
      info: {
        name: string
        email: string
        isOwner: boolean
        avatar?: string
      }
    }
    // Return type for resolveUsers
    User: {
      name: string
      avatar?: string
    }
  }
}

// Create Liveblocks client with custom auth endpoint
const client = createClient({
  authEndpoint: async (room) => {
    // Get user info from URL or session storage
    const params = new URLSearchParams(window.location.search)
    const userName = params.get('userName') || sessionStorage.getItem('preview_userName') || ''
    const userEmail = params.get('userEmail') || sessionStorage.getItem('preview_userEmail') || ''
    const sessionId = sessionStorage.getItem('preview_sessionId') || ''
    const recipientId = params.get('recipientId') || sessionStorage.getItem('preview_recipientId') || ''
    
    const response = await fetch('/api/liveblocks-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room,
        sessionId,
        userEmail,
        userName,
        recipientId,
      }),
    })
    
    if (!response.ok) {
      throw new Error(`Auth failed: ${response.statusText}`)
    }
    
    return response.json()
  },
  resolveUsers: async ({ userIds }) => {
    // Resolve user information for display in comments
    // Fetch user info from our API
    const response = await fetch('/api/liveblocks-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    })
    
    if (!response.ok) {
      console.error('Failed to resolve users')
      return []
    }
    
    const users = await response.json()
    return users
  },
  resolveMentionSuggestions: undefined, // Disable mentions
})

// Export hooks and components from Liveblocks
export const {
  RoomProvider,
  useRoom,
  useMyPresence,
  useUpdateMyPresence,
  useSelf,
  useOthers,
  useOthersMapped,
  useOthersConnectionIds,
  useOther,
  useBroadcastEvent,
  useEventListener,
  useErrorListener,
  useStatus,
  useLostConnectionListener,
  useThreads,
  useUser,
  useCreateThread,
  useEditThreadMetadata,
  useCreateComment,
  useEditComment,
  useDeleteComment,
  useAddReaction,
  useRemoveReaction,
  useThreadSubscription,
  useMarkThreadAsRead,
  useMarkThreadAsResolved,
  useMarkThreadAsUnresolved,
} = createRoomContext(client)

