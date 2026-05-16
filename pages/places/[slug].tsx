import type { GetStaticPaths, GetStaticProps } from "next";
import { baseUrl, SEO } from "../../components/SEO";
import { Main } from "../../components/Layouts";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { getPlaceBySlug, getPublishedPlaceSlugs } from "../../lib/sanity";
import type { Venue } from "../../components/Globe";
import type { AreaCollection } from "../../components/Globe/types";
import { useGlobe } from "../../components/Globe/context";
import { buildAreaCollection } from "../../lib/areas";

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

interface PlaceProps {
  title: string;
  cityCoordinates: [number, number] | null;
  venues: Venue[];
  areas: AreaCollection | null;
  droppedAreaCount: number;
}

export default function Place({ title, cityCoordinates, venues, areas, droppedAreaCount }: PlaceProps) {
  const router = useRouter();
  const slug = router.query.slug;
  const relativeUrl = `/places/${slug}`;
  const { enterCityView, focusArea, pinnedAreaKey } = useGlobe();

  // Tell the persistent globe to enter city view
  useEffect(() => {
    if (cityCoordinates && venues.length > 0) {
      enterCityView({ venues, cityCoordinates, areas });
    }
  }, [venues, cityCoordinates, areas, enterCityView]);

  // Read ?area=<_key> on mount and pin that area, if it exists.
  useEffect(() => {
    if (!areas) return;
    const qp = router.query.area;
    const key = typeof qp === "string" ? qp : null;
    if (key && areas.features.some((f) => f.properties._key === key)) {
      focusArea(key);
    }
    // Only on initial mount or when area set changes
  }, [areas, router.query.area, focusArea]);

  // Push ?area=<_key> when pinnedAreaKey changes (replace, no history entry).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (pinnedAreaKey) {
      if (url.searchParams.get("area") === pinnedAreaKey) return;
      url.searchParams.set("area", pinnedAreaKey);
    } else {
      if (!url.searchParams.has("area")) return;
      url.searchParams.delete("area");
    }
    window.history.replaceState({}, "", url.toString());
  }, [pinnedAreaKey]);

  const devAttrs =
    process.env.NODE_ENV !== "production" && droppedAreaCount > 0
      ? { "data-areas-dropped": String(droppedAreaCount) }
      : {};

  return (
    <>
      <SEO
        seo={{
          title: title || "Loading...",
          path: relativeUrl,
          image: `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
        }}
      />
      <div
        className="relative z-20 dark:[&_*]:border-neutral-700/40 pointer-events-none [&_a]:pointer-events-auto [&_footer]:fixed [&_footer]:bottom-0 [&_footer]:left-0 [&_footer]:right-0 [&_footer]:px-6"
        {...devAttrs}
      >
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

export const getStaticProps: GetStaticProps<PlaceProps> = async (context) => {
  const slug = context.params?.slug as string;
  const isDraftMode = context.preview === true;
  const place = await getPlaceBySlug(slug, isDraftMode);

  if (!place) {
    return { notFound: true };
  }

  const cityQuery = place.geocodeHint || place.title;
  const cityCoordinates = await geocodeLocation(cityQuery);

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

  const { collection: areas, droppedCount: droppedAreaCount } = buildAreaCollection(
    place.areas,
    slug,
  );

  return {
    props: {
      title: place.title,
      cityCoordinates,
      venues,
      areas,
      droppedAreaCount,
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
