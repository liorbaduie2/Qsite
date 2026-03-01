import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  thresholdSeconds = ONLINE_THRESHOLD_SECONDS
): boolean {
  if (!lastSeenAt) return false;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  return diff >= 0 && diff < thresholdSeconds * 1000;
}
