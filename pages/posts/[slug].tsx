import type { GetStaticPaths } from "next";
import { baseUrl, SEO } from "../../components/SEO";
import { useRouter } from "next/router";
import React from "react";
import { getPostBySlug, getPublishedPostSlugs } from "../../lib/sanity";
import PortableText from "../../components/PortableText";
import { PostShell } from "../../components/PostShell";
import { extractHeaders, filterHeadersByDepth, calculateReadingTime } from "../../lib/portableTextUtils";
import type { PortableTextBlock } from '@portabletext/types';

export default function Post(props) {
  const router = useRouter();
  const { title, date, dateModified, meta, tldr, content, headers, readingTime, author } = props;
  const slug = router.query.slug;
  const relativeUrl = `/posts/${slug}`;

  return (
    <>
      <SEO
        seo={{
          title: title || "Loading...",
          description: tldr,
          path: relativeUrl,
          image: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
          article: {
            datePublished: date,
            dateModified,
            author: author,
          },
          }}
      />
      <PostShell
        title={title}
        date={date}
        path={relativeUrl}
        tldr={tldr}
        meta={meta}
        headers={headers}
        readingTime={readingTime}
      >
        <div className="prose-custom">
          <PortableText content={content} />
        </div>
      </PostShell>
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
      dateModified: post._updatedAt,
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
