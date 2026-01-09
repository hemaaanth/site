import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
// CSS is imported globally in _app.tsx

interface GlobeProps {
  targetCoordinates?: [number, number] | null;
}

const getSystemDarkMode = () => {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const Globe: React.FC<GlobeProps> = ({ targetCoordinates }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const flyToTimeout = useRef<NodeJS.Timeout | null>(null);
  const [isDark, setIsDark] = useState(getSystemDarkMode);

  // Listen for system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const applyStyleCustomizations = (isDarkMode: boolean) => {
    if (!map.current) return;

    const layers = map.current.getStyle().layers;
    if (layers) {
      layers.forEach((layer) => {
        // Remove all text labels but keep icons/symbols
        if (layer.type === "symbol") {
          map.current?.setLayoutProperty(layer.id, "text-field", "");
        }

        // Darken land in light mode for better contrast with sky
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
        "horizon-blend": 0.1,
        "space-color": "#0A0B0B",
        "star-intensity": 0.15,
      });
    } else {
      map.current.setFog({
        color: "#F9FAFB",
        "high-color": "#F9FAFB",
        "horizon-blend": 0.1,
        "space-color": "#F9FAFB",
        "star-intensity": 0,
      });
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (map.current) return; // Prevent re-initialization

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
        style,
      });

      map.current.on("style.load", () => {
        applyStyleCustomizations(isDark);
      });

      // Also apply immediately if style is already loaded (cached)
      if (map.current.isStyleLoaded()) {
        applyStyleCustomizations(isDark);
      }
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

    const applyStyles = () => applyStyleCustomizations(isDark);
    map.current.once("style.load", applyStyles);

    // Also check immediately in case style loaded from cache
    setTimeout(() => {
      if (map.current?.isStyleLoaded()) {
        applyStyles();
      }
    }, 100);
  }, [isDark]);

  // Handle coordinate changes - fly to target and show marker
  useEffect(() => {
    if (!map.current) return;

    // Clear any pending flyTo
    if (flyToTimeout.current) {
      clearTimeout(flyToTimeout.current);
      flyToTimeout.current = null;
    }

    if (targetCoordinates) {
      // Small delay before flying to prevent jitter when moving quickly between items
      flyToTimeout.current = setTimeout(() => {
        if (!map.current) return;

        // Add or update marker
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
      // Just remove the marker, but keep the current view
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
    }
  }, [targetCoordinates]);

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
        pointerEvents: 'none',
      }}
    />
  );
};

export default Globe;
