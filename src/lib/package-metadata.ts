/**
 * Package Metadata Utilities
 * Type-safe helpers for working with package metadata
 */

/**
 * Stored package metadata structure
 * This represents the JSON stored in the database metadata field
 */
export interface StoredPackageMetadata {
  license?: string;
  screenshots?: string[];
  categories?: string[];
  releaseDate?: string;
  description?: string;
  summary?: string;
  homepage?: string;
  iconUrl?: string;
  scriptUrl?: {
    linux?: string;
    windows?: string;
    macos?: string;
  };
  [key: string]: unknown; // Allow additional properties
}

/**
 * Safely parse package metadata from unknown value
 * Handles both JSON strings and objects
 *
 * @param metadata - Raw metadata from database (unknown type)
 * @returns Parsed metadata with type safety
 */
export function parsePackageMetadata(metadata: unknown): StoredPackageMetadata {
  // Return empty object for null/undefined
  if (!metadata) {
    return {};
  }

  // Parse JSON string
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return parsed as StoredPackageMetadata;
    } catch {
      return {};
    }
  }

  // Return object as-is
  if (typeof metadata === 'object') {
    return metadata as StoredPackageMetadata;
  }

  // Fallback for unexpected types
  return {};
}

/**
 * Get license from package metadata
 */
export function getLicense(metadata: unknown): string | null {
  const parsed = parsePackageMetadata(metadata);
  return parsed.license || null;
}

/**
 * Get screenshots from package metadata
 */
export function getScreenshots(metadata: unknown): string[] {
  const parsed = parsePackageMetadata(metadata);
  return Array.isArray(parsed.screenshots) ? parsed.screenshots : [];
}

/**
 * Get categories from package metadata
 */
export function getCategories(metadata: unknown): string[] {
  const parsed = parsePackageMetadata(metadata);
  return Array.isArray(parsed.categories) ? parsed.categories : [];
}

/**
 * Get homepage from package metadata
 */
export function getHomepage(metadata: unknown): string | null {
  const parsed = parsePackageMetadata(metadata);
  return parsed.homepage || null;
}

/**
 * Get icon URL from package metadata
 */
export function getIconUrl(metadata: unknown): string | null {
  const parsed = parsePackageMetadata(metadata);
  return parsed.iconUrl || null;
}
