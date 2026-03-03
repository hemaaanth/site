"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import { WebHaptics, defaultPatterns } from "web-haptics";

// HapticInput can be number, string, pattern array, or preset object
type HapticInput = Parameters<WebHaptics["trigger"]>[0];

interface HapticsContextType {
  trigger: (input?: HapticInput) => void;
  isSupported: boolean;
}

const HapticsContext = createContext<HapticsContextType>({
  trigger: () => {},
  isSupported: false,
});

export function useHaptics() {
  return useContext(HapticsContext);
}

interface HapticsProviderProps {
  children: ReactNode;
}

export function HapticsProvider({ children }: HapticsProviderProps) {
  const [haptics, setHaptics] = useState<WebHaptics | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Check if vibration API is supported (typically mobile only)
    const supported = "vibrate" in navigator;
    setIsSupported(supported);
    
    if (supported) {
      const instance = new WebHaptics();
      setHaptics(instance);
      
      return () => {
        instance.destroy();
      };
    }
  }, []);

  const trigger = useCallback(
    (input?: HapticInput) => {
      if (haptics) {
        haptics.trigger(input);
      }
    },
    [haptics]
  );

  return (
    <HapticsContext.Provider value={{ trigger, isSupported }}>
      {children}
    </HapticsContext.Provider>
  );
}

// Re-export patterns for easy use
export { defaultPatterns };
export type { HapticInput };
