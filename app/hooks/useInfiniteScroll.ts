"use client";

import { useEffect, useRef } from "react";

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  rootMargin?: string;
  threshold?: number;
  /** When false, observer is not attached (e.g. panel closed). Set true when scroll container is mounted. */
  enabled?: boolean;
}

/**
 * Sets up IntersectionObserver on a sentinel element inside a scroll container.
 * When the sentinel becomes visible (user scrolls near bottom), calls loadMore if hasMore && !loading.
 * @param scrollContainerRef - ref attached to the scrollable div
 * @param sentinelRef - ref attached to a div at the bottom of the list (sentinel)
 * @param options - hasMore, loading, loadMore
 */
export function useInfiniteScroll(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  sentinelRef: React.RefObject<HTMLDivElement | null>,
  options: UseInfiniteScrollOptions
) {
  const { hasMore, loading, loadMore, rootMargin = "100px", threshold = 0, enabled = true } = options;
  const loadMoreRef = useRef(loadMore);
  const hasMoreRef = useRef(hasMore);
  const loadingRef = useRef(loading);
  loadMoreRef.current = loadMore;
  hasMoreRef.current = hasMore;
  loadingRef.current = loading;

  useEffect(() => {
    if (!enabled) return;
    const container = scrollContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!container || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        if (!hasMoreRef.current || loadingRef.current) return;
        loadMoreRef.current();
      },
      { root: container, rootMargin, threshold }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [enabled, scrollContainerRef, sentinelRef, rootMargin, threshold]);
}
