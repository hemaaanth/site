/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: "https://hem.so",
  generateRobotsTxt: true,
  sitemapSize: 5000,
  autoLastmod: false,
  exclude: ["/links", "/meridian", "/posts/rss"],
  additionalPaths: async (config) => {
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
    if (!projectId) return [];

    const { createClient } = require("@sanity/client");
    const client = createClient({
      projectId,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
      apiVersion: "2024-01-01",
      useCdn: true,
    });
    const documents =
      await client.fetch(`*[_type in ["post", "place"] && !(_id in path("drafts.**"))] {
      _type,
      "slug": slug.current,
      _updatedAt
    }`);

    return documents.map((document) => ({
      loc: `/${document._type === "post" ? "posts" : "places"}/${document.slug}`,
      lastmod: document._updatedAt,
      changefreq: config.changefreq,
      priority: config.priority,
    }));
  },
};
