import type { PackageMetadata } from '@/types/entities';

// Re-export for convenience
export type { PackageMetadata };

/**
 * Interface for package refresh strategies
 * Each source type (Flatpak, Snap, AUR) implements this interface
 */
export interface RefreshStrategy {
  /**
   * Fetch metadata for a package
   * @param identifier - The package identifier
   * @returns Package metadata or null if not found
   */
  getMetadata(identifier: string): Promise<PackageMetadata | null>;

  /**
   * Check if a package is available
   * @param identifier - The package identifier
   * @returns True if package exists, false otherwise
   */
  checkAvailability(identifier: string): Promise<boolean>;
}
