import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import Link from "next/link";
import { LinkExternal } from "../components/Links";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getCurrentlyReading } from "../lib/literal";
import { getRecentlyPlayed } from "../lib/spotify";
import Badge from "../components/Badge";

export default function Home({
  recentPosts,
  lastCompleted,
  currentlyReading,
  recentlyPlayed,
}) {
  return (
    <>
      <SEO
        seo={{
          title: "Hemanth Soni",
          path: "/",
        }}
      />
      <Main>
        <header>
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            Hemanth Soni
          </h1>
        </header>
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">Intro</h3>
          </dt>
          <dd className="list-content">
            <div>
              I build products & companies in financial services, data
              infrastructure, crypto, and various mixes of the three. Currently,
              I lead growth at Goldsky. More about me{" "}
              <Link
                href="/about"
                className="link inline-flex items-center gap-1"
              >
                here
              </Link>
              .
            </div>
          </dd>
        </dl>
        <Writing posts={recentPosts} />
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">Reading</h3>
          </dt>
          <dd className="list-content">
            {currentlyReading.length > 0 ? (
              <>
                {currentlyReading.map((book, index) => (
                  <div
                    key={book.url}
                    className={`${index !== 0 ? "pt-2" : ""} truncate`}
                  >
                    <LinkExternal href={book.url}>{book.title}</LinkExternal>
                    <span className="truncate"> by {book.author}</span>
                    <Badge>READING</Badge>
                  </div>
                ))}
                {lastCompleted && (
                  <div className="pt-2 opacity-30 dark:opacity-30 truncate">
                    <LinkExternal href={lastCompleted.url}>
                      {lastCompleted.title}
                    </LinkExternal>
                    <span className="truncate"> by {lastCompleted.author}</span>{" "}
                    <Badge>DONE</Badge>
                  </div>
                )}
              </>
            ) : (
              <div>Not currently reading anything</div>
            )}
          </dd>
        </dl>
        <dl className="list-container">
          <dt className="list-title">
            <h3 className="text-neutral-500 dark:text-silver-dark">
              Listening
            </h3>
          </dt>
          <dd className="list-content">
            {recentlyPlayed.length > 0 ? (
              recentlyPlayed.map((track, index) => (
                <div
                  key={track.url}
                  className={`${index !== 0 ? "pt-2" : ""} truncate`}
                >
                  <LinkExternal href={track.url}>{track.title}</LinkExternal>
                  <span className="truncate"> by {track.artist}</span>
                </div>
              ))
            ) : (
              <div>No recently played tracks</div>
            )}
          </dd>
        </dl>
      </Main>
    </>
  );
}

export async function getStaticProps() {
  console.log("Starting getStaticProps...");
  const postsDirectory = path.join(process.cwd(), "pages/posts/content");
  const filenames = fs.readdirSync(postsDirectory);

  const posts = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    return {
      title: data.title || "Untitled",
      date: data.date || "Untitled",
      slug: filename.replace(/\.mdx?$/, ""),
      status: data.status || "Untitled",
    };
  });

  // Sort posts by date
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Only keep the three most recent posts
  const recentPosts = posts.slice(0, 5);

  // Add reading data
  const readingData = await getCurrentlyReading(process.env.LITERAL_USER_ID);

  // Add recently played tracks
  console.log("Starting Spotify fetch...");
  console.log("Spotify env vars present:", {
    clientId: !!process.env.SPOTIFY_CLIENT_ID,
    clientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    refreshToken: !!process.env.SPOTIFY_REFRESH_TOKEN,
  });
  const recentlyPlayed = await getRecentlyPlayed();
  console.log("Spotify recently played data:", recentlyPlayed);

  return {
    props: {
      recentPosts,
      currentlyReading: readingData.currentlyReading,
      lastCompleted: readingData.lastCompleted,
      recentlyPlayed,
    },
    revalidate: 3600, // update every hour
  };
}
