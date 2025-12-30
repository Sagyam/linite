/**
 * Snapcraft API client
 * Documentation: https://api.snapcraft.io/docs/
 */

import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

const SNAPCRAFT_API_BASE = 'https://api.snapcraft.io/v2';
const searchCache = new SimpleCache<PackageSearchResult[]>(15); // 15 minute cache
const metadataCache = new SimpleCache<PackageMetadata>(15); // 15 minute cache

interface SnapSearchResponse {
  results: Array<{
    snap: {
      name: string;
      title: string;
      summary: string;
      description?: string;
      publisher?: {
        'display-name'?: string;
        username?: string;
      };
      media?: Array<{
        type: string;
        url: string;
        width?: number;
        height?: number;
      }>;
      license?: string;
      website?: string;
      'download-size'?: number;
    };
  }>;
}

interface SnapInfoResponse {
  'channel-map': Array<{
    channel: {
      name: string;
      track: string;
      risk: string;
    };
    version: string;
    'released-at': string;
  }>;
  snap: {
    name: string;
    title: string;
    summary: string;
    description: string;
    publisher?: {
      'display-name'?: string;
      username?: string;
    };
    media?: Array<{
      type: string;
      url: string;
      width?: number;
      height?: number;
    }>;
    license?: string;
    website?: string;
    categories?: Array<{ name: string }>;
    'download-size'?: number;
  };
}

/**
 * Search for snaps on Snapcraft
 */
export async function searchSnapcraft(query: string): Promise<PackageSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const cacheKey = `snapcraft:search:${query.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = new URL(`${SNAPCRAFT_API_BASE}/snaps/find`);
    url.searchParams.set('q', query);
    url.searchParams.set('scope', 'wide');

    const response = await fetch(url.toString(), {
      headers: {
        'Snap-Device-Series': '16',
      },
    });

    if (!response.ok) {
      throw new Error(`Snapcraft API error: ${response.status} ${response.statusText}`);
    }

    const data: SnapSearchResponse = await response.json();

    const results: PackageSearchResult[] = data.results.map((result) => {
      const snap = result.snap;
      const icon = snap.media?.find((m) => m.type === 'icon')?.url;

      return {
        identifier: snap.name,
        name: snap.title || snap.name,
        summary: snap.summary,
        description: snap.description,
        homepage: snap.website,
        iconUrl: icon,
        license: snap.license,
        maintainer: snap.publisher?.['display-name'] || snap.publisher?.username,
        downloadSize: snap['download-size'],
        source: 'snap' as const,
      };
    });

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Snapcraft search error:', error);
    throw new Error(
      `Failed to search Snapcraft: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get detailed metadata for a specific snap
 */
export async function getSnapcraftPackageMetadata(snapName: string): Promise<PackageMetadata | null> {
  if (!snapName || snapName.trim().length === 0) {
    throw new Error('Snap name is required');
  }

  const cacheKey = `snapcraft:snap:${snapName}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${SNAPCRAFT_API_BASE}/snaps/info/${encodeURIComponent(snapName)}`, {
      headers: {
        'Snap-Device-Series': '16',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Snapcraft API error: ${response.status} ${response.statusText}`);
    }

    const data: SnapInfoResponse = await response.json();
    const snap = data.snap;
    const icon = snap.media?.find((m) => m.type === 'icon')?.url;
    const screenshots = snap.media?.filter((m) => m.type === 'screenshot').map((m) => m.url) || [];

    // Get the latest stable version
    const stableChannel = data['channel-map'].find((c) => c.channel.risk === 'stable');

    const metadata: PackageMetadata = {
      identifier: snap.name,
      name: snap.title || snap.name,
      summary: snap.summary,
      description: snap.description,
      version: stableChannel?.version,
      homepage: snap.website,
      iconUrl: icon,
      license: snap.license,
      maintainer: snap.publisher?.['display-name'] || snap.publisher?.username,
      downloadSize: snap['download-size'],
      categories: snap.categories?.map((c) => c.name),
      screenshots,
      releaseDate: stableChannel?.['released-at'],
      source: 'snap' as const,
      metadata: {
        channels: data['channel-map'],
      },
    };

    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('Snapcraft metadata fetch error:', error);
    throw new Error(
      `Failed to fetch Snapcraft package metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if a snap exists on Snapcraft
 */
export async function checkSnapcraftAvailability(snapName: string): Promise<boolean> {
  try {
    const metadata = await getSnapcraftPackageMetadata(snapName);
    return metadata !== null;
  } catch (error) {
    console.error('Snapcraft availability check error:', error);
    return false;
  }
}

/**
 * Clear the Snapcraft cache
 */
export function clearSnapcraftCache(): void {
  searchCache.clear(); metadataCache.clear();
}
