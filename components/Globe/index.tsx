import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot } from "react-dom/client";
import {
  UtensilsCrossed,
  Beer,
  Martini,
  Wine,
  Landmark,
  Store,
  BedDouble,
  Coffee,
  Briefcase,
  PartyPopper,
  Star,
} from "lucide-react";
import type { PlaceType } from "../Places";

export interface Venue {
  title: string;
  location: string;
  description: string;
  types: PlaceType[];
  favourite?: boolean;
  coordinates?: [number, number] | null;
  googleMapsUrl?: string;
}

interface GlobeProps {
  targetCoordinates?: [number, number] | null;
  venues?: Venue[] | null;
  cityCoordinates?: [number, number] | null;
  onCityReady?: (() => void) | null;
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

const Globe: React.FC<GlobeProps> = ({ targetCoordinates, venues, cityCoordinates, onCityReady }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const venueMarkers = useRef<{ marker: mapboxgl.Marker; root: ReturnType<typeof createRoot> }[]>([]);
  const flyToTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isDark, setIsDark] = useState(getSystemDarkMode);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const handlePopupClose = useCallback(() => setSelectedVenue(null), []);
  const [mapReady, setMapReady] = useState(false);
  // Track which city's venues are currently rendered to avoid re-adding
  const currentCityKey = useRef<string | null>(null);

  const isCityView = !!(venues && venues.length > 0 && cityCoordinates);
  const isCityViewRef = useRef(isCityView);
  isCityViewRef.current = isCityView;
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Layers to hide in globe overview (cause jitter during flyTo)
  const globeHideLayers = useRef(new Set([
    "national-park", "landuse", "waterway", "land-structure-polygon", "land-structure-line",
    "aeroway-polygon", "aeroway-line", "building",
    "tunnel-path-trail", "tunnel-path-cycleway-piste", "tunnel-path", "tunnel-steps",
    "tunnel-pedestrian", "tunnel-simple",
    "road-path-trail", "road-path-cycleway-piste", "road-path", "road-steps",
    "road-pedestrian", "road-simple", "road-rail",
    "bridge-path-trail", "bridge-path-cycleway-piste", "bridge-path", "bridge-steps",
    "bridge-pedestrian", "bridge-case-simple", "bridge-simple", "bridge-rail",
    "admin-1-boundary-bg", "admin-1-boundary",
  ]));

  const applyStyleCustomizations = useCallback((isDarkMode: boolean, showDetails: boolean) => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const layers = map.current.getStyle().layers;
    if (layers) {
      layers.forEach((layer) => {
        // Remove all text labels
        if (layer.type === "symbol") {
          map.current?.setLayoutProperty(layer.id, "text-field", "");
        }

        // In city view, restore all detail layers; in globe view, hide them
        if (globeHideLayers.current.has(layer.id)) {
          map.current?.setLayoutProperty(layer.id, "visibility", showDetails ? "visible" : "none");
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

      if (map.current.isStyleLoaded()) {
        applyStyleCustomizations(isDarkRef.current, isCityViewRef.current);
        setMapReady(true);
      }
      map.current.on("style.load", () => {
        applyStyleCustomizations(isDarkRef.current, isCityViewRef.current);
        setMapReady(true);
      });
    } catch (error) {
      console.error("Failed to initialize globe:", error);
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
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
    });
  }, [isDark]);

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

    // Re-apply style customizations to show/hide detail layers
    applyStyleCustomizations(isDark, isCityView);
  }, [isCityView, isDark, applyStyleCustomizations]);

  // Helper to clean up venue markers
  const clearVenueMarkers = useCallback(() => {
    venueMarkers.current.forEach(({ marker: m, root }) => {
      root.unmount();
      m.remove();
    });
    venueMarkers.current = [];
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }
    setSelectedVenue(null);
  }, []);

  // City view: fly to city and add venue markers
  useEffect(() => {
    if (!map.current || !mapReady) return;

    if (!isCityView) {
      // Leaving city view — clean up markers and zoom out
      if (currentCityKey.current) {
        clearVenueMarkers();
        currentCityKey.current = null;
        // Fly back to globe overview
        map.current.flyTo({
          center: [0, 20],
          zoom: 1.5,
          duration: 1500,
          essential: true,
        });
      }
      return;
    }

    // Compute a key for this city to detect changes
    const cityKey = `${cityCoordinates![0]},${cityCoordinates![1]}`;
    if (currentCityKey.current === cityKey) return; // Same city, skip

    // Clean up previous city's markers
    clearVenueMarkers();
    currentCityKey.current = cityKey;

    // Remove the globe hover marker if present
    if (marker.current) {
      marker.current.remove();
      marker.current = null;
    }

    // Add markers immediately but hidden — they'll animate in during the fly
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
          {displayTypes.length > 0 ? displayTypes.map(t => {
            const Icon = typeIcons[t] || Landmark;
            return <Icon key={t} size={14} />;
          }) : <Landmark size={14} />}
          {isFavourite && (
            <span className="venue-marker-fav">
              <Star size={10} fill="currentColor" />
            </span>
          )}
        </div>
      );

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (popupRef.current) {
          popupRef.current.off("close", handlePopupClose);
          popupRef.current.remove();
          popupRef.current = null;
        }
        setSelectedVenue(prev => prev?.title === venue.title ? null : venue);
      });

      const m = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat(venue.coordinates!)
        .addTo(map.current!);

      venueMarkers.current.push({ marker: m, root });
    });

    // Fit bounds to all venue coordinates
    const venuesWithCoords = venues!.filter(v => v.coordinates);
    if (venuesWithCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      venuesWithCoords.forEach(v => bounds.extend(v.coordinates!));
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
        duration: 2000,
        essential: true,
      });
    } else {
      map.current.flyTo({
        center: cityCoordinates!,
        zoom: 13,
        duration: 2000,
        curve: 1.5,
        essential: true,
      });
    }

    // Stagger-reveal markers partway through the fly animation
    const revealDelay = 1200; // start revealing at ~60% of 2s fly
    const stagger = 60; // ms between each marker
    venueMarkers.current.forEach(({ marker: m }, i) => {
      setTimeout(() => {
        const el = m.getElement();
        el.style.opacity = "1";
        el.classList.add("venue-marker-revealed");
      }, revealDelay + i * stagger);
    });

    map.current.once("moveend", () => {
      onCityReady?.();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, isCityView, cityCoordinates]);

  // Show/hide popup for selected venue
  useEffect(() => {
    if (!map.current) return;

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (!selectedVenue?.coordinates) return;

    const mapsUrl = selectedVenue.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.location)}`;

    const html = `
      <div class="venue-popup">
        <div class="venue-popup-header">
          <div class="venue-popup-title">${selectedVenue.title.replace(/</g, '&lt;')}</div>
          <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="venue-popup-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
          </a>
        </div>
        ${selectedVenue.description ? `<div class="venue-popup-desc">${selectedVenue.description.replace(/</g, '&lt;')}</div>` : ''}
      </div>
    `;

    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "280px",
      offset: 20,
      className: "venue-mapbox-popup",
    })
      .setLngLat(selectedVenue.coordinates)
      .setHTML(html)
      .addTo(map.current);

    popup.on("close", handlePopupClose);
    popupRef.current = popup;
  }, [selectedVenue, handlePopupClose]);

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
          duration: 1500,
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
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 10,
        pointerEvents: isCityView ? 'auto' : 'none',
      }}
    />
  );
};

export default Globe;
