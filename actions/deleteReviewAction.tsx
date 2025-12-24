import { DocumentActionComponent, useDocumentOperation } from 'sanity'
import { TrashIcon } from '@sanity/icons'
import { useToast } from '@sanity/ui'
import { useState, useCallback } from 'react'

export const deleteReviewAction: DocumentActionComponent = (props) => {
  const { id, type, published, draft } = props
  const { delete: deleteOp } = useDocumentOperation(id, type)
  const toast = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this review?\n\n' +
      'This will:\n' +
      '- Delete the review document\n' +
      '- Delete the LiveBlocks room and all comments\n' +
      '- Cannot be undone\n\n' +
      'If you just want to disable access temporarily, use "Revoke" instead.'
    )

    if (!confirmed) {
      return
    }

    setIsDeleting(true)

    try {
      // Get the room ID from the document
      const doc = published || draft
      const liveblocksRoomId = doc?.liveblocksRoomId

      if (liveblocksRoomId) {
        toast.push({
          status: 'info',
          title: 'Deleting LiveBlocks room...',
        })

        // Delete the LiveBlocks room first
        const response = await fetch('/api/liveblocks-delete-room', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId: liveblocksRoomId }),
        })

        if (!response.ok) {
          console.error('Failed to delete LiveBlocks room:', await response.text())
          toast.push({
            status: 'warning',
            title: 'Failed to delete LiveBlocks room',
            description: 'The review will still be deleted, but the room may remain.',
          })
        } else {
          toast.push({
            status: 'success',
            title: 'LiveBlocks room deleted',
          })
        }
      }

      // Then delete the Sanity document
      deleteOp.execute()

      toast.push({
        status: 'success',
        title: 'Review deleted',
        description: 'The review and all associated data have been deleted.',
      })

      // Close the document pane
      props.onComplete()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.push({
        status: 'error',
        title: 'Error deleting review',
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsDeleting(false)
    }
  }, [deleteOp, published, draft, toast, props])

  return {
    label: 'Delete',
    icon: TrashIcon,
    tone: 'critical',
    disabled: isDeleting || Boolean(deleteOp.disabled),
    onHandle: handleDelete,
  }
}

