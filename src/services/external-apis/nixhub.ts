/**
 * NixHub API client
 * Documentation: https://www.jetify.com/docs/nixhub/
 */

import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

const NIXHUB_API_BASE = 'https://www.nixhub.io/v2';
const searchCache = new SimpleCache<PackageSearchResult[]>(15); // 15 minute cache
const metadataCache = new SimpleCache<PackageMetadata>(15); // 15 minute cache

interface NixHubSearchResponse {
  query: string;
  total_results: number;
  results: Array<{
    name: string;
    summary?: string;
    last_updated?: string;
  }>;
}

interface NixHubPackageResponse {
  name: string;
  summary?: string;
  description?: string;
  homepage_url?: string;
  license?: string;
  releases?: Array<{
    version: string;
    last_updated: string;
    platforms?: string[];
    outputs?: string[];
  }>;
}

/**
 * Search for packages on NixHub
 */
export async function searchNixHub(query: string): Promise<PackageSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const cacheKey = `nixhub:search:${query.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${NIXHUB_API_BASE}/search?q=${encodeURIComponent(query)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('NixHub API rate limit exceeded. Please try again later.');
      }
      throw new Error(`NixHub API error: ${response.status} ${response.statusText}`);
    }

    const data: NixHubSearchResponse = await response.json();

    const results: PackageSearchResult[] = data.results.map((result) => ({
      identifier: result.name,
      name: result.name,
      summary: result.summary,
      source: 'nixhub' as const,
    }));

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('NixHub search error:', error);
    throw new Error(
      `Failed to search NixHub: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get detailed metadata for a specific NixHub package
 */
export async function getNixHubPackageMetadata(name: string): Promise<PackageMetadata | null> {
  if (!name || name.trim().length === 0) {
    throw new Error('Package name is required');
  }

  const cacheKey = `nixhub:package:${name}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${NIXHUB_API_BASE}/pkg?name=${encodeURIComponent(name)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      if (response.status === 429) {
        throw new Error('NixHub API rate limit exceeded. Please try again later.');
      }
      throw new Error(`NixHub API error: ${response.status} ${response.statusText}`);
    }

    const data: NixHubPackageResponse = await response.json();

    // Extract latest release info
    const latestRelease = data.releases?.[0];

    const metadata: PackageMetadata = {
      identifier: data.name,
      name: data.name,
      summary: data.summary,
      description: data.description,
      version: latestRelease?.version,
      homepage: data.homepage_url,
      license: data.license,
      releaseDate: latestRelease?.last_updated,
      source: 'nixhub' as const,
      metadata: {
        platforms: latestRelease?.platforms,
        outputs: latestRelease?.outputs,
      },
    };

    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('NixHub metadata fetch error:', error);
    throw new Error(
      `Failed to fetch NixHub package metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a package exists on NixHub
 */
export async function checkNixHubAvailability(name: string): Promise<boolean> {
  try {
    const metadata = await getNixHubPackageMetadata(name);
    return metadata !== null;
  } catch (error) {
    console.error('NixHub availability check error:', error);
    return false;
  }
}

/**
 * Clear the NixHub cache
 */
export function clearNixHubCache(): void {
  searchCache.clear();
  metadataCache.clear();
}
