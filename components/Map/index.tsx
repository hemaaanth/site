import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface Location {
  title: string;
  location: string;
  coordinates?: [number, number];
}

interface MapProps {
  locations: Location[];
  hoveredLocation?: Location | null;
  showUserLocation: boolean; // New prop to control user location display
}

const Map: React.FC<MapProps> = ({
  locations,
  hoveredLocation,
  showUserLocation,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ marker: mapboxgl.Marker; location: Location }[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const previousHover = useRef<Location | null>(null);
  const resetTimeout = useRef<NodeJS.Timeout | null>(null);

  // Add user location marker
  useEffect(() => {
    if (!map.current) return;

    if (showUserLocation) {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        console.log("Geolocation is not supported by your browser");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Create user marker only if it doesn't exist
          if (!userMarker.current) {
            userMarker.current = new mapboxgl.Marker({
              color: "#FFF", // red color
              scale: 0.5, // slightly smaller than location markers
            })
              .setLngLat([longitude, latitude])
              .addTo(map.current!);
          } else {
            // Update position if marker already exists
            userMarker.current.setLngLat([longitude, latitude]);
          }
        },
        (error) => {
          console.log("Error getting user location:", error);
        },
      );
    } else {
      // Remove user marker if the toggle is off
      userMarker.current?.remove();
      userMarker.current = null; // Reset the reference
    }

    return () => {
      // Do not remove the user marker on unmount
    };
  }, [showUserLocation]); // Add showUserLocation as a dependency

  // Initialize map and create markers
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      zoom: 12,
      attributionControl: false, // hide attribution button
      style: {
        version: 8,
        sources: {
          "mapbox-streets": {
            type: "vector",
            url: "mapbox://mapbox.mapbox-streets-v8",
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: {
              "background-color": "#111111",
            },
          },
          {
            id: "water",
            type: "fill",
            source: "mapbox-streets",
            "source-layer": "water",
            paint: {
              "fill-color": "#000000",
            },
          },
          {
            id: "roads",
            type: "line",
            source: "mapbox-streets",
            "source-layer": "road",
            paint: {
              "line-color": "#333333",
              "line-width": 0.5,
            },
          },
          {
            id: "admin",
            type: "line",
            source: "mapbox-streets",
            "source-layer": "admin",
            paint: {
              "line-color": "#222222",
              "line-width": 0.5,
            },
          },
        ],
      },
    });

    // Create markers for all locations
    locations.forEach((location) => {
      if (location.coordinates) {
        const marker = new mapboxgl.Marker({
          color: "#737373",
          scale: 0.8,
        })
          .setLngLat(location.coordinates)
          .addTo(map.current!);

        markers.current.push({ marker, location });
      }
    });

    // Initial fit bounds
    if (locations.length > 0 && locations[0].coordinates) {
      const bounds = new mapboxgl.LngLatBounds();
      locations.forEach((location) => {
        if (location.coordinates) {
          bounds.extend(location.coordinates);
        }
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

    // Capture markers in a local variable for cleanup
    const currentMarkers = markers.current;
    return () => {
      currentMarkers.forEach(({ marker }) => marker.remove());
      map.current?.remove();
    };
  }, [locations]); // Re-run effect when locations change

  // Handle hover state changes
  useEffect(() => {
    if (!map.current) return;

    markers.current.forEach(({ marker, location }) => {
      const isHovered =
        hoveredLocation?.coordinates?.[0] === location.coordinates?.[0] &&
        hoveredLocation?.coordinates?.[1] === location.coordinates?.[1];

      marker.getElement().style.color = isHovered ? "#2563eb" : "#3b82f6";
    });

    if (hoveredLocation?.coordinates) {
      // Clear any pending reset
      if (resetTimeout.current) {
        clearTimeout(resetTimeout.current);
        resetTimeout.current = null;
      }

      map.current.flyTo({
        center: hoveredLocation.coordinates,
        zoom: 14,
        duration: 700,
        curve: 1,
        speed: 1.2,
        essential: true,
      });
    } else if (previousHover.current) {
      // Set a timeout to reset the view
      resetTimeout.current = setTimeout(() => {
        if (locations.length > 0 && locations[0].coordinates) {
          const bounds = new mapboxgl.LngLatBounds();
          locations.forEach((location) => {
            if (location.coordinates) {
              bounds.extend(location.coordinates);
            }
          });
          map.current.fitBounds(bounds, {
            padding: 50,
            duration: 700,
            essential: true,
            curve: 1,
            speed: 1.2,
          });
        }
      }, 300); // 300ms delay before resetting
    }

    previousHover.current = hoveredLocation;
  }, [hoveredLocation, locations]);

  return <div ref={mapContainer} className="w-full h-[300px] rounded-lg" />;
};

export default Map;
