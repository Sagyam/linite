/**
 * Revalidation times for ISR (Incremental Static Regeneration)
 * These can be overridden by environment variables
 */

// Parse environment variables with defaults
export const REVALIDATE_PUBLIC = process.env.REVALIDATE_PUBLIC
  ? parseInt(process.env.REVALIDATE_PUBLIC, 10)
  : 3600; // 1 hour default

export const REVALIDATE_ADMIN = process.env.REVALIDATE_ADMIN
  ? parseInt(process.env.REVALIDATE_ADMIN, 10)
  : 60; // 1 minute default
