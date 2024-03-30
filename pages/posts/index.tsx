import type { GetStaticProps } from "next";
import Link from "next/link";
import React from "react";
import { Main } from "../../components/Layouts";
import { SEO } from "../../components/SEO";
import formatDate from "../../lib/formatDate";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Badge from "../../components/Badge";

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
        <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">Posts</h1></header>
        <dl className="list-container items-center gap-2">
          {posts.map(({ slug, title, date, status }) => (
            <React.Fragment key={slug}>
              <dt className={`list-title border-none pt-0 ${status === 'draft' ? 'opacity-30 dark:opacity-30' : ''}`}>
                {status === 'draft' ? (
                  // For drafts, "redact" the date
                  <time className="time time-lg" dateTime={date}>
                    ▒▒▒ ▒▒, ▒▒▒▒
                  </time>                ) : (
                  // For published posts, display the date normally
                  <time className="time time-lg" dateTime={date}>
                    {formatDate(date, true)}
                  </time>
                )}
              </dt>
              <dd className={`list-content border-none pb-4 pt-0 sm:pb-0 ${status === 'draft' ? 'opacity-30 dark:opacity-30' : ''}`}>
                <div className="inline-flex items-center gap-1">
                  {status === 'draft' ? (
                    // For drafts, display the title without a link and with the "WIP" badge
                    <span>{title} <Badge>WIP</Badge></span>
                  ) : (
                    // For published posts, display the link
                    <Link href={`/posts/${slug}`} className="link">
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

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const postsDirectory = path.join(process.cwd(), 'pages/posts/content');
    const filenames = fs.readdirSync(postsDirectory);
  
    const posts = filenames.map(filename => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
  
      return {
        title: data.title,
        date: data.date,
        slug: filename.replace(/\.mdx?$/, ''),
        status: data.status,
      };
    });
  
    // Sort posts by date
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      props: {
        posts,
      },
    };
};