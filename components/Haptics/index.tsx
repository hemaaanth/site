"use client";

import { useRef, useEffect, useCallback } from "react";
import { WebHaptics, defaultPatterns } from "web-haptics";

type HapticInput = Parameters<WebHaptics["trigger"]>[0];
type TriggerOptions = Parameters<WebHaptics["trigger"]>[1];

interface UseHapticsOptions {
  debug?: boolean;
  showSwitch?: boolean;
}

/**
 * React hook for haptic feedback on mobile devices.
 * Based on web-haptics library.
 */
export function useHaptics(options?: UseHapticsOptions) {
  const hapticsRef = useRef<WebHaptics | null>(null);

  useEffect(() => {
    hapticsRef.current = new WebHaptics(options);
    return () => {
      hapticsRef.current?.destroy();
      hapticsRef.current = null;
    };
  }, []);

  useEffect(() => {
    hapticsRef.current?.setDebug(options?.debug ?? false);
  }, [options?.debug]);

  useEffect(() => {
    hapticsRef.current?.setShowSwitch(options?.showSwitch ?? false);
  }, [options?.showSwitch]);

  const trigger = useCallback(
    (input?: HapticInput, triggerOptions?: TriggerOptions) => {
      return hapticsRef.current?.trigger(input, triggerOptions);
    },
    []
  );

  const cancel = useCallback(() => {
    return hapticsRef.current?.cancel();
  }, []);

  const isSupported = WebHaptics.isSupported;

  return { trigger, cancel, isSupported };
}

export { defaultPatterns };
