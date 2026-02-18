import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Lazily creates the Supabase admin client. Must be called at request time,
 * not at module load, so env vars are available during Vercel build.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key);
}
