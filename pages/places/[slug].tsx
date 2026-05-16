import type { GetStaticPaths, GetStaticProps } from "next";
import { baseUrl, SEO } from "../../components/SEO";
import { Main } from "../../components/Layouts";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo } from "react";
import { getPlaceBySlug, getPublishedPlaceSlugs } from "../../lib/sanity";
import type { Venue } from "../../components/Globe";
import { AREA_HEX } from "../../components/Globe/types";
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

  const handleChipClick = useCallback(
    (key: string) => {
      focusArea(pinnedAreaKey === key ? null : key);
    },
    [pinnedAreaKey, focusArea],
  );

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
            {areas && areas.features.length > 0 && (
              <div className="mt-4 flex flex-col gap-1.5 pointer-events-auto">
                <span className="text-[11px] uppercase tracking-[0.08em] text-neutral-500 dark:text-neutral-500 [font-variation-settings:'opsz'_15,'wght'_500]">
                  Areas
                </span>
                <h2 id="areas-heading" className="sr-only">
                  Areas of interest
                </h2>
                <ul
                  aria-labelledby="areas-heading"
                  className="flex flex-wrap gap-1.5"
                >
                  {areas.features.map((f, i) => {
                    const key = f.properties._key;
                    const pressed = pinnedAreaKey === key;
                    return (
                      <li key={key}>
                        <button
                          type="button"
                          onClick={() => handleChipClick(key)}
                          aria-pressed={pressed}
                          className="group inline-flex items-center gap-1.5 rounded-full border border-neutral-200/70 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm px-2.5 py-1 text-[12.5px] text-neutral-700 dark:text-neutral-300 transition hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white/90 dark:hover:bg-neutral-900/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-600 [font-variation-settings:'opsz'_15,'wght'_500] aria-pressed:border-neutral-400 dark:aria-pressed:border-neutral-600"
                        >
                          <span
                            aria-hidden
                            className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                            style={{ background: AREA_HEX[f.properties.color] }}
                          >
                            {i + 1}
                          </span>
                          <span className="font-medium">{f.properties.title}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
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
