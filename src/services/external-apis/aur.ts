import { PackageSearchResult } from './types';
import { createFlexibleApiClient } from './api-client-factory';

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
}

const aurClient = createFlexibleApiClient({
  name: 'AUR',
  cacheTTL: 15,
});

export async function searchAUR(query: string): Promise<PackageSearchResult[]> {
  return aurClient.cachedSearch(query, async (q) => {
    const url = new URL(AUR_RPC_BASE);
    url.searchParams.set('v', '5');
    url.searchParams.set('type', 'search');
    url.searchParams.set('arg', q);
    url.searchParams.set('by', 'name-desc');

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

    return data.results.map((pkg) => ({
      identifier: pkg.Name,
      name: pkg.Name,
      summary: pkg.Description,
      version: pkg.Version,
      homepage: pkg.URL,
      license: pkg.License?.join(', '),
      maintainer: pkg.Maintainer,
      source: 'aur' as const,
    }));
  });
}
