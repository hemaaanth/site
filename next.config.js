/** @type {import('next').NextConfig} */
const nextConfig = {
  skipTrailingSlashRedirect: true, // Required for PostHog trailing slash API requests
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.ctfassets.net",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "**.digitaloceanspaces.com",
      },
      {
        protocol: "http",
        hostname: "books.google.com",
      },
      {
        protocol: "https",
        hostname: "**.hardcover.app",
      },
      {
        protocol: "https",
        hostname: "**.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  async headers() {
    return [
      {
        // Logos are CSS masks. With the default max-age=0 the browser
        // revalidates each one every time a mark re-renders, so changing the
        // top-N cut on /multiplexers made logos pop in one round trip late.
        source: "/images/multiplexers/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/aly/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/aly/decide",
        destination: "https://us.i.posthog.com/decide",
      },
      {
        source: "/aly/decide/:path*",
        destination: "https://us.i.posthog.com/decide/:path*",
      },
      {
        source: "/aly/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);
