import { useEffect, useState } from 'react'
import { useClient } from 'sanity'

export function OpenReviewsBadge(props: any) {
  const { published, draft } = props
  const client = useClient({ apiVersion: '2023-05-03' })
  const [reviewCount, setReviewCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      // Get the document ID (could be draft or published)
      const docId = published?._id || draft?._id
      
      if (!docId) {
        setLoading(false)
        return
      }

      try {
        const now = new Date().toISOString()
        
        // First, let's see what reviews exist
        const allReviews = await client.fetch(
          `*[_type == "review" && references($docId)]{
            _id,
            revoked,
            expiresAt,
            isOwnerAccess,
            "docRef": documentReference._ref
          }`,
          { docId }
        )
        console.log('All reviews for', docId, ':', allReviews)
        
        // Now count active ones (excluding owner access tokens)
        const reviews = await client.fetch(
          `count(*[_type == "review" 
            && references($docId) 
            && !revoked 
            && expiresAt > $now
            && !isOwnerAccess])`,
          { docId, now }
        )
        console.log('Active reviews count:', reviews)
        setReviewCount(reviews)
      } catch (error) {
        console.error('Error fetching reviews:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchReviews()
  }, [published?._id, draft?._id, client])

  if (loading || reviewCount === 0 || reviewCount === null) {
    return null
  }

  return {
    label: `${reviewCount} open review${reviewCount !== 1 ? 's' : ''}`,
    color: 'primary' as const,
  }
}

