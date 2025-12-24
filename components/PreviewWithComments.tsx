import React, { useState, useEffect, useRef, useCallback } from 'react'
import { RoomProvider, useThreads, useCreateThread, useMarkThreadAsResolved } from '../liveblocks.config'
import { ClientSideSuspense } from '@liveblocks/react'
import { Composer, Thread, LiveblocksUiConfig } from '@liveblocks/react-ui'
import PortableText from './PortableText'
import formatDate from '../lib/formatDate'
import Link from 'next/link'

interface UserIdentificationModalProps {
  onSubmit: (name: string, email: string) => void
}

function UserIdentificationModal({ onSubmit }: UserIdentificationModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name && email) {
      onSubmit(name, email)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-800">
        <h2 className="mb-4 text-xl font-semibold">Identify Yourself</h2>
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Please enter your name and email to access this preview and leave comments.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-700"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  )
}

interface CommentsContentProps {
  post: any
  headers: any[]
  readingTime: number
  layout: string
  mode?: 'private' | 'shared'
  userInfo: {
    name: string
    email: string
    isOwner: boolean
    recipientId?: string
  }
}

function CommentsContent({ post, headers, readingTime, layout, mode, userInfo }: CommentsContentProps) {
  const { threads } = useThreads()
  const createThread = useCreateThread()
  const markAsResolved = useMarkThreadAsResolved()
  const [activeSection, setActiveSection] = useState('')
  const [selectionInfo, setSelectionInfo] = useState<{
    text: string
    range: Range
  } | null>(null)
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const composerOpenRef = useRef(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    const handleScroll = () => {
      let currentSection = ''
      headers.forEach((header) => {
        const slug = header.text
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
        const element = document.getElementById(slug)
        const scrollPosition = window.scrollY + 50

        if (element && element.offsetTop <= scrollPosition) {
          currentSection = slug
        }
      })

      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headers])

  // Track text selection and show inline composer near the highlighted text
  useEffect(() => {
    const handleMouseUp = () => {
      // Don't handle selection changes if composer is already open
      if (composerOpenRef.current) return
      
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        setSelectionInfo(null)
        return
      }
      const text = selection.toString().trim()
      if (!text) {
        setSelectionInfo(null)
        return
      }
      
      // Check if selection is within allowed areas (title, body, tldr, meta)
      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element
      
      // Check if the selection is within content area or sidebar metadata
      const isInContent = contentRef.current?.contains(element)
      const isInSidebar = element?.closest('.list-sticky') !== null
      const isInTitle = element?.closest('h1') !== null
      
      // Only allow comments in title, main content, or sidebar metadata (tldr/meta)
      if (!isInContent && !isInTitle) {
        if (isInSidebar) {
          // In sidebar, only allow tldr and meta, not TOC or Feedback
          const isInTldr = element?.closest('.sidebar')?.previousElementSibling?.textContent === 'Tl;dr'
          const isInMeta = element?.closest('.sidebar')?.previousElementSibling?.textContent === 'Meta'
          if (!isInTldr && !isInMeta) {
            setSelectionInfo(null)
            return
          }
        } else {
          setSelectionInfo(null)
          return
        }
      }
      
      setSelectionInfo({ text, range: range.cloneRange() })
      composerOpenRef.current = true
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [])

  // Force re-render on scroll to update popup positions
  const [, setScrollTrigger] = useState(0)
  useEffect(() => {
    const handleScroll = () => {
      setScrollTrigger(prev => prev + 1)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track dark mode (matches Tailwind's media query strategy)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => setIsDark(mediaQuery.matches)

    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [])

  // Helper: unwrap previously added inline marks
  const clearInlineMarks = useCallback(() => {
    const root = contentRef.current
    if (!root) return
    const marks = root.querySelectorAll('[data-lb-inline-thread]')
    marks.forEach((mark) => {
      const parent = mark.parentNode
      while (mark.firstChild) {
        parent?.insertBefore(mark.firstChild, mark)
      }
      parent?.removeChild(mark)
    })
  }, [])

  // Helper: find first matching text range for a snippet
  const findRangeForText = useCallback((root: HTMLElement, text: string): Range | null => {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const lower = text.toLowerCase()
    let node: Node | null = walker.nextNode()
    while (node) {
      const content = node.textContent || ''
      const idx = content.toLowerCase().indexOf(lower)
      if (idx !== -1) {
        const range = document.createRange()
        range.setStart(node, idx)
        range.setEnd(node, idx + text.length)
        return range
      }
      node = walker.nextNode()
    }
    return null
  }, [])

  // Render inline highlights for threads that have stored selection text in metadata
  useEffect(() => {
    const root = contentRef.current
    if (!root) return
    clearInlineMarks()

    threads?.forEach((thread) => {
      const text = (thread.metadata as any)?.text
      if (!text || typeof text !== 'string') return
      const range = findRangeForText(root, text)
      if (!range) return

      const wrapper = document.createElement('span')
      wrapper.dataset.lbInlineThread = thread.id
      wrapper.className =
        'rounded-[3px] px-1 cursor-pointer transition-colors bg-neutral-200 text-inherit shadow-[0_0_0_1px_rgba(0,0,0,0.12)] hover:bg-neutral-300 dark:bg-neutral-600/70 dark:text-neutral-50 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] dark:hover:bg-neutral-500/80'
      wrapper.onclick = (event) => {
        event.stopPropagation()
        setActiveThreadId(thread.id)
      }

      try {
        range.surroundContents(wrapper)
      } catch (e) {
        // If range cannot be surrounded (e.g., splits multiple nodes), skip gracefully
      }
    })

    return () => clearInlineMarks()
  }, [threads, clearInlineMarks, findRangeForText])

  const activeThread = threads?.find((t) => t.id === activeThreadId) || null
  
  // Get position for active thread popup (using viewport coordinates for fixed positioning)
  const getThreadPosition = () => {
    if (!activeThreadId || !contentRef.current) return null
    
    const wrapper = contentRef.current.querySelector(`[data-lb-inline-thread="${activeThreadId}"]`)
    if (!wrapper) return null
    
    const rect = wrapper.getBoundingClientRect()
    const containerRect = contentRef.current.getBoundingClientRect()
    
    const popupWidth = 380
    const gap = 20
    
    // Try to position on the left
    let left = containerRect.left - popupWidth - gap
    
    // If not enough space on left, position on right
    if (left < gap) {
      left = containerRect.right + gap
    }
    
    // If still not enough space on right, position inline
    if (left + popupWidth > window.innerWidth - gap) {
      left = Math.max(gap, Math.min(window.innerWidth - popupWidth - gap, rect.left))
    }
    
    // For fixed positioning, use viewport coordinates (rect.top) not document coordinates
    return {
      top: rect.top,
      left,
    }
  }
  
  const threadPopoverPos = getThreadPosition()
  
  // Close thread when resolved
  useEffect(() => {
    if (activeThread?.resolved) {
      setActiveThreadId(null)
    }
  }, [activeThread?.resolved])

  // Get position for selection composer (using viewport coordinates for fixed positioning)
  const getComposerPosition = () => {
    if (!selectionInfo || !contentRef.current) return null
    
    const rect = selectionInfo.range.getBoundingClientRect()
    const containerRect = contentRef.current.getBoundingClientRect()
    
    const popupWidth = 340
    const gap = 20
    
    // Try to position on the left
    let left = containerRect.left - popupWidth - gap
    
    // If not enough space on left, position on right
    if (left < gap) {
      left = containerRect.right + gap
    }
    
    // If still not enough space on right, position inline
    if (left + popupWidth > window.innerWidth - gap) {
      left = Math.max(gap, Math.min(window.innerWidth - popupWidth - gap, rect.left))
    }
    
    // For fixed positioning, use viewport coordinates (rect.top) not document coordinates
    return {
      top: rect.top,
      left,
    }
  }
  
  const composerPos = getComposerPosition()

  return (
    <>
      {/* Inline selection composer */}
      {selectionInfo && composerPos && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                e.preventDefault()
                e.stopPropagation()
                // Clear selection to prevent re-opening
                window.getSelection()?.removeAllRanges()
                setSelectionInfo(null)
                composerOpenRef.current = false
              }
            }}
            aria-label="Close composer"
          />
          <div
            className={`fixed z-50 w-[340px] rounded-lg border shadow-2xl overflow-hidden ${
              isDark 
                ? 'dark border-neutral-700 bg-neutral-900' 
                : 'border-neutral-200 bg-white'
            }`}
            style={{
              top: composerPos.top,
              left: composerPos.left,
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <LiveblocksUiConfig portalContainer={typeof document !== 'undefined' ? document.body : undefined}>
              <div className={isDark ? 'dark' : ''}>
                <p className="mb-2 px-3 pt-3 text-xs text-neutral-600 dark:text-neutral-300">
                  Comment on: <span className="font-medium text-neutral-900 dark:text-white truncate block">&ldquo;{selectionInfo.text}&rdquo;</span>
                </p>
                <Composer
                  metadata={{ text: selectionInfo.text }}
                  onComposerSubmit={() => {
                    window.getSelection()?.removeAllRanges()
                    setSelectionInfo(null)
                    composerOpenRef.current = false
                  }}
                  showAttachments={false}
                  showFormattingControls={false}
                  autoFocus={false}
                />
              </div>
            </LiveblocksUiConfig>
          </div>
        </>
      )}

      {/* Floating thread when clicking a highlight */}
      {activeThread && threadPopoverPos && !activeThread.resolved && (
        <>
          {/* Backdrop to close on click outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveThreadId(null)}
            aria-label="Close thread"
          />
          <div
            className={`fixed z-50 w-[380px] rounded-lg border p-3 shadow-2xl ${
              isDark 
                ? 'dark border-neutral-700 bg-neutral-900' 
                : 'border-neutral-200 bg-white'
            }`}
            style={{ top: threadPopoverPos.top, left: threadPopoverPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <LiveblocksUiConfig portalContainer={typeof document !== 'undefined' ? document.body : undefined}>
              <div className={isDark ? 'dark' : ''}>
                <div className="flex items-start justify-between gap-2 pb-2">
                  <h4 className="text-sm font-semibold text-neutral-900 dark:text-white">Thread</h4>
                  <button
                    className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-white"
                    onClick={() => setActiveThreadId(null)}
                  >
                    Close
                  </button>
                </div>
                <Thread thread={activeThread} showComposer showActions={false} />
              </div>
            </LiveblocksUiConfig>
          </div>
        </>
      )}

      <dl className="list-container">
        <dd
          className={`${
            layout === 'wide' ? 'list-content-wide' : 'list-content'
          } sm:order-1 order-2`}
        >
          <div className="prose-custom">
            <p className="text-neutral-700">{readingTime} minute(s)</p>
            
            {mode && (
              <div className="mb-6 mt-4 rounded-lg border border-yellow-500 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>This is a preview.{' '}
                  {mode === 'shared' ? 'Comments are visible to all reviewers.' : 'Comments are private.'}</strong>
                </p>
              </div>
            )}
            
            <div ref={contentRef}>
              <PortableText content={post.content} />
            </div>
            
            <div className="prose-custom">
              <hr className="pb-0" />
              <Link href="/posts" className="text-neutral-700 sm:pb-6 sm:align-left cursor-pointer">← All posts</Link>
            </div>
          </div>
        </dd>

        {layout !== 'wide' && (
          <dt className="list-title sm:order-2 order-1">
            <div className="list-sticky">
            {/* Table of Contents */}
            <div className="mb-8">
              <h3 className="pb-1">Table of Contents</h3>
              <ul className="sidebar toc w-full">
                {headers.map((header, index) => {
                  const slug = header.text
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^\w\-]+/g, '')
                  return (
                    <li
                      key={index}
                      className={`leading-6 truncate ${
                        activeSection === slug ? 'text-white' : ''
                      }`}
                      style={{ marginLeft: `${header.depth * 1 - 1}rem` }}
                    >
                      <a href={`#${slug}`}>{header.text}</a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Metadata */}
            <div>
              <h3>Date</h3>
              <p>
                <time className="time" dateTime={post.date}>
                  <span className="sr-only">{post.date}</span>
                  {formatDate(post.date, false)}
                </time>
              </p>
              <h3>Tl;dr</h3>
              <p className="sidebar">{post.tldr}</p>
              {post.meta && (
                <>
                  <h3>Meta</h3>
                  <p className="sidebar">{post.meta}</p>
                </>
              )}
              
              {/* Feedback */}
              <h3>Feedback</h3>
              <p className="sidebar">
                {threads?.length || 0} comment thread(s)
              </p>
            </div>
          </div>
        </dt>
      )}
    </dl>
    </>
  )
}

interface PreviewWithCommentsProps {
  post: any
  roomId: string
  sessionId: string
  token: string
  userInfo: {
    name: string
    email: string
    isOwner: boolean
    recipientId?: string
  }
  headers: any[]
  readingTime: number
  layout: string
  mode?: 'private' | 'shared'
}

export default function PreviewWithComments({
  post,
  roomId,
  sessionId,
  token,
  userInfo: initialUserInfo,
  headers,
  readingTime,
  layout,
  mode,
}: PreviewWithCommentsProps) {
  // Check if this might be the owner based on env vars
  const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME
  const ownerEmail = process.env.NEXT_PUBLIC_OWNER_EMAIL
  
  // Pre-fill with owner info if not already provided and owner env vars exist
  const defaultUserInfo = (!initialUserInfo.name && ownerName && ownerEmail) 
    ? { name: ownerName, email: ownerEmail, isOwner: true }
    : initialUserInfo

  const [userInfo, setUserInfo] = useState(defaultUserInfo)
  const [showModal, setShowModal] = useState(!defaultUserInfo.name || !defaultUserInfo.email)
  const [isReady, setIsReady] = useState(false)
  
  // Store session info synchronously on mount
  useEffect(() => {
    if (userInfo.name && userInfo.email) {
      sessionStorage.setItem('preview_userName', userInfo.name)
      sessionStorage.setItem('preview_userEmail', userInfo.email)
      sessionStorage.setItem('preview_sessionId', sessionId)
      if (userInfo.recipientId) {
        sessionStorage.setItem('preview_recipientId', userInfo.recipientId)
      }
      setIsReady(true)
    }
  }, [userInfo.name, userInfo.email, sessionId, userInfo.recipientId])

  useEffect(() => {
    // If user info is not provided, show modal
    if (!userInfo.name || !userInfo.email) {
      setShowModal(true)
    }
  }, [userInfo])

  const handleUserSubmit = (name: string, email: string) => {
    const updatedUserInfo = {
      name,
      email,
      isOwner: initialUserInfo.isOwner,
      recipientId: initialUserInfo.recipientId,
    }
    setUserInfo(updatedUserInfo)
    setShowModal(false)

    // Store in session storage for Liveblocks auth
    sessionStorage.setItem('preview_userName', name)
    sessionStorage.setItem('preview_userEmail', email)
    sessionStorage.setItem('preview_sessionId', sessionId)
    if (initialUserInfo.recipientId) {
      sessionStorage.setItem('preview_recipientId', initialUserInfo.recipientId)
    }
    setIsReady(true)

    // Update URL with user info
    const url = new URL(window.location.href)
    url.searchParams.set('userName', name)
    url.searchParams.set('userEmail', email)
    window.history.replaceState({}, '', url.toString())
  }

  if (showModal) {
    return <UserIdentificationModal onSubmit={handleUserSubmit} />
  }

  // Don't render RoomProvider until session storage is set
  if (!isReady) {
    return <div>Loading...</div>
  }

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{}}
      initialStorage={{}}
    >
      <ClientSideSuspense fallback={<div>Loading comments...</div>}>
        {() => <CommentsContent post={post} headers={headers} readingTime={readingTime} layout={layout} mode={mode} userInfo={userInfo} />}
      </ClientSideSuspense>
    </RoomProvider>
  )
}

