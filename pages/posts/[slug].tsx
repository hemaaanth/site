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
  const { title, date, meta, tldr, mdxSource, headers, readingTime} = props;
  const slug = router.query.slug;
  const relativeUrl = `/posts/${slug}`;
  const allPostsUrl = `${baseUrl}/posts`; // Replace `homeUrl` with your actual base URL if it's defined elsewhere
  const url = `${baseUrl}${relativeUrl}`;
  console.log(`${baseUrl}/api/og?title=${encodeURIComponent(title)}`)
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      let currentSection = '';
      // Assuming your headers are rendered with id attributes matching their text slug
      headers.forEach(header => {
        const slug = header.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
        const element = document.getElementById(slug);
        // Adjust this value based on your layout/styling
        const scrollPosition = window.scrollY + 50;

        if (element && element.offsetTop <= scrollPosition) {
          currentSection = slug;
        }
      });

      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    // Cleanup scroll listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headers]); // Depend on headers so the effect updates if headers change

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
        <div className="flex w-full flex-col justify-between sm:flex-row"> 
          <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            {title}
          </h1></header>
          <LinkShare title={title} url={url}>
              Share
            </LinkShare>
        </div>
        <dl className="list-container">
          <dd className="list-content">
            <div className="prose-custom">
            <p className="text-neutral-700">{readingTime} minute(s)</p>

            <MDXRemote {...mdxSource} components={{ ...mdxComponents, LinkExternal }} />
            </div>
            <div className="prose-custom">
              <hr className="pb-0" />
              <a href="/posts" className="text-neutral-700 sm:pb-6 sm:align-left cursor-pointer">← All posts</a>
            </div>
          </dd>
          <dt className="list-title">
            <div className="list-sticky">
            <h3 className="pb-1">Table of Contents</h3>
              <ul className="sidebar toc w-full">
                {headers.map((header, index) => {
                  const slug = header.text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');
                  return (
                    <li key={index} className={`leading-6 truncate ${activeSection === slug ? 'text-white' : ''}`} style={{ marginLeft: `${header.depth * 1-1}rem` }}>
                      <a href={`#${slug}`}>
                        {header.text}
                      </a>
                    </li>
                  );
                })}
              </ul>
            <h3>Date</h3>
            <p>
              <time className="time" dateTime={date}>
                {formatDate(date, false)}
              </time>
            </p>
            <h3>Tl;dr</h3>
            <p className="sidebar">{tldr}</p>
            <h3>Meta</h3>
            <p className="sidebar">{meta}</p>
            </div>
          </dt>
        </dl>
      </Main>
    </>
  );
}

export const getStaticProps = async (context) => {
  const slug = context.params?.slug;
  const filePath = path.join(postsDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const { data: frontMatter, content } = matter(fileContents);
  const mdxSource = await serialize(content);

  const headerRegex = /^(#+)\s+(.*)/gm; // finding markdown headers
  let headers = [];
  let match;
  let minDepth = Infinity;

  const words = content.trim().split(/\s+/).length; // getting wordcount / reading time
  const readingSpeed = 200;
  const readingTime = Math.ceil(words / readingSpeed);

  while ((match = headerRegex.exec(content)) !== null) {
    let text = match[2].trim();
    const depth = match[1].length; // getting depth
    if (depth < minDepth) minDepth = depth;

    text = text.replace(/\*\*?(.*?)\*\*?/g, '$1'); // removing bold and italic
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // removing links

    headers.push({ depth, text });
  }

  headers = headers.map(header => ({
    ...header,
    depth: header.depth - minDepth + 1
  }));

  return {
    props: {
      ...frontMatter,
      mdxSource,
      headers,
      readingTime
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
