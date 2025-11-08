import type { GetStaticProps } from "next";
import Link from "next/link";
import React from "react";
import { Main } from "../../components/Layouts";
import { SEO } from "../../components/SEO";
import formatDate from "../../lib/formatDate";
import Badge from "../../components/Badge";
import { client, allPostsQuery } from "../../lib/sanity";

export default function Posts({ posts }) {
  return (
    <>
      <SEO
        seo={{
          title: "Posts",
          path: "/posts",
        }}
      />
      <Main>
        <header>
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            Posts
          </h1>
        </header>
        <dl className="list-container items-center gap-2">
          {posts.map(({ slug, title, date, isDraft }) => (
            <React.Fragment key={slug.current || slug}>
              <dt
                className={`list-title border-none pt-0 ${isDraft ? "opacity-30 dark:opacity-30" : ""}`}
              >
                {isDraft ? (
                  // For drafts, "redact" the date
                  <time className="time time-lg" dateTime={date}>
                    ▒▒▒ ▒▒, ▒▒▒▒
                  </time>
                ) : (
                  // For published posts, display the date normally
                  <time className="time time-lg" dateTime={date}>
                    {formatDate(date, true)}
                  </time>
                )}
              </dt>
              <dd
                className={`list-content border-none pb-4 pt-0 sm:pb-0 ${isDraft ? "opacity-30 dark:opacity-30" : ""}`}
              >
                <div className="inline-flex items-center gap-1">
                  {isDraft ? (
                    // For drafts, display the title without a link and with the "WIP" badge
                    <span>
                      {title} <Badge>WIP</Badge>
                    </span>
                  ) : (
                    // For published posts, display the link
                    <Link href={`/posts/${slug.current || slug}`} className="link">
                      {title}
                    </Link>
                  )}
                </div>
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </Main>
    </>
  );
}

export const getStaticProps = async () => {
  const posts = await client.fetch(allPostsQuery);

  // Transform Sanity data to match expected format
  // Check if post is a draft by checking if _id starts with "drafts."
  const transformedPosts = posts.map((post) => ({
    title: post.title,
    date: post.date,
    slug: post.slug,
    isDraft: post._id.startsWith('drafts.'),
  }));

  // Already sorted by date desc from query, but ensure it
  transformedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    props: {
      posts: transformedPosts,
    },
    // Revalidate every hour (3600 seconds) to pick up new content
    revalidate: 3600,
  };
};