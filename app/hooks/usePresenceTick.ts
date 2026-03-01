"use client";

import { useState, useEffect } from "react";

/** Interval (ms) for re-evaluating online status so UI updates within ~5–10s when users go offline. */
const PRESENCE_TICK_MS = 5 * 1000; // 5 seconds

/**
 * Returns a value that updates every 5 seconds. Use in components that display
 * online status so that isOnline(lastSeenAt) is re-evaluated and the aura updates
 * within ~5–10 seconds when users go offline.
 */
export function usePresenceTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((n) => n + 1);
    }, PRESENCE_TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return tick;
}
