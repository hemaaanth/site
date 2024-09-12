import type { GetStaticProps } from "next";
import Link from "next/link";
import React from "react";
import { Main } from "../../components/Layouts";
import { SEO } from "../../components/SEO";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Badge from "../../components/Badge";

type PlaceStatus = 'published' | 'WIP' | 'upcoming';

interface Place {
  slug: string;
  title: string;
  year: string;
  status: PlaceStatus;
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
          {places.map(({ slug, title, year, status }) => (
            <React.Fragment key={slug}>
              <dt className="list-title border-none pt-0">
                <span className="time time-lg">
                  {year}
                </span>
              </dt>
              <dd className={`list-content border-none pb-4 pt-0 sm:pb-0 ${status !== 'published' ? 'opacity-30 dark:opacity-30' : ''}`}>
                <div className="inline-flex items-center gap-1">
                  {status === 'published' ? (
                    <Link href={`/places/${slug}`} className="link">
                      {title}
                    </Link>
                  ) : (
                    <span>
                      {title} 
                      <Badge>{status === 'WIP' ? 'WIP' : 'Upcoming'}</Badge>
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
  const placesDirectory = path.join(process.cwd(), 'pages/places/content');
  const filenames = fs.readdirSync(placesDirectory);
  const allPlaces = filenames.map(filename => {
  const filePath = path.join(placesDirectory, filename);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data } = matter(fileContents);
  return {
  title: data.title,
  year: data.date,
  slug: filename.replace(/\.mdx?$/, ''),
  status: (data.status as PlaceStatus) || 'published',
  rank: data.rank || 0, // Default to 0 if not specified
  };
  });
  // Sort places by year (descending) and then by rank (descending)
  allPlaces.sort((a, b) => {
  if (a.year !== b.year) {
  return b.year.localeCompare(a.year);
  }
  return b.rank - a.rank;
  });
  return {
  props: {
  places: allPlaces,
  },
  };
  };