"use client";

import { useEffect, useState } from "react";

/**
 * Returns true only if loading has been active for at least `delayMs`.
 * This prevents skeletons from flashing on very fast responses.
 */
export function useDelayedSkeleton(isLoading: boolean, delayMs = 180) {
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSkeleton(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      // Only show skeleton if still loading after the delay
      if (isLoading) {
        setShowSkeleton(true);
      }
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isLoading, delayMs]);

  return showSkeleton;
}

