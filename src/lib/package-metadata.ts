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

