import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { LinkShare } from '../Links'
import { Main } from '../Layouts'
import { baseUrl } from '../SEO'
import formatDate from '../../lib/formatDate'

export interface PostHeader {
  text: string
  depth: number
}

interface PostShellProps {
  title: string
  date: string
  /** Relative path, used for the share URL. */
  path: string
  tldr?: string
  meta?: string
  headers: PostHeader[]
  readingTime?: number
  /** Replaces the "N minute(s)" line on narrow screens when set. */
  metadataLabel?: string
  backHref?: string
  backLabel?: string
  /**
   * Drop the right rail (date, tl;dr, meta). The date then stays in the
   * content column at every width, and the layout gets the `post-layout--solo`
   * hook so wide elements can sit centred instead of hanging right.
   */
  sidebarRight?: boolean
  children: React.ReactNode
}

export const headerSlug = (text: string) =>
  text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')

/**
 * The three-column post layout: title + share, scroll-spied table of contents
 * on the left, content in the middle, tl;dr and meta on the right. Extracted
 * from pages/posts/[slug].tsx so non-CMS pages can wear the same shell.
 */
export function PostShell({
  title,
  date,
  path,
  tldr,
  meta,
  headers,
  readingTime,
  metadataLabel,
  backHref = '/posts',
  backLabel = '← All posts',
  sidebarRight = true,
  children,
}: PostShellProps) {
  const url = `${baseUrl}${path}`
  const [activeSection, setActiveSection] = useState('')

  useEffect(() => {
    const handleScroll = () => {
      let currentSection = ''
      const scrollPosition = window.scrollY + 50

      headers.forEach((header) => {
        const element = document.getElementById(headerSlug(header.text))
        if (element && element.offsetTop <= scrollPosition) currentSection = headerSlug(header.text)
      })

      // Activate the last header when it's visible AND near page bottom.
      if (headers.length > 0) {
        const lastSlug = headerSlug(headers[headers.length - 1].text)
        const lastElement = document.getElementById(lastSlug)
        if (lastElement) {
          const lastHeaderTop = lastElement.offsetTop
          const viewportTop = window.scrollY
          const viewportBottom = window.scrollY + window.innerHeight
          const scrollRoomLeft = document.documentElement.scrollHeight - viewportBottom
          const lastHeaderVisible = lastHeaderTop >= viewportTop && lastHeaderTop <= viewportBottom
          if (lastHeaderVisible && scrollRoomLeft < 300) currentSection = lastSlug
        }
      }

      setActiveSection(currentSection)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headers])

  return (
    <Main>
      <div className="flex w-full flex-col justify-between sm:flex-row sm:mb-0 mb-4">
        <header>
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl sm:mb-0 mb-4">
            {title}
          </h1>
        </header>
        <div className="flex gap-2">
          <LinkShare title={title} url={url}>
            Share
          </LinkShare>
        </div>
      </div>
      <div className={`post-layout${sidebarRight ? '' : ' post-layout--solo'}`}>
        <aside className="post-sidebar-left">
          <h3 className="pb-1">Table of Contents</h3>
          <ul className="sidebar toc w-full">
            {headers.map((header, index) => {
              const slug = headerSlug(header.text)
              return (
                <li
                  key={index}
                  className={`toc-item leading-6 truncate ${activeSection === slug ? 'toc-active' : ''}`}
                  style={{ marginLeft: `${header.depth - 1}rem` }}
                >
                  <a href={`#${slug}`}>{header.text}</a>
                </li>
              )
            })}
          </ul>
          <div className="mt-6">
            <Link
              href={backHref}
              className="text-neutral-500 dark:text-silver-dark hover:text-neutral-800 dark:hover:text-silver transition-colors text-sm"
            >
              {backLabel}
            </Link>
          </div>
        </aside>

        <div className="post-content">
          <div className="post-metadata">
            {(metadataLabel ?? readingTime) != null && metadataLabel !== '' && <span className="time">{metadataLabel ?? `${readingTime} minute(s)`}</span>}
            <time className="time" dateTime={date}>
              {formatDate(date, false)}
            </time>
          </div>
          {children}
        </div>

        {sidebarRight && (
          <aside className="post-sidebar-right">
            <p>
              <time className="time" dateTime={date}>
                <span className="sr-only">{date}</span>
                {formatDate(date, false)}
              </time>
            </p>
            {tldr && (
              <>
                <h3>Tl;dr</h3>
                <p className="sidebar">{tldr}</p>
              </>
            )}
            {meta && (
              <>
                <h3>Meta</h3>
                <p className="sidebar">{meta}</p>
              </>
            )}
          </aside>
        )}
      </div>
    </Main>
  )
}

export default PostShell
