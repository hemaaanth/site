import React, { useEffect } from "react";
import Head from "next/head";
import { Main } from "../components/Layouts";
import { SEO } from "../components/SEO";
import Writing from "../components/Home/Writing";
import Tinkering from "../components/Home/Tinkering";
import Link from "next/link";
import { LinkExternal } from "../components/Links";
import { getCurrentlyReading } from "../lib/hardcover";
import { getRecentlyPlayed } from "../lib/spotify";
import { getAllPosts } from "../lib/sanity";
import Badge from "../components/Badge";

export default function Home({
  recentPosts,
  lastCompleted,
  currentlyReading,
  recentlyPlayed,
}) {
  // Collect all image URLs for preloading
  const imageUrls = React.useMemo(() => {
    const urls: string[] = [];
    
    // Add book images
    currentlyReading.forEach(book => {
      if (book.imageUrl) urls.push(book.imageUrl);
    });
    if (lastCompleted?.imageUrl) {
      urls.push(lastCompleted.imageUrl);
    }
    
    // Add Spotify track images
    recentlyPlayed.forEach(track => {
      if (track.imageUrl) urls.push(track.imageUrl);
    });
    
    return urls;
  }, [currentlyReading, lastCompleted, recentlyPlayed]);

  // Preload images when component mounts
  useEffect(() => {
    imageUrls.forEach(url => {
      if (url) {
        // Preload via Image object to ensure browser caches it
        const img = new Image();
        img.src = url;
      }
    });
  }, [imageUrls]);

  return (
    <>
      <Head>
        {/* Preload all hover images */}
        {imageUrls.map((url, index) => (
          url && (
            <link
              key={`preload-${index}`}
              rel="preload"
              as="image"
              href={url}
              crossOrigin="anonymous"
            />
          )
        ))}
      </Head>
      <SEO
        seo={{
          title: "Hemanth Soni",
          path: "/",
        }}
      />
      <Main>
        <header>
          <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl sm:mb-0 mb-4">
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
<Tinkering />
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
                    <LinkExternal href={book.url} imageUrl={book.imageUrl}>{book.title}</LinkExternal>
                    <span className="truncate"> by {book.author}</span>
                    <Badge>READING</Badge>
                  </div>
                ))}
                {lastCompleted && (
                  <div className="pt-2 opacity-30 dark:opacity-30 truncate">
                    <LinkExternal href={lastCompleted.url} imageUrl={lastCompleted.imageUrl}>
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
                  <LinkExternal href={track.url} imageUrl={track.imageUrl}>{track.title}</LinkExternal>
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
