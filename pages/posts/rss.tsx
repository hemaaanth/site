import type { GetServerSideProps } from "next";

import { baseUrl } from "../../components/SEO";
import { getAllPosts } from "../../lib/sanity";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function toRssDate(value: string) {
  return new Date(value).toUTCString();
}

export default function RssFeed() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const posts = await getAllPosts();
  const lastBuildDate = posts.reduce((latest, post) => {
    const updatedAt = new Date(post._updatedAt).getTime();
    return updatedAt > latest ? updatedAt : latest;
  }, 0);
  const items = posts
    .map((post) => {
      const url = `${baseUrl}/posts/${post.slug.current}`;

      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.tldr)}</description>
      <pubDate>${toRssDate(post.date)}</pubDate>
    </item>`;
    })
    .join("\n");
  const feed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Hemanth Soni</title>
    <link>${baseUrl}/posts</link>
    <description>Writing by Hemanth Soni</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(lastBuildDate || Date.now()).toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/posts/rss" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  res.write(feed);
  res.end();

  return { props: {} };
};
