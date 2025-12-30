/**
 * Repology API client
 * Documentation: https://repology.org/api
 */

import { PackageSearchResult, PackageMetadata, SimpleCache } from './types';

const REPOLOGY_API_BASE = 'https://repology.org/api/v1';
const searchCache = new SimpleCache<PackageSearchResult[]>(15); // 15 minute cache
const metadataCache = new SimpleCache<PackageMetadata>(15); // 15 minute cache

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
  if (!projectName || projectName.trim().length === 0) {
    throw new Error('Project name is required');
  }

  const cacheKey = `repology:search:${projectName.toLowerCase()}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    // Repology doesn't have a traditional search endpoint
    // We use the project lookup which returns packages for exact matches
    const response = await fetch(
      `${REPOLOGY_API_BASE}/project/${encodeURIComponent(projectName)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
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

    searchCache.set(cacheKey, results);
    return results;
  } catch (error) {
    console.error('Repology search error:', error);
    throw new Error(
      `Failed to search Repology: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get detailed metadata for a project from Repology
 */
export async function getRepologyProjectMetadata(
  projectName: string
): Promise<PackageMetadata | null> {
  if (!projectName || projectName.trim().length === 0) {
    throw new Error('Project name is required');
  }

  const cacheKey = `repology:project:${projectName}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${REPOLOGY_API_BASE}/project/${encodeURIComponent(projectName)}`,
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
      throw new Error(`Repology API error: ${response.status} ${response.statusText}`);
    }

    const packages: RepologyProject[] = await response.json();

    if (packages.length === 0) {
      return null;
    }

    // Find the newest version
    const newestPkg = packages.find((p) => p.status === 'newest') || packages[0];

    const metadata: PackageMetadata = {
      identifier: newestPkg.name,
      name: newestPkg.name,
      summary: newestPkg.summary,
      version: newestPkg.version,
      homepage: newestPkg.www?.[0],
      license: newestPkg.licenses?.join(', '),
      maintainer: newestPkg.maintainers?.[0],
      categories: newestPkg.categories,
      source: 'repology' as const,
      metadata: {
        availableRepos: packages.map((p) => ({
          repo: p.repo,
          version: p.version,
          status: p.status,
        })),
      },
    };

    metadataCache.set(cacheKey, metadata);
    return metadata;
  } catch (error) {
    console.error('Repology metadata fetch error:', error);
    throw new Error(
      `Failed to fetch Repology project metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get packages for a project that are available in specific distro repos
 */
export async function getRepologyPackagesForDistro(
  projectName: string,
  distroFamily: 'debian' | 'rhel' | 'arch' | 'suse'
): Promise<RepologyProject[]> {
  try {
    const response = await fetch(
      `${REPOLOGY_API_BASE}/project/${encodeURIComponent(projectName)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const packages: RepologyProject[] = await response.json();

    // Filter by distro family
    const repoPatterns: Record<string, RegExp> = {
      debian: /^(debian|ubuntu|linuxmint|pop)/i,
      rhel: /^(fedora|centos|rhel)/i,
      arch: /^(arch|aur|manjaro)/i,
      suse: /^opensuse/i,
    };

    const pattern = repoPatterns[distroFamily];
    if (!pattern) return [];

    return packages.filter((pkg) => pattern.test(pkg.repo));
  } catch (error) {
    console.error('Repology distro packages fetch error:', error);
    return [];
  }
}

/**
 * Clear the Repology cache
 */
export function clearRepologyCache(): void {
  searchCache.clear(); metadataCache.clear();
}
