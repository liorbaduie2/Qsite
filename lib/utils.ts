import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format timestamp: now, X sec, X min, X hours, X days (1–6), or date (7+ days).
 * Uses Hebrew labels for relative times.
 */
export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 10) return "הרגע";
  if (diffSec < 60) return `לפני ${diffSec} שניות`;
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return date.toLocaleDateString("he-IL");
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Online = last activity within this many seconds. ~10s keeps status accurate with 5–10s delay. */
export const ONLINE_THRESHOLD_SECONDS = 10;

/**
 * Returns true if the user is considered "online" based on last_seen_at
 * (within the given threshold in seconds). Uses a short default so status
 * updates within ~5–10 seconds when users go offline.
 */
export function isOnline(
  lastSeenAt: string | null | undefined,
  thresholdSeconds = ONLINE_THRESHOLD_SECONDS,
): boolean {
  if (!lastSeenAt) return false;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  return diff >= 0 && diff < thresholdSeconds * 1000;
}
