export const APP_NAME = 'Linite';
export const APP_DESCRIPTION = 'A Ninite-style bulk package installer for Linux distributions';
export const APP_WEBSITE_URL = 'https://linite.sagyamthapa.com.np';

export const SOURCE_PREFERENCES = ['auto', 'flatpak', 'native', 'snap'] as const;
export type SourcePreference = typeof SOURCE_PREFERENCES[number];

export const DISTRO_FAMILIES = ['debian', 'rhel', 'arch', 'suse', 'independent'] as const;
export type DistroFamily = typeof DISTRO_FAMILIES[number];

export const USER_ROLES = ['admin', 'superadmin'] as const;
export type UserRole = typeof USER_ROLES[number];

/**
 * Timing configuration (in milliseconds)
 */
export const TIMEOUTS = {
  /** Debounce delay for search inputs */
  DEBOUNCE_SEARCH: 300,
  /** Minimum delay between icon downloads (will use random delay in range) */
  ICON_DOWNLOAD_MIN_DELAY: 200,
  /** Maximum delay between icon downloads (will use random delay in range) */
  ICON_DOWNLOAD_MAX_DELAY: 1000,
} as const;

/**
 * Pagination configuration
 */
export const PAGINATION = {
  /** Default number of items per page for infinite scroll */
  DEFAULT_LIMIT: 20,
  /** Maximum number of items that can be fetched at once */
  MAX_LIMIT: 100,
  /** Limit for selection drawer and modals */
  SELECTION_LIMIT: 100,
} as const;

/**
 * Intersection Observer configuration
 */
export const INTERSECTION_OBSERVER = {
  /** Percentage of visibility before triggering (0.0 to 1.0) */
  THRESHOLD: 0.1,
  /** Margin around the root element for early triggering */
  ROOT_MARGIN: '100px',
} as const;

/**
 * Retry configuration for icon downloads
 */
export const RETRY_CONFIG = {
  /** Maximum number of retry attempts for failed downloads */
  MAX_RETRIES: 5,
  /** Initial delay before first retry (in milliseconds) */
  INITIAL_RETRY_DELAY: 2000,
  /** Maximum delay between retries (in milliseconds) */
  MAX_RETRY_DELAY: 30000,
  /** Multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Random jitter factor (0-1) to add randomness to retry delays */
  JITTER_FACTOR: 0.3,
} as const;

/**
 * Image configuration
 */
export const IMAGES = {
  /** Fallback icon path for apps/collections */
  FALLBACK_ICON: '/fallback-app-icon.svg',
} as const;

/**
 * Icon sizes in pixels
 */
export const ICON_SIZES = {
  XS: 16,
  SM: 32,
  MD: 48,
  LG: 64,
  XL: 96,
} as const;
