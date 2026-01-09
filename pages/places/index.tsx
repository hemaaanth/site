import type { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import React, { useState } from "react";
import { Main } from "../../components/Layouts";
import { SEO } from "../../components/SEO";
import Badge from "../../components/Badge";
import { getAllPlaces } from "../../lib/sanity";

const Globe = dynamic(() => import("../../components/Globe"), { ssr: false });

interface Place {
  slug: string;
  title: string;
  year: string;
  isDraft: boolean;
  rank?: number;
  coordinates?: [number, number] | null;
}

export default function Places({ places }: { places: Place[] }) {
  const [hoveredCoordinates, setHoveredCoordinates] = useState<[number, number] | null>(null);

  return (
    <>
      <SEO
        seo={{
          title: "Places",
          path: "/places",
        }}
      />
      <Globe targetCoordinates={hoveredCoordinates} />
      <div className="relative z-20">
        <Main>
          <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'32,'wght'500] dark:text-white sm:pb-6 sm:text-xl">Places</h1></header>
          <dl className="list-container items-center gap-2">
            {places.map(({ slug, title, year, isDraft, coordinates }) => (
              <React.Fragment key={slug}>
                <dt className="list-title border-none pt-0">
                  <span className="time time-lg">
                    {year}
                  </span>
                </dt>
                <dd
                  className={`list-content border-none pb-4 pt-0 sm:pb-0 ${isDraft ? 'opacity-30 dark:opacity-30' : ''}`}
                  onMouseEnter={() => coordinates && setHoveredCoordinates(coordinates)}
                  onMouseLeave={() => setHoveredCoordinates(null)}
                >
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
      </div>
    </>
  );
}

async function getCityCoordinates(cityName: string): Promise<[number, number] | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality&limit=1`
    );
    const data = await response.json();
    if (data.features && data.features[0]?.center) {
      return data.features[0].center as [number, number];
    }
    return null;
  } catch (error) {
    console.error(`Failed to geocode ${cityName}:`, error);
    return null;
  }
}

export const getStaticProps: GetStaticProps = async () => {
  const placesData = await getAllPlaces();

  const places: Place[] = await Promise.all(
    placesData.map(async (place) => {
      const coordinates = await getCityCoordinates(place.title);
      return {
        slug: place.slug.current || place.slug,
        title: place.title,
        year: place.date || '',
        isDraft: place._id?.startsWith('drafts.') || false,
        rank: place.rank,
        coordinates,
      };
    })
  );

  // Sort by year (descending) and rank (ascending)
  places.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year.localeCompare(a.year);
    }
    if (a.rank !== undefined && b.rank !== undefined) {
      return a.rank - b.rank;
    }
    if (a.rank !== undefined) return -1;
    if (b.rank !== undefined) return 1;
    return 0;
  });

  return {
    props: {
      places,
    },
    revalidate: 3600,
  };
};