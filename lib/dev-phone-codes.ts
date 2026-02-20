/**
 * In-memory store for verification codes in development.
 * Used when DB is unavailable or for quick dev testing.
 * Map<phone, { code, expiresAt }>
 */
export const devPhoneCodes = new Map<
  string,
  { code: string; expiresAt: number }
>();
