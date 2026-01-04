/**
 * useAppMetadata Hook
 * Extracts and computes metadata from app packages
 * Replaces complex inline calculations in components
 */

import { useMemo } from 'react';
import { getScreenshots, parsePackageMetadata } from '@/lib/package-metadata';
import type { AppWithRelations } from '@/types';

export interface AppMetadata {
  /** Unique screenshots from all packages */
  screenshots: string[];
  /** Average package size in bytes */
  averageSize: number;
  /** Unique maintainers across packages */
  maintainers: string[];
  /** Latest version across packages */
  latestVersion: string | null;
  /** Unique licenses across packages */
  licenses: string[];
  /** Most recent release date */
  latestReleaseDate: string | null;
}

/**
 * Extract and compute metadata from app packages
 */
export function useAppMetadata(app: AppWithRelations): AppMetadata {
  return useMemo(() => {
    const packages = app.packages;

    // Extract unique screenshots
    const screenshots = packages
      .flatMap((pkg) => getScreenshots(pkg.metadata))
      .filter((url, index, self) => self.indexOf(url) === index);

    // Calculate average size
    const packagesWithSize = packages.filter((pkg) => pkg.size && pkg.size > 0);
    const totalSize = packagesWithSize.reduce((sum, pkg) => sum + (pkg.size || 0), 0);
    const averageSize = packagesWithSize.length > 0 ? totalSize / packagesWithSize.length : 0;

    // Extract unique maintainers
    const maintainers = packages
      .map((pkg) => pkg.maintainer)
      .filter((m, i, arr) => m && arr.indexOf(m) === i) as string[];

    // Find latest version (assuming semantic versioning, fallback to string comparison)
    const versions = packages
      .map((pkg) => pkg.version)
      .filter((v): v is string => Boolean(v));
    const latestVersion = versions.length > 0 ? versions.sort().reverse()[0] : null;

    // Extract unique licenses
    const licenses = packages
      .map((pkg) => {
        const metadata = parsePackageMetadata(pkg.metadata);
        return metadata.license;
      })
      .filter((l, i, arr) => l && arr.indexOf(l) === i) as string[];

    // Find most recent release date
    const releaseDates = packages
      .map((pkg) => {
        const metadata = parsePackageMetadata(pkg.metadata);
        return metadata.releaseDate;
      })
      .filter((d): d is string => Boolean(d))
      .sort()
      .reverse();
    const latestReleaseDate = releaseDates.length > 0 ? releaseDates[0] : null;

    return {
      screenshots,
      averageSize,
      maintainers,
      latestVersion,
      licenses,
      latestReleaseDate,
    };
  }, [app.packages]);
}
