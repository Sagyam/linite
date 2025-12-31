/**
 * Winget API client via winget.run
 * Documentation: https://docs.winget.run/
 * API: https://api.winget.run/
 */

import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

const WINGET_API_BASE = 'https://api.winget.run';
const searchCache = new SimpleCache<PackageSearchResult[]>(15); // 15 minute cache
const metadataCache = new SimpleCache<PackageMetadata>(15); // 15 minute cache

interface WingetPackage {
  Id: string;
  Name: string;
  Publisher: string;
  Description?: string;
  Homepage?: string;
  License?: string;
  LicenseUrl?: string;
  Tags?: string[];
  Versions?: Array<{
    Version: string;
    Installers?: Array<{
      Architecture: string;
      InstallerType: string;
      Scope?: string;
    }>;
  }>;
  LatestVersion?: {
    Version: string;
  };
}

interface WingetSearchResponse {
  Packages: WingetPackage[];
}

/**
 * Search for packages on winget.run
 */
export async function searchWinget(query: string): Promise<PackageSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const cacheKey = `winget:search:${query.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(`${WINGET_API_BASE}/v2/packages`);
    url.searchParams.set('query', query);
    url.searchParams.set('take', '50');

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Winget API error: ${response.status} ${response.statusText}`);
    }

    const data: WingetSearchResponse = await response.json();

    const results: PackageSearchResult[] = (data.Packages || []).map((pkg) => ({
      identifier: pkg.Id,
      name: pkg.Name,
      summary: pkg.Description,
      version: pkg.LatestVersion?.Version || pkg.Versions?.[0]?.Version,
      homepage: pkg.Homepage,
      license: pkg.License,
      maintainer: pkg.Publisher,
      source: 'winget' as const,
    }));

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Winget search error:', error);
    throw new Error(
      `Failed to search Winget: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get detailed metadata for a specific package
 */
export async function getWingetPackageMetadata(packageId: string): Promise<PackageMetadata | null> {
  if (!packageId || packageId.trim().length === 0) {
    throw new Error('Package ID is required');
  }

  const cacheKey = `winget:package:${packageId}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${WINGET_API_BASE}/v2/packages/${encodeURIComponent(packageId)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Winget API error: ${response.status} ${response.statusText}`);
    }

    const pkg: WingetPackage = await response.json();

    const metadata: PackageMetadata = {
      identifier: pkg.Id,
      name: pkg.Name,
      summary: pkg.Description,
      description: pkg.Description,
      version: pkg.LatestVersion?.Version || pkg.Versions?.[0]?.Version,
      homepage: pkg.Homepage,
      license: pkg.License,
      maintainer: pkg.Publisher,
      source: 'winget' as const,
      metadata: {
        licenseUrl: pkg.LicenseUrl,
        tags: pkg.Tags,
        installers: pkg.Versions?.[0]?.Installers,
      },
    };

    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('Winget metadata fetch error:', error);
    throw new Error(
      `Failed to fetch Winget package metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a package exists on Winget
 */
export async function checkWingetAvailability(packageId: string): Promise<boolean> {
  try {
    const metadata = await getWingetPackageMetadata(packageId);
    return metadata !== null;
  } catch (error) {
    console.error('Winget availability check error:', error);
    return false;
  }
}

/**
 * Clear the Winget cache
 */
export function clearWingetCache(): void {
  searchCache.clear();
  metadataCache.clear();
}
