import type { Feature, FeatureCollection, Polygon } from "geojson";
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

export type AreaKind = "general" | "stay" | "avoid" | "daytrip";

// Color is a function of kind — one decision per area, not two.
export const KIND_HEX: Record<AreaKind, string> = {
  general: "#6366f1", // indigo — neutral
  stay: "#10b981", // emerald — positive ("stay here")
  daytrip: "#f59e0b", // amber — warm ("worth a trip")
  avoid: "#f43f5e", // rose — warning ("avoid")
};

export interface AreaProperties {
  _key: string;
  title: string;
  description: string;
  kind: AreaKind;
}

export type AreaFeature = Feature<Polygon, AreaProperties>;
export type AreaCollection = FeatureCollection<Polygon, AreaProperties>;
