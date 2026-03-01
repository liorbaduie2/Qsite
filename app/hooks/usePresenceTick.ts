"use client";

import { useState, useEffect } from "react";

/**
 * Returns a value that updates every 30 seconds. Use in components that display
 * online status so that isOnline(lastSeenAt) is re-evaluated and the UI updates
 * when users go offline (after ONLINE_THRESHOLD_MINUTES).
 */
export function usePresenceTick(): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((n) => n + 1);
    }, 30 * 1000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  return tick;
}
