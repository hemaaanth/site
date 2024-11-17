import type { GetStaticProps, GetStaticPaths } from "next";
import { Main } from "../../components/Layouts";
import { baseUrl, SEO } from "../../components/SEO";
import { useRouter } from "next/router";
import React from "react";
import Link from "next/link";
import PlaceItem from "../../components/Places";
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const placesDirectory = path.join(process.cwd(), 'pages/places/content/');

export default function Place({ title, year, places }) {
  const router = useRouter();
  const slug = router.query.slug;
  const relativeUrl = `/places/${slug}`;
  const url = `${baseUrl}${relativeUrl}`;

  return (
    <>
      <SEO
        seo={{
          title: title || "Loading...",
          path: relativeUrl,
          image: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
        }} 
      /> 
      <Main>
        <div className="flex w-full flex-col justify-between sm:flex-row"> 
          <header><h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
            {title}
          </h1></header>
        </div>
        <dl className="list-container">
          <dd className="list-content">
            {places.map((place, index) => (
              <PlaceItem key={index} {...place} />
            ))}
            <div className="prose-custom">
              <hr className="pb-0" />
              <Link href="/places" className="text-neutral-700 sm:pb-6 sm:align-left cursor-pointer">← All places</Link>
            </div>
          </dd>
          <dt className="list-title">
            <div className="list-sticky">
              <h3>Last visited</h3>
              <p className="sidebar">{year}</p>
            </div>
          </dt>
        </dl>
      </Main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
    const slug = context.params?.slug;
    const filePath = path.join(placesDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
  
    // Parse the content to extract places
    const places = content.split('---').filter(Boolean).map(placeString => {
        const [title, location, icon, ...descriptionLines] = placeString.trim().split('\n');
        const description = descriptionLines.join('\n').trim();
        
        return {
          title: title.trim(),
          location: location.trim(),
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`,
          icon: icon.trim(),
          description: description.trim(),
        };
      });
    return {
      props: {
        title: data.title,
        year: new Date(data.date).getFullYear().toString(),
        places,
      },
    };
  };

export const getStaticPaths: GetStaticPaths = async () => {
  const filenames = fs.readdirSync(placesDirectory);
  const paths = filenames.map((filename) => ({
    params: { slug: filename.replace(/\.mdx?$/, '') },
  }));

  return {
    paths,
    fallback: false,
  };
};