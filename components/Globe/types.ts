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

export type AreaColor = "indigo" | "rose" | "emerald" | "amber" | "fuchsia";
export type AreaKind = "general" | "stay" | "avoid" | "daytrip";

export const AREA_HEX: Record<AreaColor, string> = {
  indigo: "#6366f1",
  rose: "#f43f5e",
  emerald: "#10b981",
  amber: "#f59e0b",
  fuchsia: "#d946ef",
};

export interface AreaProperties {
  _key: string;
  title: string;
  description: string;
  kind: AreaKind;
  color: AreaColor;
}

export type AreaFeature = Feature<Polygon, AreaProperties>;
export type AreaCollection = FeatureCollection<Polygon, AreaProperties>;
