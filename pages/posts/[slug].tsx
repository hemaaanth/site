import type { GetStaticProps, GetStaticPaths } from "next";
import { Main } from "../../components/Layouts";
import { baseUrl, SEO } from "../../components/SEO";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { LinkShare } from "../../components/Links";
import { SpeedReader } from "../../components/SpeedReader";
import Link from "next/link";
import formatDate from "../../lib/formatDate";
import { getPostBySlug, getPublishedPostSlugs } from "../../lib/sanity";
import PortableText from "../../components/PortableText";
import { extractHeaders, filterHeadersByDepth, calculateReadingTime } from "../../lib/portableTextUtils";
import type { PortableTextBlock } from '@portabletext/types';

export default function Post(props) {
  const router = useRouter();
  const { title, date, meta, tldr, content, headers, readingTime } = props;
  const slug = router.query.slug;
  const relativeUrl = `/posts/${slug}`;
  const url = `${baseUrl}${relativeUrl}`;
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      let currentSection = '';
      headers.forEach(header => {
        const slug = header.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        const element = document.getElementById(slug);
        const scrollPosition = window.scrollY + 50;

        if (element && element.offsetTop <= scrollPosition) {
          currentSection = slug;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headers]);

  return (
    <>
      <SEO
        seo={{
          title: title || "Loading...",
          description: tldr,
          path: relativeUrl,
          image: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
          }} 
      /> 
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row sm:mb-0 mb-4">
          <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl sm:mb-0 mb-4">
            {title}
          </h1></header>
          <div className="flex gap-2">
            <SpeedReader content={content}>Speed Read</SpeedReader>
            <LinkShare title={title} url={url}>
              Share
            </LinkShare>
          </div>
        </div>
        
        <div className="blog-post-layout">
          {/* Left sidebar - Table of Contents */}
          <aside className="blog-sidebar-left">
            <div className="list-sticky">
              <h3 className="pb-1">Table of Contents</h3>
              <ul className="sidebar toc w-full">
                {headers.map((header, index) => {
                  const headerSlug = header.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                  return (
                    <li key={index} className={`toc-item leading-6 truncate ${activeSection === headerSlug ? 'toc-active' : ''}`} style={{ marginLeft: `${header.depth * 1-1}rem` }}>
                      <a href={`#${headerSlug}`}>
                        {header.text}
                      </a>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6">
                <Link href="/posts" className="text-neutral-500 dark:text-silver-dark hover:text-neutral-800 dark:hover:text-silver transition-colors text-sm">← All posts</Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="blog-main">
            <div className="prose-custom">
              <p className="text-neutral-700">{readingTime} minute(s)</p>
              <PortableText content={content} />
            </div>
          </div>

          {/* Right sidebar - Meta info (not sticky) */}
          <aside className="blog-sidebar-right">
            <h3>Date</h3>
            <p>
              <time className="time" dateTime={date}>
                <span className="sr-only">{date}</span>
                {formatDate(date, false)}
              </time>
            </p>
            <h3>Tl;dr</h3>
            <p className="sidebar">{tldr}</p>
            {meta && (
              <>
                <h3>Meta</h3>
                <p className="sidebar">{meta}</p>
              </>
            )}
          </aside>
        </div>
      </Main>
    </>
  );
}

export const getStaticProps = async (context) => {
  const slug = context.params?.slug as string;
  // Check if preview/draft mode is enabled
  const isDraftMode = context.preview === true;
  const post = await getPostBySlug(slug, isDraftMode);

  if (!post) {
    return {
      notFound: true,
    };
  }

  const content = post.content as PortableTextBlock[];
  
  // Extract headers from Portable Text
  let headers = extractHeaders(content);
  
  // Filter headers based on the optional 'depth' variable
  const maxDepth = post.depth || Infinity;
  headers = filterHeadersByDepth(headers, maxDepth);
  
  // Calculate reading time
  const readingTime = calculateReadingTime(content);

  return {
    props: {
      title: post.title,
      date: post.date,
      author: post.author,
      tldr: post.tldr,
      meta: post.meta,
      category: post.category,
      depth: post.depth || null,
      content,
      headers,
      readingTime,
      isDraft: false, // Only published posts are accessible via getStaticPaths
    },
    // Revalidate every hour (3600 seconds) to pick up new content
    revalidate: 3600,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = await getPublishedPostSlugs();
  const paths = posts.map((post) => ({
    params: { slug: post.slug.current },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};
