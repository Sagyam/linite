/**
 * Repology API client
 * Documentation: https://repology.org/api
 */

import { PackageSearchResult } from './types';
import { createFlexibleApiClient } from './api-client-factory';

const REPOLOGY_API_BASE = 'https://repology.org/api/v1';
const REPOLOGY_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Linite/1.0 (Linux package installer; +https://github.com/yourusername/linite)',
};

// Create flexible API client with caching
const repologyClient = createFlexibleApiClient({
  name: 'Repology',
  cacheTTL: 15,
});

interface RepologyProject {
  repo: string;
  name: string;
  version: string;
  status: 'newest' | 'outdated' | 'ignored' | 'unique' | 'devel' | 'legacy';
  origversion?: string;
  licenses?: string[];
  maintainers?: string[];
  categories?: string[];
  summary?: string;
  www?: string[];
}

/**
 * Map Repology repo names to our source slugs
 */
const REPO_TO_SOURCE_MAP: Record<string, string> = {
  // Debian-based
  debian_stable: 'apt',
  debian_unstable: 'apt',
  ubuntu_24_04: 'apt',
  ubuntu_23_10: 'apt',
  ubuntu_23_04: 'apt',
  linuxmint_21: 'apt',

  // Red Hat-based
  fedora_39: 'dnf',
  fedora_40: 'dnf',
  fedora_rawhide: 'dnf',

  // Arch-based
  arch: 'pacman',
  aur: 'aur',

  // openSUSE
  opensuse_tumbleweed: 'zypper',
  opensuse_leap_15_5: 'zypper',

  // Universal
  flathub: 'flatpak',
  snapcraft: 'snap',
};

/**
 * Search for a project on Repology
 */
export async function searchRepology(projectName: string): Promise<PackageSearchResult[]> {
  return repologyClient.cachedSearch(projectName, async (name) => {
    // Repology doesn't have a traditional search endpoint
    // We use the project lookup which returns packages for exact matches
    const response = await fetch(
      `${REPOLOGY_API_BASE}/project/${encodeURIComponent(name)}`,
      {
        headers: REPOLOGY_HEADERS,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      throw new Error(`Repology API error: ${response.status} ${response.statusText}`);
    }

    const packages: RepologyProject[] = await response.json();

    // Group by repository to avoid duplicates
    const repoMap = new Map<string, RepologyProject>();

    for (const pkg of packages) {
      // Prefer newest versions
      if (pkg.status === 'newest' || !repoMap.has(pkg.repo)) {
        repoMap.set(pkg.repo, pkg);
      }
    }

    const results: PackageSearchResult[] = [];

    for (const pkg of repoMap.values()) {
      const sourceSlug = REPO_TO_SOURCE_MAP[pkg.repo];
      if (!sourceSlug) continue; // Skip repos we don't support

      results.push({
        identifier: pkg.name,
        name: pkg.name,
        summary: pkg.summary,
        version: pkg.version,
        homepage: pkg.www?.[0],
        license: pkg.licenses?.join(', '),
        maintainer: pkg.maintainers?.[0],
        source: 'repology' as const,
      });
    }

    return results;
  });
}

