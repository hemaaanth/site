import type { GetStaticProps, GetStaticPaths } from "next";
import { Main } from "../../components/Layouts";
import { baseUrl, SEO } from "../../components/SEO";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Badge from "../../components/Badge";
import { LinkShare } from "../../components/Links";
import Link from "next/link";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import { mdxComponents } from "../../components/Prose";
import formatDate from "../../lib/formatDate";
import { LinkExternal } from "../../components/Links";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'pages/posts/content/');

export default function Post(props) {
  const router = useRouter();
  const { title, date, meta, tldr, mdxSource} = props;
  const slug = router.query.slug;
  const relativeUrl = `/posts/${slug}`;
  const url = `${baseUrl}${relativeUrl}`;
  const ogImageUrl = `https://hem.so/api/og?title=${encodeURIComponent(title)}`;

  return (
    <>
      <SEO
        seo={{
          title: title || "Loading...",
          description: tldr,
          path: relativeUrl,
          image: ogImageUrl,
        }}
      />
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row">
          <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            {title}
          </h1></header>
          <p
            onClick={() => router.back()}
            className="text-neutral-700 sm:pb-6 sm:align-left cursor-pointer"
          >
            Go Back
          </p>
        </div>
        <dl className="list-container">
          <dd className="list-content">
            <div className="prose-custom">
            <MDXRemote {...mdxSource} components={{ ...mdxComponents, LinkExternal }} />
            </div>
          </dd>
          <dt className="list-title">
            <h3>Date</h3>
            <p>
              <time className="time" dateTime={date}>
                {formatDate(date, false)}
              </time>
            </p>
            <h3>Tl;dr</h3>
            <p className="time">{tldr}</p>
            <h3>Meta</h3>
            <p className="time">{meta}</p>
          </dt>
        </dl>
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug;
  const filePath = path.join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data: frontMatter, content } = matter(fileContents);
  const mdxSource = await serialize(content);

  return {
    props: {
      ...frontMatter,
      mdxSource,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Logic to generate the paths for your posts
  const filenames = fs.readdirSync(postsDirectory);
  const paths = filenames.map((filename) => ({
    params: { slug: filename.replace(/\.mdx?$/, '') },
  }));

  return {
    paths,
    fallback: false,
  };
};
