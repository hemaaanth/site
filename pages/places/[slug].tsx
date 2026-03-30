import type { GetStaticProps, GetStaticPaths } from "next";
import { baseUrl, SEO } from "../../components/SEO";
import { Main } from "../../components/Layouts";
import { useRouter } from "next/router";
import React, { useMemo, useEffect, useCallback } from "react";
import { getPlaceBySlug, getPublishedPlaceSlugs } from "../../lib/sanity";
import type { Venue } from "../../components/Globe";
import { useGlobe } from "../../components/Globe/context";

async function geocodeLocation(location: string): Promise<[number, number] | null> {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
    );
    const data = await response.json();
    return data.features?.[0]?.center || null;
  } catch {
    return null;
  }
}

export default function Place({ title, cityCoordinates, venues }: {
  title: string;
  cityCoordinates: [number, number] | null;
  venues: Venue[];
}) {
  const router = useRouter();
  const slug = router.query.slug;
  const relativeUrl = `/places/${slug}`;
  const { enterCityView } = useGlobe();

  const stableVenues = useMemo(() => venues, [JSON.stringify(venues)]);

  // Tell the persistent globe to enter city view
  useEffect(() => {
    if (cityCoordinates && stableVenues.length > 0) {
      enterCityView(stableVenues, cityCoordinates);
    }
  }, [stableVenues, cityCoordinates, enterCityView]);

  return (
    <>
      <SEO
        seo={{
          title: title || "Loading...",
          path: relativeUrl,
          image: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
        }}
      />
      <div className="relative z-20 dark:[&_*]:border-neutral-700/40 pointer-events-none [&_a]:pointer-events-auto [&_footer]:fixed [&_footer]:bottom-0 [&_footer]:left-0 [&_footer]:right-0 [&_footer]:px-6">
        <Main>
          <header>
            <h1 className="text-xl text-neutral-800 [font-variation-settings:'opsz'_32,_'wght'_500] dark:text-white sm:text-xl">
              {title}
            </h1>
          </header>
        </Main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug as string;
  const isDraftMode = context.preview === true;
  const place = await getPlaceBySlug(slug, isDraftMode);

  if (!place) {
    return { notFound: true };
  }

  const cityCoordinates = await geocodeLocation(place.title);

  const venues: Venue[] = await Promise.all(
    (place.places || []).map(async (p: any) => {
      const coordinates = await geocodeLocation(p.location);
      return {
        title: p.title,
        location: p.location,
        description: p.description || "",
        types: (p.types || []).filter((t: string) => t !== "favourite"),
        favourite: p.favourite || p.types?.includes("favourite") || false,
        coordinates,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.location)}`,
      };
    })
  );

  return {
    props: {
      title: place.title,
      cityCoordinates,
      venues,
    },
    revalidate: 3600,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const places = await getPublishedPlaceSlugs();
  const paths = places.map((place) => ({
    params: { slug: place.slug.current },
  }));

  return {
    paths,
    fallback: 'blocking',
  };
};
