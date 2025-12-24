import type { GetServerSideProps } from 'next'
import { createClient } from '@sanity/client'
import { Main } from '../../components/Layouts'
import { baseUrl, SEO } from '../../components/SEO'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { LinkShare } from '../../components/Links'
import Link from 'next/link'
import formatDate from '../../lib/formatDate'
import { getPostBySlug } from '../../lib/sanity'
import { extractHeaders, filterHeadersByDepth, calculateReadingTime } from '../../lib/portableTextUtils'
import type { PortableTextBlock } from '@portabletext/types'
import PreviewWithComments from '../../components/PreviewWithComments'

const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'ubrdxobo',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
  token: process.env.SANITY_API_TOKEN,
})

interface PreviewPageProps {
  post: any
  roomId: string
  sessionId: string
  token: string
  mode: 'private' | 'shared'
  userInfo: {
    name: string
    email: string
    isOwner: boolean
    recipientId: string
  }
  headers: any[]
  readingTime: number
}

export default function PreviewPage(props: PreviewPageProps) {
  const router = useRouter()
  const { post, roomId, sessionId, token, mode, userInfo, headers, readingTime } = props
  const { title, date, meta, tldr, content, layout } = post
  const slug = router.query.slug as string
  const relativeUrl = `/preview/${slug}`
  const url = `${baseUrl}${relativeUrl}`

  return (
    <>
      <SEO
        seo={{
          title: `${title} (Preview)` || 'Loading...',
          description: tldr,
          path: relativeUrl,
          image: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
        }}
      />
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row sm:mb-0 mb-4">
          <header>
            <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl sm:mb-0 mb-4">
              {title}
            </h1>
          </header>
          <LinkShare title={title} url={url}>
            Share
          </LinkShare>
        </div>

        <PreviewWithComments
          post={post}
          roomId={roomId}
          sessionId={sessionId}
          token={token}
          userInfo={userInfo}
          headers={headers}
          readingTime={readingTime}
          layout={layout}
          mode={mode}
        />
      </Main>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string }
  const { token, userName, userEmail, recipientId } = context.query as {
    token?: string
    userName?: string
    userEmail?: string
    recipientId?: string
  }

  if (!token) {
    return { notFound: true }
  }

  try {
    // Fetch review from Sanity
    const session = await sanityClient.fetch(
      `*[_type == "review" && token == $token && !revoked][0]{
        _id,
        liveblocksRoomId,
        mode,
        documentReference->{
          _id,
          _type,
          slug,
          title
        },
        createdBy,
        recipients,
        expiresAt
      }`,
      { token }
    )

    if (!session) {
      return { notFound: true }
    }

    // Check if session is expired
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return { notFound: true }
    }

    // Verify slug matches
    const docSlug = session.documentReference?.slug?.current || session.documentReference?.slug
    if (docSlug !== slug) {
      return { notFound: true }
    }

    // Fetch the draft document
    const post = await getPostBySlug(slug, true) // true = draft mode

    if (!post) {
      return { notFound: true }
    }

    const content = post.content as PortableTextBlock[]
    const layout = post.layout || 'default'

    // Extract headers from Portable Text
    let headers = extractHeaders(content)
    const maxDepth = post.depth || Infinity
    headers = filterHeadersByDepth(headers, maxDepth)

    // Calculate reading time
    const readingTime = calculateReadingTime(content)

    // Determine user info
    let userInfo = {
      name: (userName as string) || '',
      email: (userEmail as string) || '',
      isOwner: false,
      recipientId: (recipientId as string) || '',
    }

    // If recipientId is provided (shared mode), find the matching recipient
    if (recipientId && session.recipients) {
      const matchingRecipient = session.recipients.find(
        (r: any) => r.recipientId === recipientId
      )
      if (matchingRecipient) {
        userInfo.name = matchingRecipient.name
        userInfo.email = matchingRecipient.email
      }
    }

    // If no recipientId and no user info in URL, check if there's a single recipient to pre-fill
    if (!recipientId && !userName && !userEmail && session.recipients && session.recipients.length === 1) {
      userInfo.name = session.recipients[0].name
      userInfo.email = session.recipients[0].email
      userInfo.recipientId = session.recipients[0].recipientId || ''
    }

    // Check if user is owner
    if (userEmail) {
      userInfo.isOwner = session.createdBy.email.toLowerCase() === (userEmail as string).toLowerCase()
    } else if (userInfo.email) {
      userInfo.isOwner = session.createdBy.email.toLowerCase() === userInfo.email.toLowerCase()
    }

    return {
      props: {
        post: {
          title: post.title,
          date: post.date,
          author: post.author,
          tldr: post.tldr,
          meta: post.meta,
          category: post.category,
          layout,
          depth: post.depth || null,
          content,
        },
        roomId: session.liveblocksRoomId,
        sessionId: session._id,
        token,
        mode: session.mode,
        userInfo,
        headers,
        readingTime,
      },
    }
  } catch (error) {
    console.error('Error fetching preview:', error)
    return { notFound: true }
  }
}

