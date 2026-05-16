// Custom Sanity Studio input for drawing a single GeoJSON Polygon on a Mapbox map.
//
// Contract:
//  - Field is `type: 'text'` storing a stringified GeoJSON Polygon geometry (no Feature wrapper).
//  - One polygon per row enforced via draw.create handler.
//  - Mapbox + mapbox-gl-draw mount lazily on geocode success. Studio-only — CSS imports here
//    are tree-shaken out of the public /places/* bundle by Next per-route splitting.
//  - On unmount: map.remove() is called; subsequent in-flight tile loads log a benign AbortError
//    to the console — expected, ignore.
//  - Geocoding debounces title/geocodeHint changes (800ms) with a cancellation token; re-centers
//    on change only if no polygon is currently drawn (preserves author work).

import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { Box, Card, Flex, Stack, Text } from "@sanity/ui";
import { set, unset, useFormValue, type StringInputProps } from "sanity";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

import { parseAreaGeometry } from "../../lib/areas";

interface GeocodeResult {
  center: [number, number];
  placeName: string;
}

async function geocodeCity(query: string): Promise<GeocodeResult | null> {
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality&limit=1`,
    );
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature?.center) return null;
    return {
      center: feature.center as [number, number],
      placeName: feature.place_name as string,
    };
  } catch {
    return null;
  }
}

export function AreaPolygonInput(props: StringInputProps) {
  const { value, onChange } = props;

  const titleRaw = useFormValue(["title"]);
  const hintRaw = useFormValue(["geocodeHint"]);
  const title = typeof titleRaw === "string" ? titleRaw : "";
  const hint = typeof hintRaw === "string" ? hintRaw : "";
  const queryString = (hint || title).trim();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const removedRef = useRef(false);
  // Latest value, kept fresh for the once-on-mount rehydrate.
  const valueRef = useRef<string | undefined>(value);
  valueRef.current = value;

  const [geocoded, setGeocoded] = useState<GeocodeResult | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);

  // Validate current value for live author feedback (catches malformed values from imports or
  // hand-edits that bypassed Studio's save-time Rule.custom).
  useEffect(() => {
    if (!value) {
      setParseError(null);
      return;
    }
    const r = parseAreaGeometry(value);
    if (!r.ok) {
      setParseError(r.error);
      return;
    }
    setParseError(null);
  }, [value]);

  // Geocode with debounce + cancellation. Re-runs on title/hint change AND on retry.
  useEffect(() => {
    if (!queryString) {
      setGeocoded(null);
      setGeocodeError(null);
      return;
    }
    let canceled = false;
    const tid = setTimeout(async () => {
      setIsGeocoding(true);
      setGeocodeError(null);
      const result = await geocodeCity(queryString);
      if (canceled) return;
      setIsGeocoding(false);
      if (!result) {
        setGeocodeError(`Geocoding failed for "${queryString}"`);
        return;
      }
      setGeocoded(result);
    }, 800);
    return () => {
      canceled = true;
      clearTimeout(tid);
    };
  }, [queryString, retryNonce]);

  // Mount Mapbox + Draw once a geocode center is available.
  useEffect(() => {
    if (!containerRef.current || !geocoded) return;
    if (mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
    removedRef.current = false;

    const isDark =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: isDark
        ? "mapbox://styles/mapbox/dark-v11"
        : "mapbox://styles/mapbox/light-v11",
      center: geocoded.center,
      zoom: 11,
      attributionControl: false,
    });
    mapRef.current = map;

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: { polygon: true, trash: true },
      defaultMode: "simple_select",
    });
    map.addControl(draw as unknown as mapboxgl.IControl);
    drawRef.current = draw;

    // Tooltip-on-hover for draw control buttons (P2-009).
    const tooltipTimer = setTimeout(() => {
      if (removedRef.current) return;
      const root = containerRef.current;
      if (!root) return;
      const polyBtn = root.querySelector<HTMLButtonElement>(".mapbox-gl-draw_polygon");
      const trashBtn = root.querySelector<HTMLButtonElement>(".mapbox-gl-draw_trash");
      if (polyBtn) {
        polyBtn.title =
          "Draw polygon: click to start, click for each corner, double-click to finish. Esc cancels.";
      }
      if (trashBtn) {
        trashBtn.title = "Delete the selected polygon.";
      }
    }, 100);

    map.on("load", () => {
      if (removedRef.current) return;
      const v = valueRef.current;
      if (!v) return;
      const r = parseAreaGeometry(v);
      if (!r.ok) return;
      const featureId = "current";
      draw.add({
        type: "Feature",
        id: featureId,
        properties: {},
        geometry: r.geometry,
      });
      // Fit to the rehydrated polygon and enter vertex-edit mode (P2-005).
      const bbox = new mapboxgl.LngLatBounds();
      r.geometry.coordinates[0]?.forEach((pt) => {
        bbox.extend(pt as [number, number]);
      });
      map.fitBounds(bbox, { padding: 48, duration: 0 });
      setTimeout(() => {
        if (removedRef.current) return;
        try {
          draw.changeMode("direct_select", { featureId });
        } catch {
          /* best-effort */
        }
      }, 50);
    });

    const handleCreate = (e: { features: Array<{ id: string | number; geometry: object }> }) => {
      if (removedRef.current) return;
      const all = draw.getAll().features;
      if (all.length > 1) {
        const newId = e.features[0]?.id;
        const toDelete = all
          .filter((f) => f.id !== newId)
          .map((f) => String(f.id));
        if (toDelete.length) draw.delete(toDelete);
      }
      const geom = e.features[0]?.geometry;
      if (geom) onChange(set(JSON.stringify(geom)));
    };
    const handleUpdate = (e: { features: Array<{ geometry: object }> }) => {
      if (removedRef.current) return;
      const geom = e.features[0]?.geometry;
      if (geom) onChange(set(JSON.stringify(geom)));
    };
    const handleDelete = () => {
      if (removedRef.current) return;
      onChange(unset());
    };

    // mapbox-gl-draw events are fired on the map but not typed in mapbox-gl's types.
    (map as unknown as { on: (e: string, h: (...args: unknown[]) => void) => void }).on(
      "draw.create",
      handleCreate as (...args: unknown[]) => void,
    );
    (map as unknown as { on: (e: string, h: (...args: unknown[]) => void) => void }).on(
      "draw.update",
      handleUpdate as (...args: unknown[]) => void,
    );
    (map as unknown as { on: (e: string, h: (...args: unknown[]) => void) => void }).on(
      "draw.delete",
      handleDelete as (...args: unknown[]) => void,
    );

    return () => {
      removedRef.current = true;
      clearTimeout(tooltipTimer);
      drawRef.current = null;
      mapRef.current = null;
      map.remove();
    };
    // We only want to remount the map when the geocode result changes (different city).
    // Title/hint edits route through the geocoded state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocoded]);

  // Re-center on geocode change ONLY if no polygon is drawn yet (preserves author work).
  useEffect(() => {
    if (!mapRef.current || !geocoded) return;
    if (drawRef.current?.getAll().features.length) return;
    mapRef.current.flyTo({ center: geocoded.center, zoom: 11, duration: 600 });
  }, [geocoded]);

  const handleRetry = useCallback(() => setRetryNonce((n) => n + 1), []);

  return (
    <Stack space={2}>
      {!queryString && (
        <Card padding={3} tone="caution">
          <Text size={1}>Add a city title above before drawing an area.</Text>
        </Card>
      )}

      {queryString && isGeocoding && !geocoded && (
        <Card padding={3}>
          <Text size={1}>Geocoding &ldquo;{queryString}&rdquo;…</Text>
        </Card>
      )}

      {queryString && geocodeError && (
        <Card padding={3} tone="critical">
          <Flex justify="space-between" align="center">
            <Text size={1}>{geocodeError}</Text>
            <button
              type="button"
              onClick={handleRetry}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                border: "1px solid currentColor",
                borderRadius: 4,
                background: "transparent",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              Retry
            </button>
          </Flex>
        </Card>
      )}

      {geocoded && (
        <Text size={0} muted>
          Centered on: {geocoded.placeName}
        </Text>
      )}

      {parseError && (
        <Card padding={3} tone="critical">
          <Text size={1}>Polygon error: {parseError}</Text>
        </Card>
      )}

      <Box
        style={{
          height: 360,
          borderRadius: 6,
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.1)",
        }}
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </Box>
    </Stack>
  );
}

export default AreaPolygonInput;
