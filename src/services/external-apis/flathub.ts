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
  summary: string;
  description?: string;
  projectLicense?: string;
  homepageUrl?: string;
  downloadFlatpakRefUrl?: string;
  iconDesktopUrl?: string;
  iconMobileUrl?: string;
  currentReleaseVersion?: string;
  currentReleaseDate?: string;
  categories?: Array<{ name: string }>;
  screenshots?: Array<{
    imgMobileUrl?: string;
    imgDesktopUrl?: string;
    thumbUrl?: string;
  }>;
  developerName?: string;
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

    const metadata: PackageMetadata = {
      identifier: data.id,
      name: data.name,
      summary: data.summary,
      description: data.description,
      version: data.currentReleaseVersion,
      homepage: data.homepageUrl,
      iconUrl: data.iconDesktopUrl || data.iconMobileUrl,
      license: data.projectLicense,
      maintainer: data.developerName,
      categories: data.categories?.map((c) => c.name),
      screenshots: data.screenshots?.map(
        (s) => s.imgDesktopUrl || s.imgMobileUrl || s.thumbUrl || ''
      ).filter(Boolean),
      releaseDate: data.currentReleaseDate,
      source: 'flatpak' as const,
      metadata: {
        downloadUrl: data.downloadFlatpakRefUrl,
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
