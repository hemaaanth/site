import React from "react";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import Tinkering from "../components/Home/Tinkering";
import Curating from "../components/Home/Curating";
import Link from "next/link";
import { LinkExternal } from "../components/Links";
import { getCurrentlyReading } from "../lib/hardcover";
import { getRecentlyPlayed } from "../lib/spotify";
import { getAllPosts } from "../lib/sanity";
import { loadTools } from "../lib/multiplexersData";
import { getProjectShots } from "../lib/screenshots";
import Badge from "../components/Badge";
import NamePronunciation from "../components/NamePronunciation";

// Truncate book titles at colon (treat everything after as subtitle)
function getDisplayTitle(title: string): string {
  const colonIndex = title.indexOf(':');
  if (colonIndex !== -1) {
    return title.substring(0, colonIndex).trim();
  }
  return title;
}

export default function Home({
  recentPosts,
  lastCompleted,
  currentlyReading,
  recentlyPlayed,
  mapCounts,
  shots,
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
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl sm:mb-0 mb-4">
            <NamePronunciation>Hemanth Soni</NamePronunciation>
          </h1>
        </header>
        <section className="list-container" aria-label="Introduction">
          <div className="list-title">
            <h2 className="text-neutral-500 dark:text-silver-dark text-base [font-variation-settings:'wght'_400]">Intro</h2>
          </div>
          <div className="list-content">
            <p>
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
            </p>
          </div>
        </section>
        <Writing posts={recentPosts} />
        <Curating counts={mapCounts} />
        <Tinkering shots={shots} />
        <section className="list-container border-0" aria-label="Reading">
          <div className="list-title">
            <h2 className="text-neutral-500 dark:text-silver-dark text-base [font-variation-settings:'wght'_400]">Reading</h2>
          </div>
          <div className="list-content">
            {currentlyReading.length > 0 ? (
              <>
                {currentlyReading.map((book, index) => (
                  <div
                    key={book.url}
                    className={`${index !== 0 ? "pt-2" : ""} flex items-baseline gap-1`}
                  >
                    <span className="truncate">
                      <LinkExternal href={book.url} imageUrl={book.imageUrl} preloadImage>{getDisplayTitle(book.title)}</LinkExternal>
                      <span className="hidden sm:inline"> by {book.author}</span>
                    </span>
                    <Badge>READING</Badge>
                  </div>
                ))}
                {lastCompleted && (
                  <div className="pt-2 opacity-30 dark:opacity-30 flex items-baseline gap-1">
                    <span className="truncate">
                      <LinkExternal href={lastCompleted.url} imageUrl={lastCompleted.imageUrl} preloadImage>
                        {getDisplayTitle(lastCompleted.title)}
                      </LinkExternal>
                      <span className="hidden sm:inline"> by {lastCompleted.author}</span>
                    </span>
                    <Badge>DONE</Badge>
                  </div>
                )}
              </>
            ) : (
              <div>Not currently reading anything</div>
            )}
          </div>
        </section>
        <section className="list-container border-0" aria-label="Listening">
          <div className="list-title">
            <h2 className="text-neutral-500 dark:text-silver-dark text-base [font-variation-settings:'wght'_400]">
              Listening
            </h2>
          </div>
          <div className="list-content">
            {recentlyPlayed.length > 0 ? (
              recentlyPlayed.map((track, index) => (
                <div
                  key={track.url}
                  className={`${index !== 0 ? "pt-2" : ""} truncate`}
                >
                  <LinkExternal href={track.url} imageUrl={track.imageUrl} preloadImage>{track.title}</LinkExternal>
                  <span className="truncate"> by {track.artist}</span>
                </div>
              ))
            ) : (
              <div>No recently played tracks</div>
            )}
          </div>
        </section>
      </Main>
    </>
  );
}

export async function getStaticProps() {
  console.log("Starting getStaticProps...");
  
  // Fetch all posts from Sanity
  const allPosts = await getAllPosts();

  // Transform Sanity posts to match expected format
  const posts = allPosts.map((post) => ({
    title: post.title,
    date: post.date,
    slug: post.slug.current || post.slug,
  }));

  // Sort posts by date (already sorted by query, but ensure it)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Only keep the five most recent posts
  const recentPosts = posts.slice(0, 5);

  // Add reading data
  const readingData = await getCurrentlyReading();

  // Add recently played tracks
  const recentlyPlayed = await getRecentlyPlayed();

  // Every scored tool, the same number the page shows above its map.
  const mapCounts = { "/multiplexers": loadTools().length };

  const shots = await getProjectShots();

  return {
    props: {
      recentPosts,
      mapCounts,
      shots,
      currentlyReading: readingData.currentlyReading,
      lastCompleted: readingData.lastCompleted,
      recentlyPlayed,
    },
    revalidate: 3600, // update every hour
  };
}
