/**
 * Homebrew API client
 * Documentation: https://formulae.brew.sh/docs/api/
 * Note: Homebrew doesn't have a search API. We fetch all formulae/casks and search locally.
 */

import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

const HOMEBREW_API_BASE = 'https://formulae.brew.sh/api';
const allFormulaeCache = new SimpleCache<HomebrewFormula[]>(60); // 60 minute cache for all formulae
const allCasksCache = new SimpleCache<HomebrewFormula[]>(60); // 60 minute cache for all casks
const metadataCache = new SimpleCache<PackageMetadata>(15); // 15 minute cache

interface HomebrewFormula {
  name: string;
  full_name: string;
  tap?: string;
  desc?: string;
  license?: string;
  homepage?: string;
  versions?: {
    stable?: string;
    head?: string;
  };
  urls?: {
    stable?: {
      url: string;
    };
  };
  revision?: number;
  installed?: Array<{
    version: string;
  }>;
  linked_keg?: string;
  pinned?: boolean;
  outdated?: boolean;
}

/**
 * Fetch all Homebrew formulae (cached)
 */
async function fetchAllFormulae(): Promise<HomebrewFormula[]> {
  const cacheKey = 'homebrew:all-formulae';
  const cached = allFormulaeCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${HOMEBREW_API_BASE}/formula.json`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Homebrew API error: ${response.status} ${response.statusText}`);
    }

    const formulae: HomebrewFormula[] = await response.json();
    allFormulaeCache.set(cacheKey, formulae);
    return formulae;
  } catch (error) {
    console.error('Homebrew formulae fetch error:', error);
    return [];
  }
}

/**
 * Fetch all Homebrew casks (cached)
 */
async function fetchAllCasks(): Promise<HomebrewFormula[]> {
  const cacheKey = 'homebrew:all-casks';
  const cached = allCasksCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${HOMEBREW_API_BASE}/cask.json`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Homebrew API error: ${response.status} ${response.statusText}`);
    }

    const casks: HomebrewFormula[] = await response.json();
    allCasksCache.set(cacheKey, casks);
    return casks;
  } catch (error) {
    console.error('Homebrew casks fetch error:', error);
    return [];
  }
}

/**
 * Search for Homebrew formulae and casks
 */
export async function searchHomebrew(query: string): Promise<PackageSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  try {
    // Fetch both formulae and casks in parallel
    const [formulae, casks] = await Promise.all([
      fetchAllFormulae(),
      fetchAllCasks(),
    ]);

    const allPackages = [...formulae, ...casks];
    const searchTerm = query.toLowerCase();

    // Filter packages by search term
    const matches = allPackages.filter((pkg) => {
      if (!pkg || !pkg.name) return false;

      const nameMatch = pkg.name.toLowerCase().includes(searchTerm) ||
                       pkg.full_name?.toLowerCase().includes(searchTerm);
      const descMatch = pkg.desc?.toLowerCase().includes(searchTerm);
      return nameMatch || descMatch;
    });

    // Limit to top 50 results
    const limitedMatches = matches.slice(0, 50);

    const results: PackageSearchResult[] = limitedMatches.map((pkg) => ({
      identifier: pkg.name,
      name: pkg.full_name || pkg.name,
      summary: pkg.desc,
      version: pkg.versions?.stable,
      homepage: pkg.homepage,
      license: pkg.license,
      source: 'homebrew' as const,
    }));

    return results;
  } catch (error) {
    console.error('Homebrew search error:', error);
    throw new Error(
      `Failed to search Homebrew: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get detailed metadata for a specific Homebrew formula
 */
export async function getHomebrewPackageMetadata(packageName: string): Promise<PackageMetadata | null> {
  if (!packageName || packageName.trim().length === 0) {
    throw new Error('Package name is required');
  }

  const cacheKey = `homebrew:package:${packageName}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Try formula first
    let response = await fetch(`${HOMEBREW_API_BASE}/formula/${encodeURIComponent(packageName)}.json`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    // If formula not found, try cask
    if (!response.ok && response.status === 404) {
      response = await fetch(`${HOMEBREW_API_BASE}/cask/${encodeURIComponent(packageName)}.json`, {
        headers: {
          'Accept': 'application/json',
        },
      });
    }

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Homebrew API error: ${response.status} ${response.statusText}`);
    }

    const pkg: HomebrewFormula = await response.json();

    const metadata: PackageMetadata = {
      identifier: pkg.name,
      name: pkg.full_name || pkg.name,
      summary: pkg.desc,
      description: pkg.desc,
      version: pkg.versions?.stable,
      homepage: pkg.homepage,
      license: pkg.license,
      source: 'homebrew' as const,
      metadata: {
        tap: pkg.tap,
        revision: pkg.revision,
        downloadUrl: pkg.urls?.stable?.url,
      },
    };

    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('Homebrew metadata fetch error:', error);
    throw new Error(
      `Failed to fetch Homebrew package metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a package exists in Homebrew
 */
export async function checkHomebrewAvailability(packageName: string): Promise<boolean> {
  try {
    const metadata = await getHomebrewPackageMetadata(packageName);
    return metadata !== null;
  } catch (error) {
    console.error('Homebrew availability check error:', error);
    return false;
  }
}

/**
 * Clear the Homebrew cache
 */
export function clearHomebrewCache(): void {
  allFormulaeCache.clear();
  allCasksCache.clear();
  metadataCache.clear();
}