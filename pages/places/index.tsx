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
const placesDirectory = path.join(process.cwd(), 'pages/places/content');

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
  const fileNames = fs.readdirSync(placesDirectory);
  const places = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, '');
    const fullPath = path.join(placesDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    
    return {
      slug,
      title: data.title,
      year: new Date(data.date).getFullYear().toString(),
      status: data.status as PlaceStatus,
    };
  });

  // Sort places by rank if available, then by date
  places.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year.localeCompare(a.year);
    }
    return 0;
  });

  return {
    props: {
      places,
    },
  };
};