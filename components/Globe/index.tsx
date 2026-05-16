import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot } from "react-dom/client";
import {
  Beer,
  BedDouble,
  Briefcase,
  Coffee,
  Landmark,
  Martini,
  PartyPopper,
  Star,
  Store,
  UtensilsCrossed,
  Wine,
} from "lucide-react";
import type { AreaCollection, AreaFeature, Venue } from "./types";
import { KIND_HEX } from "./types";

export type { Venue } from "./types";

interface GlobeProps {
  targetCoordinates?: [number, number] | null;
  venues?: Venue[] | null;
  areas?: AreaCollection | null;
  cityCoordinates?: [number, number] | null;
  onCityReady?: (() => void) | null;
  pinnedAreaKey?: string | null;
  onAreaFocus?: (key: string | null) => void;
}

const typeIcons: Record<string, React.FC<{ size?: number; className?: string; fill?: string }>> = {
  food: UtensilsCrossed,
  beer: Beer,
  cocktails: Martini,
  wine: Wine,
  activity: Landmark,
  sight: Landmark,
  shop: Store,
  hotel: BedDouble,
  coffee: Coffee,
  work: Briefcase,
  party: PartyPopper,
  favourite: Star,
};

const getSystemDarkMode = () => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const getReduceMotion = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Average of the outer ring vertices — close enough for popup anchoring without pulling @turf.
function polygonCentroid(coordinates: number[][][]): [number, number] {
  const ring = coordinates[0];
  if (!ring || ring.length < 2) return [0, 0];
  // Closed ring: last point equals first, exclude it from the average.
  const n = ring.length - 1;
  let sumLng = 0;
  let sumLat = 0;
  for (let i = 0; i < n; i++) {
    sumLng += ring[i][0];
    sumLat += ring[i][1];
  }
  return [sumLng / n, sumLat / n];
}

function buildPopupNode(opts: {
  title: string;
  description?: string;
  link?: string;
}): HTMLElement {
  const root = document.createElement("div");
  root.className = "venue-popup";

  const header = document.createElement("div");
  header.className = "venue-popup-header";

  const title = document.createElement("div");
  title.className = "venue-popup-title";
  title.textContent = opts.title;
  header.appendChild(title);

  if (opts.link) {
    const link = document.createElement("a");
    link.className = "venue-popup-link";
    link.href = opts.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    // Static SVG icon — not author-controlled, safe to inject as HTML.
    link.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>';
    header.appendChild(link);
  }

  root.appendChild(header);

  if (opts.description) {
    const desc = document.createElement("div");
    desc.className = "venue-popup-desc";
    desc.textContent = opts.description;
    root.appendChild(desc);
  }

  return root;
}

const FILL_COLOR_EXPR = [
  "match",
  ["get", "kind"],
  "general",
  KIND_HEX.general,
  "stay",
  KIND_HEX.stay,
  "daytrip",
  KIND_HEX.daytrip,
  "avoid",
  KIND_HEX.avoid,
  /* default */ KIND_HEX.general,
] as unknown as mapboxgl.ExpressionSpecification;

const Globe: React.FC<GlobeProps> = ({
  targetCoordinates,
  venues,
  areas,
  cityCoordinates,
  onCityReady,
  pinnedAreaKey,
  onAreaFocus,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const venueMarkers = useRef<{ marker: mapboxgl.Marker; root: ReturnType<typeof createRoot> }[]>([]);
  const flyToTimeout = useRef<NodeJS.Timeout | null>(null);
  const revealTimers = useRef<NodeJS.Timeout[]>([]);
  const [isDark, setIsDark] = useState(getSystemDarkMode);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const handlePopupClose = useCallback(() => setSelectedVenue(null), []);
  const [mapReady, setMapReady] = useState(false);
  const currentCityKey = useRef<string | null>(null);

  // Race-safety: every city-entry increments; async callbacks capture and compare.
  const cityGen = useRef(0);

  // Area-layer state
  const areasRef = useRef<AreaCollection | null>(areas ?? null);
  areasRef.current = areas ?? null;
  const areaHandlersRef = useRef<{
    move: (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void;
    leave: () => void;
    click: (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => void;
    canvasClick: (e: mapboxgl.MapMouseEvent) => void;
  } | null>(null);
  const hoveredAreaKeyRef = useRef<string | null>(null);
  const areaPopupRef = useRef<mapboxgl.Popup | null>(null);
  const popupTargetRef = useRef<{ lng: number; lat: number } | null>(null);
  const popupAnimRef = useRef<number | null>(null);
  const reduceMotionRef = useRef(getReduceMotion());

  const isCityView = !!(venues && venues.length > 0 && cityCoordinates);
  const isCityViewRef = useRef(isCityView);
  isCityViewRef.current = isCityView;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;
  const pinnedAreaKeyRef = useRef<string | null>(pinnedAreaKey ?? null);
  pinnedAreaKeyRef.current = pinnedAreaKey ?? null;

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Listen for reduced-motion changes
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => {
      reduceMotionRef.current = e.matches;
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Layers to hide in globe overview (cause jitter during flyTo)
  const globeHideLayers = useRef(
    new Set([
      "national-park",
      "landuse",
      "waterway",
      "land-structure-polygon",
      "land-structure-line",
      "aeroway-polygon",
      "aeroway-line",
      "building",
      "tunnel-path-trail",
      "tunnel-path-cycleway-piste",
      "tunnel-path",
      "tunnel-steps",
      "tunnel-pedestrian",
      "tunnel-simple",
      "road-path-trail",
      "road-path-cycleway-piste",
      "road-path",
      "road-steps",
      "road-pedestrian",
      "road-simple",
      "road-rail",
      "bridge-path-trail",
      "bridge-path-cycleway-piste",
      "bridge-path",
      "bridge-steps",
      "bridge-pedestrian",
      "bridge-case-simple",
      "bridge-simple",
      "bridge-rail",
      "admin-1-boundary-bg",
      "admin-1-boundary",
    ]),
  );

  const applyStyleCustomizations = useCallback(
    (isDarkMode: boolean, showDetails: boolean) => {
      if (!map.current || !map.current.isStyleLoaded()) return;

      const layers = map.current.getStyle().layers;
      if (layers) {
        layers.forEach((layer) => {
          if (layer.type === "symbol") {
            map.current?.setLayoutProperty(layer.id, "text-field", "");
          }
          if (globeHideLayers.current.has(layer.id)) {
            map.current?.setLayoutProperty(
              layer.id,
              "visibility",
              showDetails ? "visible" : "none",
            );
          }
          if (!isDarkMode && layer.type === "background") {
            map.current?.setPaintProperty(layer.id, "background-color", "#EFEFEF");
          }
          if (!isDarkMode && layer.id.includes("land") && layer.type === "fill") {
            map.current?.setPaintProperty(layer.id, "fill-color", "#EFEFEF");
          }
        });
      }

      if (isDarkMode) {
        map.current.setFog({
          color: "#0A0B0B",
          "high-color": "#0A0B0B",
          "horizon-blend": showDetails ? 0.02 : 0.1,
          "space-color": "#0A0B0B",
          "star-intensity": showDetails ? 0 : 0.15,
        });
      } else {
        map.current.setFog({
          color: "#F9FAFB",
          "high-color": "#F9FAFB",
          "horizon-blend": showDetails ? 0.02 : 0.1,
          "space-color": "#F9FAFB",
          "star-intensity": 0,
        });
      }
    },
    [],
  );

  const findFirstSymbolLayerId = useCallback((): string | undefined => {
    const layers = map.current?.getStyle().layers;
    return layers?.find((l) => l.type === "symbol")?.id;
  }, []);

  const attachAreaLayers = useCallback(
    (collection: AreaCollection, isDarkMode: boolean) => {
      if (!map.current) return;
      if (map.current.getSource("areas")) return; // already attached

      const fillDefaultOpacity = isDarkMode ? 0.14 : 0.16;
      const fillHoverOpacity = isDarkMode ? 0.32 : 0.34;
      const lineOpacity = isDarkMode ? 0.85 : 0.7;
      const lineWidthDefault = isDarkMode ? 1.5 : 1.25;
      const lineWidthHover = isDarkMode ? 2.5 : 2.25;
      const reveal = !reduceMotionRef.current;

      map.current.addSource("areas", {
        type: "geojson",
        data: collection,
        promoteId: "_key",
      });

      const beforeId = findFirstSymbolLayerId();

      map.current.addLayer(
        {
          id: "areas-fill",
          type: "fill",
          source: "areas",
          paint: {
            "fill-color": FILL_COLOR_EXPR,
            "fill-opacity": reveal
              ? 0
              : [
                  "case",
                  ["boolean", ["feature-state", "hover"], false],
                  fillHoverOpacity,
                  fillDefaultOpacity,
                ],
            "fill-opacity-transition": { duration: 180, delay: 0 },
          },
        },
        beforeId,
      );

      map.current.addLayer(
        {
          id: "areas-line",
          type: "line",
          source: "areas",
          paint: {
            "line-color": FILL_COLOR_EXPR,
            "line-width": [
              "case",
              ["boolean", ["feature-state", "hover"], false],
              lineWidthHover,
              lineWidthDefault,
            ],
            "line-opacity": reveal ? 0 : lineOpacity,
            "line-opacity-transition": { duration: 600, delay: 200 },
            "line-blur": 0.5,
          },
        },
        beforeId,
      );

      // Staggered entrance — flip opacity to final after fitBounds settles.
      if (reveal) {
        const tid = setTimeout(() => {
          if (!map.current?.getLayer("areas-fill")) return;
          map.current.setPaintProperty("areas-fill", "fill-opacity", [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            fillHoverOpacity,
            fillDefaultOpacity,
          ]);
          map.current.setPaintProperty("areas-line", "line-opacity", lineOpacity);
        }, 1200);
        revealTimers.current.push(tid);
      }

      // Hover + click handlers
      const move = (
        e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
      ) => {
        if (!map.current?.getSource("areas")) return;
        const f = e.features?.[0];
        if (!f) return;
        const fid = typeof f.id === "string" ? f.id : null;
        if (!fid) return;

        // Suppress hover when a pinned area exists.
        if (pinnedAreaKeyRef.current) return;

        if (hoveredAreaKeyRef.current && hoveredAreaKeyRef.current !== fid) {
          map.current.setFeatureState(
            { source: "areas", id: hoveredAreaKeyRef.current },
            { hover: false },
          );
        }
        hoveredAreaKeyRef.current = fid;
        map.current.setFeatureState({ source: "areas", id: fid }, { hover: true });
        map.current.getCanvas().style.cursor = "pointer";

        const target = { lng: e.lngLat.lng, lat: e.lngLat.lat };
        popupTargetRef.current = target;

        if (!areaPopupRef.current) {
          areaPopupRef.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: "venue-mapbox-popup popup-passthrough",
            offset: 20,
            maxWidth: "280px",
          });
        }
        const af = f as unknown as AreaFeature;
        areaPopupRef.current
          .setDOMContent(
            buildPopupNode({
              title: af.properties.title,
              description: af.properties.description,
            }),
          )
          .setLngLat(reduceMotionRef.current ? target : areaPopupRef.current.getLngLat() ?? target)
          .addTo(map.current);

        if (!reduceMotionRef.current && popupAnimRef.current === null) {
          const tick = () => {
            const popup = areaPopupRef.current;
            const t = popupTargetRef.current;
            if (!popup || !t) {
              popupAnimRef.current = null;
              return;
            }
            const current = popup.getLngLat();
            popup.setLngLat({
              lng: current.lng + (t.lng - current.lng) * 0.18,
              lat: current.lat + (t.lat - current.lat) * 0.18,
            });
            popupAnimRef.current = requestAnimationFrame(tick);
          };
          popupAnimRef.current = requestAnimationFrame(tick);
        }
      };

      const leave = () => {
        if (!map.current?.getSource("areas")) return;
        if (hoveredAreaKeyRef.current && !pinnedAreaKeyRef.current) {
          map.current.setFeatureState(
            { source: "areas", id: hoveredAreaKeyRef.current },
            { hover: false },
          );
          hoveredAreaKeyRef.current = null;
          map.current.getCanvas().style.cursor = "";
        }
        if (popupAnimRef.current !== null) {
          cancelAnimationFrame(popupAnimRef.current);
          popupAnimRef.current = null;
        }
        if (!pinnedAreaKeyRef.current && areaPopupRef.current) {
          areaPopupRef.current.remove();
          areaPopupRef.current = null;
        }
      };

      const click = (
        e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] },
      ) => {
        const f = e.features?.[0];
        if (!f) return;
        const fid = typeof f.id === "string" ? f.id : null;
        if (!fid) return;
        e.preventDefault();
        onAreaFocus?.(fid);
      };

      const canvasClick = (e: mapboxgl.MapMouseEvent) => {
        if (e.defaultPrevented) return;
        if (!map.current?.getLayer("areas-fill")) return;
        const hits = map.current.queryRenderedFeatures(e.point, {
          layers: ["areas-fill"],
        });
        if (hits.length === 0 && pinnedAreaKeyRef.current) {
          onAreaFocus?.(null);
        }
      };

      map.current.on("mousemove", "areas-fill", move);
      map.current.on("mouseleave", "areas-fill", leave);
      map.current.on("click", "areas-fill", click);
      map.current.on("click", canvasClick);

      areaHandlersRef.current = { move, leave, click, canvasClick };
    },
    [findFirstSymbolLayerId, onAreaFocus],
  );

  const detachAreaLayers = useCallback(() => {
    if (!map.current) return;
    if (areaHandlersRef.current) {
      const { move, leave, click, canvasClick } = areaHandlersRef.current;
      map.current.off("mousemove", "areas-fill", move);
      map.current.off("mouseleave", "areas-fill", leave);
      map.current.off("click", "areas-fill", click);
      map.current.off("click", canvasClick);
      areaHandlersRef.current = null;
    }
    if (popupAnimRef.current !== null) {
      cancelAnimationFrame(popupAnimRef.current);
      popupAnimRef.current = null;
    }
    if (areaPopupRef.current) {
      areaPopupRef.current.remove();
      areaPopupRef.current = null;
    }
    hoveredAreaKeyRef.current = null;
    if (map.current.getLayer("areas-line")) map.current.removeLayer("areas-line");
    if (map.current.getLayer("areas-fill")) map.current.removeLayer("areas-fill");
    if (map.current.getSource("areas")) map.current.removeSource("areas");
  }, []);

  // Initialize map (once)
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    try {
      const style = isDark
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/light-v11";

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        projection: "globe",
        zoom: 1.5,
        center: [0, 20],
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
        style,
      });

      // HMR strand fix: ref survives unmount; reset so the next entry rebuilds.
      currentCityKey.current = null;

      if (map.current.isStyleLoaded()) {
        applyStyleCustomizations(isDarkRef.current, isCityViewRef.current);
        setMapReady(true);
      }
      map.current.on("style.load", () => {
        applyStyleCustomizations(isDarkRef.current, isCityViewRef.current);
        // Re-attach areas after a style swap if we're still in the same city view.
        if (isCityViewRef.current && areasRef.current) {
          attachAreaLayers(areasRef.current, isDarkRef.current);
        }
        setMapReady(true);
      });
    } catch (error) {
      console.error("Failed to initialize globe:", error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
      revealTimers.current.forEach(clearTimeout);
      revealTimers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update map style when color scheme changes
  useEffect(() => {
    if (!map.current) return;

    const style = isDark
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/light-v11";

    map.current.setStyle(style);
    map.current.once("style.load", () => {
      applyStyleCustomizations(isDarkRef.current, isCityViewRef.current);
      if (isCityViewRef.current && areasRef.current) {
        attachAreaLayers(areasRef.current, isDarkRef.current);
      }
    });
  }, [isDark, applyStyleCustomizations, attachAreaLayers]);

  // Toggle interactivity and layer visibility based on view mode
  useEffect(() => {
    if (!map.current) return;

    if (isCityView) {
      map.current.scrollZoom.enable();
      map.current.dragPan.enable();
      map.current.touchZoomRotate.enable();
      map.current.doubleClickZoom.enable();
    } else {
      map.current.scrollZoom.disable();
      map.current.dragPan.disable();
      map.current.touchZoomRotate.disable();
      map.current.doubleClickZoom.disable();
    }

    applyStyleCustomizations(isDark, isCityView);
  }, [isCityView, isDark, applyStyleCustomizations]);

  // Helper to clean up venue markers + reveal timers
  const clearVenueMarkers = useCallback(() => {
    venueMarkers.current.forEach(({ marker: m, root }) => {
      root.unmount();
      m.remove();
    });
    venueMarkers.current = [];
    revealTimers.current.forEach(clearTimeout);
    revealTimers.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    setSelectedVenue(null);
  }, []);

  // Derive a stable signature for areas so re-renders with same data don't re-fire the effect.
  const areasKey = areas
    ? areas.features.map((f) => f.properties._key).join("|")
    : "";

  // City view: fly to city and add venue markers + area layers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    if (!isCityView) {
      if (currentCityKey.current) {
        clearVenueMarkers();
        detachAreaLayers();
        currentCityKey.current = null;
        map.current.flyTo({
          center: [0, 20],
          zoom: 1.5,
          duration: reduceMotionRef.current ? 0 : 1500,
          essential: true,
        });
      }
      return;
    }

    const cityKey = `${cityCoordinates![0]},${cityCoordinates![1]}|${areasKey}`;
    if (currentCityKey.current === cityKey) return;

    clearVenueMarkers();
    detachAreaLayers();
    currentCityKey.current = cityKey;

    cityGen.current++;
    const myGen = cityGen.current;

    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    // Venue markers
    venues!.forEach((venue) => {
      if (!venue.coordinates || !map.current) return;

      const isFavourite = !!venue.favourite;
      const el = document.createElement("div");
      el.className = "venue-marker";
      el.style.opacity = "0";

      const root = createRoot(el);
      const displayTypes = venue.types || [];
      root.render(
        <div className="venue-marker-inner" title={venue.title}>
          {displayTypes.length > 0 ? (
            displayTypes.map((t) => {
              const Icon = typeIcons[t] || Landmark;
              return <Icon key={t} size={14} />;
            })
          ) : (
            <Landmark size={14} />
          )}
          {isFavourite && (
            <span className="venue-marker-fav">
              <Star size={10} fill="currentColor" />
            </span>
          )}
        </div>,
      );

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        // Clicking a venue clears any pinned area popup.
        if (pinnedAreaKeyRef.current) onAreaFocus?.(null);
        if (popupRef.current) {
          popupRef.current.off("close", handlePopupClose);
          popupRef.current.remove();
          popupRef.current = null;
        }
        setSelectedVenue((prev) => (prev?.title === venue.title ? null : venue));
      });

      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(venue.coordinates!)
        .addTo(map.current!);

      venueMarkers.current.push({ marker: m, root });
    });

    // Area layers
    if (areas && areas.features.length) {
      attachAreaLayers(areas, isDarkRef.current);
    }

    // Fit bounds to all venue + area coordinates
    const bounds = new mapboxgl.LngLatBounds();
    let hasBounds = false;
    venues!
      .filter((v) => v.coordinates)
      .forEach((v) => {
        bounds.extend(v.coordinates!);
        hasBounds = true;
      });
    if (areas) {
      areas.features.forEach((f) => {
        f.geometry.coordinates[0]?.forEach((pt) => {
          bounds.extend(pt as [number, number]);
          hasBounds = true;
        });
      });
    }

    if (hasBounds) {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const isSmall = vw < 640;
      const isPortrait = vh > vw;
      map.current.fitBounds(bounds, {
        padding: {
          top: isSmall ? 60 : vh * 0.2,
          bottom: isSmall ? 50 : vh * 0.15,
          left: isSmall ? (isPortrait ? 20 : 30) : vw * 0.05,
          right: isSmall ? (isPortrait ? 20 : 30) : vw * 0.05,
        },
        maxZoom: isSmall ? 16 : 15,
        duration: reduceMotionRef.current ? 0 : 2000,
        essential: true,
      });
    } else {
      map.current.flyTo({
        center: cityCoordinates!,
        zoom: 13,
        duration: reduceMotionRef.current ? 0 : 2000,
        curve: 1.5,
        essential: true,
      });
    }

    // Stagger-reveal venue markers
    const revealDelay = reduceMotionRef.current ? 0 : 1200;
    const stagger = reduceMotionRef.current ? 0 : 60;
    venueMarkers.current.forEach(({ marker: m }, i) => {
      const tid = setTimeout(() => {
        if (myGen !== cityGen.current) return;
        const el = m.getElement();
        el.style.opacity = "1";
        el.classList.add("venue-marker-revealed");
      }, revealDelay + i * stagger);
      revealTimers.current.push(tid);
    });

    map.current.once("moveend", () => {
      if (myGen !== cityGen.current) return;
      onCityReady?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, isCityView, cityCoordinates, areasKey]);

  // Venue popup
  useEffect(() => {
    if (!map.current) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (!selectedVenue?.coordinates) return;

    const mapsUrl =
      selectedVenue.googleMapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.location)}`;
    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "280px",
      offset: 20,
      className: "venue-mapbox-popup",
    })
      .setLngLat(selectedVenue.coordinates)
      .setDOMContent(
        buildPopupNode({
          title: selectedVenue.title,
          description: selectedVenue.description,
          link: mapsUrl,
        }),
      )
      .addTo(map.current);

    popup.on("close", handlePopupClose);
    popupRef.current = popup;
  }, [selectedVenue, handlePopupClose]);

  // Pinned area popup — driven by pinnedAreaKey prop (chip rail click OR polygon click).
  useEffect(() => {
    if (!map.current) return;

    if (!pinnedAreaKey || !areas) {
      // If unpinning AND no hover is happening, remove the popup.
      if (!hoveredAreaKeyRef.current && areaPopupRef.current) {
        areaPopupRef.current.remove();
        areaPopupRef.current = null;
      }
      // Clear any hover feature-state for the previously pinned area.
      return;
    }

    const feature = areas.features.find((f) => f.properties._key === pinnedAreaKey);
    if (!feature) return;

    const center = polygonCentroid(feature.geometry.coordinates as number[][][]);

    // Stop any in-flight rAF lerp — pinned snaps to centroid.
    if (popupAnimRef.current !== null) {
      cancelAnimationFrame(popupAnimRef.current);
      popupAnimRef.current = null;
    }

    if (!areaPopupRef.current) {
      areaPopupRef.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        className: "venue-mapbox-popup",
        offset: 20,
        maxWidth: "280px",
      });
      areaPopupRef.current.on("close", () => {
        if (pinnedAreaKeyRef.current) onAreaFocus?.(null);
      });
    }
    areaPopupRef.current
      .setDOMContent(
        buildPopupNode({
          title: feature.properties.title,
          description: feature.properties.description,
        }),
      )
      .setLngLat(center)
      .addTo(map.current);
  }, [pinnedAreaKey, areas, onAreaFocus]);

  // Escape key clears pinned area
  useEffect(() => {
    if (!pinnedAreaKey) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAreaFocus?.(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinnedAreaKey, onAreaFocus]);

  // Globe view: handle hover coordinate changes
  useEffect(() => {
    if (!map.current || isCityView) return;

    if (flyToTimeout.current) {
      clearTimeout(flyToTimeout.current);
      flyToTimeout.current = null;
    }

    if (targetCoordinates) {
      flyToTimeout.current = setTimeout(() => {
        if (!map.current) return;

        if (!marker.current) {
          const el = document.createElement("div");
          el.className = "globe-marker";
          el.innerHTML = `
            <div class="globe-marker-pulse"></div>
            <div class="globe-marker-dot"></div>
          `;
          marker.current = new mapboxgl.Marker({ element: el })
            .setLngLat(targetCoordinates)
            .addTo(map.current);
        } else {
          marker.current.setLngLat(targetCoordinates);
        }

        map.current.flyTo({
          center: targetCoordinates,
          zoom: 4,
          duration: reduceMotionRef.current ? 0 : 1500,
          curve: 1.2,
          essential: true,
          padding: { left: 0, right: window.innerWidth * 0.55, top: 0, bottom: 0 },
        });
      }, 150);
    } else {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
    }
  }, [targetCoordinates, isCityView]);

  return (
    <div
      ref={mapContainer}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 10,
        pointerEvents: isCityView ? "auto" : "none",
      }}
    />
  );
};

export default Globe;
