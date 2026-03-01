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

/** Online = last activity within this many minutes. Keep short so offline shows quickly. */
export const ONLINE_THRESHOLD_MINUTES = 2;

/**
 * Returns true if the user is considered "online" based on last_seen_at
 * (within the given threshold in minutes). Uses a short default so users
 * who close the tab are shown offline within ~2 minutes.
 */
export function isOnline(
  lastSeenAt: string | null | undefined,
  thresholdMinutes = ONLINE_THRESHOLD_MINUTES
): boolean {
  if (!lastSeenAt) return false;
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  return diff >= 0 && diff < thresholdMinutes * 60 * 1000;
}
