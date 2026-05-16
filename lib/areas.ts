import type { Polygon } from "geojson";
import type {
  AreaCollection,
  AreaFeature,
  AreaKind,
} from "../components/Globe/types";

const MAX_GEOJSON_BYTES = 200_000;
const MAX_VERTICES_PER_RING = 1000;
const MAX_RINGS = 10;
const MIN_VERTICES_PER_RING = 4;

const VALID_KINDS: ReadonlySet<AreaKind> = new Set([
  "general",
  "stay",
  "avoid",
  "daytrip",
]);

export interface ParseAreaResult {
  ok: boolean;
  geometry?: Polygon;
  error?: string;
}

export function parseAreaGeometry(raw: unknown): ParseAreaResult {
  if (typeof raw !== "string") return { ok: false, error: "Must be a string" };
  if (raw.length > MAX_GEOJSON_BYTES) {
    return { ok: false as const, error: "Polygon too large (>200KB)" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw, (key, value) =>
      key === "__proto__" || key === "constructor" || key === "prototype"
        ? undefined
        : value,
    );
  } catch {
    return { ok: false as const, error: "Invalid JSON" };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false as const, error: "Not a geometry object" };
  }

  const g = parsed as { type?: unknown; coordinates?: unknown };
  if (g.type !== "Polygon") {
    return { ok: false as const, error: "Must be GeoJSON Polygon" };
  }
  if (!Array.isArray(g.coordinates)) {
    return { ok: false as const, error: "Missing coordinates array" };
  }
  if (g.coordinates.length === 0 || g.coordinates.length > MAX_RINGS) {
    return { ok: false as const, error: `Rings must be 1..${MAX_RINGS}` };
  }

  for (const ring of g.coordinates) {
    if (!Array.isArray(ring) || ring.length < MIN_VERTICES_PER_RING) {
      return {
        ok: false,
        error: `Each ring needs at least ${MIN_VERTICES_PER_RING} points (closed)`,
      };
    }
    if (ring.length > MAX_VERTICES_PER_RING) {
      return {
        ok: false,
        error: `Ring exceeds ${MAX_VERTICES_PER_RING} vertices`,
      };
    }
    for (const pt of ring) {
      if (
        !Array.isArray(pt) ||
        pt.length < 2 ||
        typeof pt[0] !== "number" ||
        typeof pt[1] !== "number"
      ) {
        return {
          ok: false,
          error: "Coordinates must be [lng, lat] number pairs",
        };
      }
    }
    if (ringHasSelfIntersection(ring as [number, number][])) {
      return { ok: false as const, error: "Polygon edges cross (self-intersecting)" };
    }
  }

  return { ok: true as const, geometry: g as Polygon };
}

function ccw(
  p: [number, number],
  q: [number, number],
  r: [number, number],
): number {
  const v = (r[1] - p[1]) * (q[0] - p[0]) - (q[1] - p[1]) * (r[0] - p[0]);
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

function segmentsIntersect(
  a1: [number, number],
  a2: [number, number],
  b1: [number, number],
  b2: [number, number],
): boolean {
  return (
    ccw(b1, b2, a1) !== ccw(b1, b2, a2) &&
    ccw(a1, a2, b1) !== ccw(a1, a2, b2)
  );
}

// Closed ring: ring[0] === ring[n-1]. Edges are non-adjacent pairs.
// O(n²) over edges; n is capped at MAX_VERTICES_PER_RING (1000) so worst case ~1M comparisons.
function ringHasSelfIntersection(ring: [number, number][]): boolean {
  const edges = ring.length - 1;
  for (let i = 0; i < edges; i++) {
    const a1 = ring[i];
    const a2 = ring[i + 1];
    for (let j = i + 2; j < edges; j++) {
      // First and last edges share a vertex on closed rings — skip that pair.
      if (i === 0 && j === edges - 1) continue;
      const b1 = ring[j];
      const b2 = ring[j + 1];
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

interface RawArea {
  _key?: string;
  title?: string;
  description?: string;
  kind?: string;
  geojson?: string;
}

export interface BuildAreaCollectionResult {
  collection: AreaCollection | null;
  droppedCount: number;
}

export function buildAreaCollection(
  rawAreas: RawArea[] | undefined,
  slug: string,
): BuildAreaCollectionResult {
  const features: AreaFeature[] = [];
  let dropped = 0;

  (rawAreas ?? []).forEach((a, i) => {
    if (!a._key || !a.title || !a.description || !a.geojson) {
      console.warn(
        `[place-areas] ${slug} area[${i}] dropped: missing required fields`,
      );
      dropped++;
      return;
    }
    const result = parseAreaGeometry(a.geojson);
    if (!result.ok) {
      console.warn(`[place-areas] ${slug} area[${i}] dropped: ${result.error}`);
      dropped++;
      return;
    }
    const kind = VALID_KINDS.has(a.kind as AreaKind)
      ? (a.kind as AreaKind)
      : "general";
    features.push({
      type: "Feature",
      id: a._key,
      properties: {
        _key: a._key,
        title: a.title,
        description: a.description,
        kind,
      },
      geometry: result.geometry,
    });
  });

  return {
    collection: features.length
      ? { type: "FeatureCollection", features }
      : null,
    droppedCount: dropped,
  };
}
