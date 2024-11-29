import type { GetStaticProps, GetStaticPaths } from "next";
import { Main } from "../../components/Layouts";
import { baseUrl, SEO } from "../../components/SEO";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import PlaceItem, { PlaceType } from "../../components/Places";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const placesDirectory = path.join(process.cwd(), "pages/places/content/");

export default function Place({ title, year, places }) {
  const router = useRouter();
  const slug = router.query.slug;
  const relativeUrl = `/places/${slug}`;
  const url = `${baseUrl}${relativeUrl}`;

  // Add state and filter logic
  const [selectedTypes, setSelectedTypes] = useState<PlaceType[]>([]);

  // Get unique types from all places
  const allTypes = Array.from(
    new Set(places.flatMap((place) => place.types)),
  ).sort();

  // Filter places based on selected types
  const filteredPlaces = places.filter((place) =>
    selectedTypes.every((type) => place.types.includes(type)),
  );

  // Update URL when filters change
  useEffect(() => {
    const query = { ...router.query };
    if (selectedTypes.length > 0) {
      query.types = selectedTypes.join(",");
    } else {
      delete query.types;
    }
    router.push({ query }, undefined, { shallow: true });
  }, [selectedTypes]);

  // Initialize filters from URL on load
  useEffect(() => {
    if (router.isReady && router.query.types) {
      const urlTypes = (router.query.types as string).split(",") as PlaceType[];
      setSelectedTypes(urlTypes);
    }
  }, [router.isReady]);

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
          <header>
            <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:pb-6 sm:text-xl">
              {title}
            </h1>
          </header>
        </div>
        <dl className="list-container">
          <dd className="list-content">
            {filteredPlaces.length > 0 ? (
              filteredPlaces.map((place, index) => (
                <PlaceItem key={index} {...place} />
              ))
            ) : (
              <div className="prose-custom text-neutral-500 mt-4">
                <p>
                  No matches for current filters, please{" "}
                  <span
                    onClick={() => setSelectedTypes([])}
                    className="underline cursor-pointer"
                  >
                    reset
                  </span>{" "}
                  or change them.
                </p>
              </div>
            )}
            <div className="prose-custom">
              <hr className="pb-0" />
              <Link
                href="/places"
                className="text-neutral-700 sm:pb-6 sm:align-left cursor-pointer"
              >
                ← All places
              </Link>
            </div>
          </dd>
          <dt className="list-title">
            <div className="list-sticky">
              <h3>Last visited</h3>
              <p className="sidebar">{year}</p>

              <div className="mt-8">
                <h3>Filter(s)</h3>
                <div className="flex flex-col gap-2 mt-2">
                  {allTypes.map((type) => (
                    <span
                      key={type as string}
                      onClick={() => {
                        setSelectedTypes((prev: PlaceType[]) =>
                          prev.includes(type as PlaceType)
                            ? prev.filter((t: PlaceType) => t !== type)
                            : [...prev, type as PlaceType],
                        );
                      }}
                      className={`cursor-pointer text-sm ${
                        selectedTypes.includes(type as PlaceType)
                          ? "text-neutral-800 dark:text-white font-medium underline"
                          : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
                      }`}
                    >
                      {(type as string).charAt(0).toUpperCase() +
                        (type as string).slice(1)}
                    </span>
                  ))}
                </div>
              </div>
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
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  // Parse the content to extract places
  const places = content
    .split("---")
    .filter(Boolean)
    .map((placeString) => {
      const lines = placeString.trim().split("\n");
      const title = lines[0].trim();
      const location = lines[1].trim();
      const typeString = lines[2].trim();
      const description = lines.slice(3).join("\n").trim();

      // Split the type string by comma and trim each type
      const types = typeString.split(",").map((t) => t.trim()) as PlaceType[];

      return {
        title,
        location,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
        types,
        description,
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
    params: { slug: filename.replace(/\.mdx?$/, "") },
  }));

  return {
    paths,
    fallback: false,
  };
};
