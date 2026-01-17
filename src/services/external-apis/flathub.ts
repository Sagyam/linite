import { createExternalApiClient } from './api-client-factory';
import { PackageSearchResult, PackageMetadata } from './types';

const FLATHUB_API_BASE = 'https://flathub.org/api/v2';

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

const flathubClient = createExternalApiClient<FlathubSearchResponse['hits'][0], FlathubAppData>({
  name: 'Flathub',
  baseUrl: FLATHUB_API_BASE,
});

export async function searchFlathub(query: string): Promise<PackageSearchResult[]> {
  return flathubClient.search(query, (hit) => ({
    identifier: hit.app_id,
    name: hit.name,
    summary: hit.summary,
    iconUrl: hit.icon,
    source: 'flatpak' as const,
  }));
}

export async function getFlathubAppMetadata(appId: string): Promise<PackageMetadata | null> {
  return flathubClient.getMetadata(
    appId,
    `${FLATHUB_API_BASE}/appstream/${encodeURIComponent(appId)}`,
    (data: FlathubAppData) => {
      const latestRelease = data.releases?.[0];

      const screenshots = (data.screenshots
        ?.map(screenshot => {
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
          kudos: (data as { kudos?: unknown }).kudos,
          keywords: (data as { keywords?: unknown }).keywords,
        },
      };

      return metadata;
    }
  );
}

export async function checkFlathubAvailability(appId: string): Promise<boolean> {
  return flathubClient.checkAvailability(appId, () => getFlathubAppMetadata(appId));
}

export function clearFlathubCache(): void {
  flathubClient.clearCache();
}
