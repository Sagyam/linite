import { RefreshStrategy, PackageMetadata } from './types';

/**
 * Map source slugs to Repology repo patterns
 */
const SOURCE_TO_REPO_PATTERN: Record<string, RegExp> = {
  apt: /^(debian|ubuntu|linuxmint|pop|raspbian)/i,
  dnf: /^(fedora|centos|rhel|rocky|alma)/i,
  pacman: /^(arch)$/i, // Exclude AUR
  zypper: /^opensuse/i,
};

interface RepologyPackage {
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
 * Repology refresh strategy for native package managers
 * Filters Repology results by distro family
 */
export class RepologyRefreshStrategy implements RefreshStrategy {
  constructor(private sourceSlug: string) {}

  async getMetadata(identifier: string): Promise<PackageMetadata | null> {
    try {
      // Fetch all repos for this project from Repology
      const response = await fetch(
        `https://repology.org/api/v1/project/${encodeURIComponent(identifier)}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Linite/1.0 (Linux package installer; +https://github.com/yourusername/linite)',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Repology API error: ${response.status}`);
      }

      const allPackages: RepologyPackage[] = await response.json();

      if (!allPackages || allPackages.length === 0) {
        return null;
      }

      // Filter packages for this source's distro family
      const repoPattern = SOURCE_TO_REPO_PATTERN[this.sourceSlug];
      if (!repoPattern) {
        console.warn(`No repo pattern defined for source: ${this.sourceSlug}`);
        return null;
      }

      const relevantPackages = allPackages.filter(pkg =>
        repoPattern.test(pkg.repo)
      );

      if (relevantPackages.length === 0) {
        return null;
      }

      // Prefer 'newest' status, fallback to first available
      const bestPackage =
        relevantPackages.find(p => p.status === 'newest') ||
        relevantPackages[0];

      // Build metadata
      const metadata: PackageMetadata = {
        identifier,
        name: identifier, // Repology uses identifier as the project name
        summary: bestPackage.summary,
        version: bestPackage.version,
        homepage: bestPackage.www?.[0],
        license: bestPackage.licenses?.join(', '),
        maintainer: bestPackage.maintainers?.[0],
        categories: bestPackage.categories,
        source: 'repology' as const,
        metadata: {
          repo: bestPackage.repo,
          status: bestPackage.status,
          origversion: bestPackage.origversion,
          allLicenses: bestPackage.licenses,
          allMaintainers: bestPackage.maintainers,
          availableRepos: relevantPackages.map(p => ({
            repo: p.repo,
            version: p.version,
            status: p.status,
          })),
        },
      };

      return metadata;
    } catch (error) {
      console.error(`Repology fetch error for ${identifier}:`, error);
      return null;
    }
  }

  async checkAvailability(identifier: string): Promise<boolean> {
    const metadata = await this.getMetadata(identifier);
    return metadata !== null;
  }
}
