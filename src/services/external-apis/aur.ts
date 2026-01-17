import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

const AUR_RPC_BASE = 'https://aur.archlinux.org/rpc';

interface AURResponse {
  version: number;
  type: 'search' | 'info' | 'error';
  resultcount: number;
  results: AURPackage[];
  error?: string;
}

interface AURPackage {
  ID: number;
  Name: string;
  PackageBaseID: number;
  PackageBase: string;
  Version: string;
  Description: string;
  URL?: string;
  NumVotes: number;
  Popularity: number;
  OutOfDate?: number | null;
  Maintainer?: string;
  FirstSubmitted: number;
  LastModified: number;
  URLPath: string;
  License?: string[];
  Keywords?: string[];
  Depends?: string[];
  MakeDepends?: string[];
  OptDepends?: string[];
  Conflicts?: string[];
  Provides?: string[];
  Replaces?: string[];
}

const searchCache = new SimpleCache<PackageSearchResult[]>(15);
const metadataCache = new SimpleCache<PackageMetadata>(15);

export async function searchAUR(query: string): Promise<PackageSearchResult[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query is required');
  }

  const cacheKey = `aur:search:${query.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(AUR_RPC_BASE);
  url.searchParams.set('v', '5');
  url.searchParams.set('type', 'search');
  url.searchParams.set('arg', query);
  url.searchParams.set('by', 'name-desc');

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AUR API error: ${response.status} ${response.statusText}`);
    }

    const data: AURResponse = await response.json();

    if (data.type === 'error') {
      throw new Error(`AUR API error: ${data.error}`);
    }

    const results: PackageSearchResult[] = data.results.map((pkg) => ({
      identifier: pkg.Name,
      name: pkg.Name,
      summary: pkg.Description,
      version: pkg.Version,
      homepage: pkg.URL,
      license: pkg.License?.join(', '),
      maintainer: pkg.Maintainer,
      source: 'aur' as const,
    }));

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('AUR search error:', error);
    throw new Error(
      `Failed to search AUR: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function getAURPackageMetadata(packageName: string): Promise<PackageMetadata | null> {
  if (!packageName || packageName.trim().length === 0) {
    throw new Error('Package name is required');
  }

  const cacheKey = `aur:identifier:${packageName}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(AUR_RPC_BASE);
  url.searchParams.set('v', '5');
  url.searchParams.set('type', 'info');
  url.searchParams.set('arg[]', packageName);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AUR API error: ${response.status} ${response.statusText}`);
    }

    const data: AURResponse = await response.json();

    if (data.type === 'error') {
      throw new Error(`AUR API error: ${data.error}`);
    }

    if (data.resultcount === 0) {
      return null;
    }

    const pkg = data.results[0];

    const metadata: PackageMetadata = {
      identifier: pkg.Name,
      name: pkg.Name,
      summary: pkg.Description,
      description: pkg.Description,
      version: pkg.Version,
      homepage: pkg.URL,
      license: pkg.License?.join(', '),
      maintainer: pkg.Maintainer,
      releaseDate: new Date(pkg.LastModified * 1000).toISOString(),
      source: 'aur' as const,
      metadata: {
        packageBase: pkg.PackageBase,
        votes: pkg.NumVotes,
        popularity: pkg.Popularity,
        outOfDate: pkg.OutOfDate ? new Date(pkg.OutOfDate * 1000).toISOString() : null,
        firstSubmitted: new Date(pkg.FirstSubmitted * 1000).toISOString(),
        urlPath: `https://aur.archlinux.org${pkg.URLPath}`,
        depends: pkg.Depends,
        makeDepends: pkg.MakeDepends,
        optDepends: pkg.OptDepends,
      },
    };

    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('AUR metadata fetch error:', error);
    throw new Error(
      `Failed to fetch AUR package metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function checkAURAvailability(packageName: string): Promise<boolean> {
  try {
    const metadata = await getAURPackageMetadata(packageName);
    return metadata !== null;
  } catch (error) {
    console.error('AUR availability check error:', error);
    return false;
  }
}

export async function getAURPackagesMetadata(
  packageNames: string[]
): Promise<Map<string, PackageMetadata>> {
  if (!packageNames || packageNames.length === 0) {
    return new Map();
  }

  const url = new URL(AUR_RPC_BASE);
  url.searchParams.set('v', '5');
  url.searchParams.set('type', 'info');

  packageNames.forEach((name) => {
    url.searchParams.append('arg[]', name);
  });

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`AUR API error: ${response.status} ${response.statusText}`);
    }

    const data: AURResponse = await response.json();

    if (data.type === 'error') {
      throw new Error(`AUR API error: ${data.error}`);
    }

    const results = new Map<string, PackageMetadata>();

    for (const pkg of data.results) {
      results.set(pkg.Name, {
        identifier: pkg.Name,
        name: pkg.Name,
        summary: pkg.Description,
        description: pkg.Description,
        version: pkg.Version,
        homepage: pkg.URL,
        license: pkg.License?.join(', '),
        maintainer: pkg.Maintainer,
        releaseDate: new Date(pkg.LastModified * 1000).toISOString(),
        source: 'aur' as const,
        metadata: {
          packageBase: pkg.PackageBase,
          votes: pkg.NumVotes,
          popularity: pkg.Popularity,
          outOfDate: pkg.OutOfDate ? new Date(pkg.OutOfDate * 1000).toISOString() : null,
          urlPath: `https://aur.archlinux.org${pkg.URLPath}`,
        },
      });
    }

    return results;
  } catch (error) {
    console.error('AUR bulk metadata fetch error:', error);
    return new Map();
  }
}

export function clearAURCache(): void {
  searchCache.clear();
  metadataCache.clear();
}
