import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

export interface ExternalApiConfig {
  name: string;
  baseUrl: string;
  searchCache?: SimpleCache<PackageSearchResult[]>;
  metadataCache?: SimpleCache<PackageMetadata>;
  headers?: Record<string, string>;
}

export interface ApiSearchResponse<T> {
  results?: T[];
  hits?: T[];
  [key: string]: unknown;
}

export interface ApiTransformSearch<T> {
  (item: T, index: number): PackageSearchResult;
}

export interface ApiTransformMetadata<T> {
  (data: T): PackageMetadata | null;
}

export function createExternalApiClient<T, U>(
  config: ExternalApiConfig
) {
  const {
    name,
    baseUrl,
    searchCache = new SimpleCache<PackageSearchResult[]>(15),
    metadataCache = new SimpleCache<PackageMetadata>(15),
    headers = {},
  } = config;

  return {
    search: async (
      query: string,
      transform: ApiTransformSearch<T>
    ): Promise<PackageSearchResult[]> => {
        if (!query || query.trim().length === 0) {
          throw new Error('Search query is required');
        }

        const cacheKey = `${name.toLowerCase()}:search:${query.toLowerCase()}`;
        const cached = searchCache.get(cacheKey);
        if (cached) return cached;

        try {
          const response = await fetch(`${baseUrl}/search/${encodeURIComponent(query)}`, {
            headers: {
              'Accept': 'application/json',
              ...headers,
            },
          });

          if (!response.ok) {
            throw new Error(`${name} API error: ${response.status} ${response.statusText}`);
          }

          const data = (await response.json()) as ApiSearchResponse<T>;
          const results = (data.results || data.hits || []).map(transform);

          searchCache.set(cacheKey, results);
          return results;
        } catch (error) {
          console.error(`${name} search error:`, error);
          throw new Error(
            `Failed to search ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      },

    getMetadata: async (
      identifier: string,
      endpoint: string,
      transform: ApiTransformMetadata<U>
    ): Promise<PackageMetadata | null> => {
        if (!identifier || identifier.trim().length === 0) {
          throw new Error('Identifier is required');
        }

        const cacheKey = `${name.toLowerCase()}:identifier:${identifier}`;
        const cached = metadataCache.get(cacheKey);
        if (cached) return cached;

        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json',
              ...headers,
            },
          });

          if (!response.ok) {
            if (response.status === 404) {
              return null;
            }
            throw new Error(`${name} API error: ${response.status} ${response.statusText}`);
          }

          const data: U = await response.json();
          const metadata = transform(data);

          if (metadata) {
            metadataCache.set(cacheKey, metadata);
          }
          return metadata;
        } catch (error) {
          console.error(`${name} metadata fetch error:`, error);
          throw new Error(
            `Failed to fetch ${name} metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      },

    checkAvailability: async (identifier: string, getMetadataFn: () => Promise<PackageMetadata | null>): Promise<boolean> => {
        try {
          const metadata = await getMetadataFn();
          return metadata !== null;
        } catch (error) {
          console.error(`${name} availability check error:`, error);
          return false;
        }
      },

    clearCache: (): void => {
      searchCache.clear();
      metadataCache.clear();
    },
  };
}
