import { createExternalApiClient } from './api-client-factory';
import { PackageSearchResult } from './types';

const FLATHUB_API_BASE = 'https://flathub.org/api/v2';

interface FlathubSearchHit {
  app_id: string;
  name: string;
  summary: string;
  keywords?: string[];
  icon?: string;
}

const flathubClient = createExternalApiClient<FlathubSearchHit, never>({
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
