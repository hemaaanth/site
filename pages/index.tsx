import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import Link from "next/link"
import { LinkExternal } from "../components/Links";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function Home( {recentPosts} ) {
  return (
    <>
      <SEO
        seo={{
          title: "Hemanth Soni",
          path: "/",
        }}
      />
      <Main>
        <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
          Hemanth Soni
        </h1></header>
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Intro
            </h3>
          </dt>
          <dd className="list-content">
          <div>I build products & companies in financial services, data infrastructure, crypto, and various mixes of the three. Currently, I lead growth at Goldsky. More about me <Link href="/about" className="link inline-flex items-center gap-1">here</Link>.</div>
          </dd>
        </dl>
        <Writing posts={recentPosts} />
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Reading
            </h3>
          </dt>
          <dd className="list-content">
          <div><LinkExternal href="https://literal.club/book/the-nickel-boys-fiv1f">The Nickel Boys</LinkExternal> by Colson Whitehead</div>
          </dd>
        </dl>
      </Main>
    </>
  );
}

export async function getStaticProps() {
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
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Only keep the three most recent posts
  const recentPosts = posts.slice(0, 5);

  return {
    props: {
      recentPosts,
    },
  };
}