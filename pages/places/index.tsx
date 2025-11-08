import type { GetStaticProps } from "next";
import Link from "next/link";
import React from "react";
import { Main } from "../../components/Layouts";
import { SEO } from "../../components/SEO";
import Badge from "../../components/Badge";
import { getAllPlaces } from "../../lib/sanity";

interface Place {
  slug: string;
  title: string;
  year: string;
  isDraft: boolean; // true if it's a draft (WIP)
  rank?: number;
}

export default function Places({ places }: { places: Place[] }) {
  return (
    <>
      <SEO
        seo={{
          title: "Places",
          path: "/places",
        }}
      />
      <Main>
        <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'32,'wght'500] dark:text-white sm:pb-6 sm:text-xl">Places</h1></header>
        <dl className="list-container items-center gap-2">
          {places.map(({ slug, title, year, isDraft }) => (
            <React.Fragment key={slug}>
              <dt className="list-title border-none pt-0">
                <span className="time time-lg">
                  {year}
                </span>
              </dt>
              <dd className={`list-content border-none pb-4 pt-0 sm:pb-0 ${isDraft ? 'opacity-30 dark:opacity-30' : ''}`}>
                <div className="inline-flex items-center gap-1">
                  {!isDraft ? (
                    <Link href={`/places/${slug}`} className="link">
                      {title}
                    </Link>
                  ) : (
                    <span>
                      {title} 
                      <Badge>WIP</Badge>
                    </span>
                  )}
                </div>
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const placesData = await getAllPlaces();
  
  const places: Place[] = placesData.map((place) => ({
    slug: place.slug.current || place.slug,
    title: place.title,
    year: place.date || '', // Date is now a string (year)
    isDraft: place._id?.startsWith('drafts.') || false, // Check if it's a draft
    rank: place.rank,
  }));

  // Sort by year (descending) and rank (ascending)
  places.sort((a, b) => {
    // First sort by year
    if (a.year !== b.year) {
      return b.year.localeCompare(a.year);
    }
    // Then sort by rank if both places have ranks
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank;  // Lower rank number shows first
    }
    // Places with rank come before places without rank
    if (a.rank !== undefined) return -1;
    if (b.rank !== undefined) return 1;
    return 0;
  });

  return {
    props: {
      places,
    },
    // Revalidate every hour (3600 seconds) to pick up new content
    revalidate: 3600,
  };
};