export const APP_NAME = 'Linite';
export const APP_DESCRIPTION = 'A Ninite-style bulk package installer for Linux distributions';

export const SOURCE_PREFERENCES = ['auto', 'flatpak', 'native', 'snap'] as const;
export type SourcePreference = typeof SOURCE_PREFERENCES[number];

export const DISTRO_FAMILIES = ['debian', 'rhel', 'arch', 'suse', 'independent'] as const;
export type DistroFamily = typeof DISTRO_FAMILIES[number];

export const USER_ROLES = ['admin', 'superadmin'] as const;
export type UserRole = typeof USER_ROLES[number];

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
 * Timing configuration (in milliseconds)
 */
export const TIMEOUTS = {
  /** Debounce delay for search inputs */
  DEBOUNCE_SEARCH: 300,
  /** Delay between API rate-limited requests */
  RATE_LIMIT_DELAY: 100,
  /** Delay between icon downloads to avoid overwhelming server */
  ICON_DOWNLOAD_DELAY: 2500,
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
