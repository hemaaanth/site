import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AreaCollection, Venue } from "./types";

interface GlobeState {
  /** Hover target for globe view (places index) */
  targetCoordinates: [number, number] | null;
  /** Venue markers for city view */
  venues: Venue[] | null;
  /** Area polygons for city view */
  areas: AreaCollection | null;
  /** City center for fly-to */
  cityCoordinates: [number, number] | null;
  /** Called when fly-to-city completes */
  onCityReady: (() => void) | null;
  /** Currently pinned area's _key (from chip-rail click or polygon tap) */
  pinnedAreaKey: string | null;
}

interface EnterCityViewOpts {
  readonly venues: Venue[];
  readonly cityCoordinates: [number, number];
  readonly areas?: AreaCollection | null;
  readonly onReady?: () => void;
}

interface GlobeContextValue extends GlobeState {
  setTargetCoordinates: (coords: [number, number] | null) => void;
  enterCityView: (opts: EnterCityViewOpts) => void;
  exitCityView: () => void;
  /** Pin an area open (drives the popup); pass null to clear. */
  focusArea: (key: string | null) => void;
}

const GlobeContext = createContext<GlobeContextValue | null>(null);

const INITIAL_STATE: GlobeState = {
  targetCoordinates: null,
  venues: null,
  areas: null,
  cityCoordinates: null,
  onCityReady: null,
  pinnedAreaKey: null,
};

export function GlobeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GlobeState>(INITIAL_STATE);

  const setTargetCoordinates = useCallback((coords: [number, number] | null) => {
    setState((prev) => ({ ...prev, targetCoordinates: coords }));
  }, []);

  const enterCityView = useCallback((opts: EnterCityViewOpts) => {
    setState({
      targetCoordinates: null,
      venues: opts.venues,
      areas: opts.areas ?? null,
      cityCoordinates: opts.cityCoordinates,
      onCityReady: opts.onReady ?? null,
      pinnedAreaKey: null,
    });
  }, []);

  const exitCityView = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const focusArea = useCallback((key: string | null) => {
    setState((prev) => ({ ...prev, pinnedAreaKey: key }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setTargetCoordinates,
      enterCityView,
      exitCityView,
      focusArea,
    }),
    [state, setTargetCoordinates, enterCityView, exitCityView, focusArea],
  );

  return <GlobeContext.Provider value={value}>{children}</GlobeContext.Provider>;
}

export function useGlobe() {
  const ctx = useContext(GlobeContext);
  if (!ctx) throw new Error("useGlobe must be used within GlobeProvider");
  return ctx;
}
