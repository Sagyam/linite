/**
 * Flathub API client
 * Documentation: https://flathub.org/api/v2/docs
 */

import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

const FLATHUB_API_BASE = 'https://flathub.org/api/v2';
const searchCache = new SimpleCache<PackageSearchResult[]>(15); // 15 minute cache
const metadataCache = new SimpleCache<PackageMetadata>(15); // 15 minute cache

interface FlathubSearchResponse {
  hits: Array<{
    app_id: string;
    name: string;
    summary: string;
    keywords?: string[];
    icon?: string;
  }>;
  query: string;
}

interface FlathubAppData {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  project_license?: string;
  license?: string;
  urls?: {
    homepage?: string;
  };
  icon?: string;
  developer_name?: string;
  categories?: string[];
  screenshots?: Array<{
    default?: boolean | null;
    caption?: string | null;
    sizes: Array<{
      width: string;
      height: string;
      scale: string;
      src: string;
    }>;
  }>;
  releases?: Array<{
    version?: string;
    timestamp?: number;
    description?: string;
  }>;
}

/**
 * Search for apps on Flathub
 */
export async function searchFlathub(query: string): Promise<PackageSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const cacheKey = `flathub:search:${query.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${FLATHUB_API_BASE}/search/${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Flathub API error: ${response.status} ${response.statusText}`);
    }

    const data: FlathubSearchResponse = await response.json();

    const results: PackageSearchResult[] = data.hits.map((hit) => ({
      identifier: hit.app_id,
      name: hit.name,
      summary: hit.summary,
      iconUrl: hit.icon,
      source: 'flatpak' as const,
    }));

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Flathub search error:', error);
    throw new Error(
      `Failed to search Flathub: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get detailed metadata for a specific Flathub app
 */
export async function getFlathubAppMetadata(appId: string): Promise<PackageMetadata | null> {
  if (!appId || appId.trim().length === 0) {
    throw new Error('App ID is required');
  }

  const cacheKey = `flathub:app:${appId}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${FLATHUB_API_BASE}/appstream/${encodeURIComponent(appId)}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Flathub API error: ${response.status} ${response.statusText}`);
    }

    const data: FlathubAppData = await response.json();

    // Extract latest release info
    const latestRelease = data.releases?.[0];

    // Extract screenshots - get the largest size for each screenshot
    const screenshots = (data.screenshots
      ?.map(screenshot => {
        // Skip screenshots without sizes array
        if (!screenshot.sizes || screenshot.sizes.length === 0) {
          return null;
        }
        const largestSize = screenshot.sizes.reduce((largest, current) => {
          const currentArea = parseInt(current.width) * parseInt(current.height);
          const largestArea = parseInt(largest.width) * parseInt(largest.height);
          return currentArea > largestArea ? current : largest;
        });
        return largestSize.src;
      })
      .filter((url): url is string => Boolean(url)) || []) as string[];

    const metadata: PackageMetadata = {
      identifier: data.id,
      name: data.name,
      summary: data.summary,
      description: data.description,
      version: latestRelease?.version,
      homepage: data.urls?.homepage,
      iconUrl: data.icon,
      license: data.project_license || data.license,
      maintainer: data.developer_name,
      categories: data.categories,
      screenshots,
      releaseDate: latestRelease?.timestamp ? new Date(latestRelease.timestamp * 1000).toISOString() : undefined,
      source: 'flatpak' as const,
      metadata: {
        kudos: (data as any).kudos,
        keywords: (data as any).keywords,
      },
    };

    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('Flathub metadata fetch error:', error);
    throw new Error(
      `Failed to fetch Flathub app metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if an app exists on Flathub
 */
export async function checkFlathubAvailability(appId: string): Promise<boolean> {
  try {
    const metadata = await getFlathubAppMetadata(appId);
    return metadata !== null;
  } catch (error) {
    console.error('Flathub availability check error:', error);
    return false;
  }
}

/**
 * Clear the Flathub cache
 */
export function clearFlathubCache(): void {
  searchCache.clear(); metadataCache.clear();
}
