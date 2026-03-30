import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Venue } from "./index";

interface GlobeState {
  /** Hover target for globe view (places index) */
  targetCoordinates: [number, number] | null;
  /** Venue markers for city view */
  venues: Venue[] | null;
  /** City center for fly-to */
  cityCoordinates: [number, number] | null;
  /** Called when fly-to-city completes */
  onCityReady: (() => void) | null;
}

interface GlobeContextValue extends GlobeState {
  setTargetCoordinates: (coords: [number, number] | null) => void;
  enterCityView: (venues: Venue[], cityCoordinates: [number, number], onReady?: () => void) => void;
  exitCityView: () => void;
}

const GlobeContext = createContext<GlobeContextValue | null>(null);

export function GlobeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GlobeState>({
    targetCoordinates: null,
    venues: null,
    cityCoordinates: null,
    onCityReady: null,
  });

  const setTargetCoordinates = useCallback((coords: [number, number] | null) => {
    setState(prev => ({ ...prev, targetCoordinates: coords }));
  }, []);

  const enterCityView = useCallback((venues: Venue[], cityCoordinates: [number, number], onReady?: () => void) => {
    setState({
      targetCoordinates: null,
      venues,
      cityCoordinates,
      onCityReady: onReady || null,
    });
  }, []);

  const exitCityView = useCallback(() => {
    setState({
      targetCoordinates: null,
      venues: null,
      cityCoordinates: null,
      onCityReady: null,
    });
  }, []);

  const value = useMemo(() => ({
    ...state,
    setTargetCoordinates,
    enterCityView,
    exitCityView,
  }), [state, setTargetCoordinates, enterCityView, exitCityView]);

  return (
    <GlobeContext.Provider value={value}>
      {children}
    </GlobeContext.Provider>
  );
}

export function useGlobe() {
  const ctx = useContext(GlobeContext);
  if (!ctx) throw new Error("useGlobe must be used within GlobeProvider");
  return ctx;
}
