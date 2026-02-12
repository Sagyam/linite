/**
 * Shared utilities for command generation (install and uninstall)
 *
 * This module extracts common logic from command-generator.ts and uninstall-command-generator.ts
 * to eliminate ~200 LOC of duplication and provide a single source of truth for:
 * - Distro and source fetching
 * - Package selection algorithm
 * - Priority calculation
 * - Command resolution by distro family
 */

import { db } from '@/db';
import { apps, packages, distros } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Types for distro with sources
 */
export interface DistroWithSources {
  id: string;
  name: string;
  slug: string;
  family: string;
  distroSources: Array<{
    priority: number | null;
    isDefault: boolean | null;
    source: {
      id: string;
      name: string;
      slug: string;
      installCmd: string;
      removeCmd: string | null;
      requireSudo: boolean | null;
      setupCmd: unknown;
      cleanupCmd: unknown;
      supportsDependencyCleanup: boolean | null;
      dependencyCleanupCmd: string | null;
    };
  }>;
}

/**
 * Types for app with packages
 */
export interface AppWithPackages {
  id: string;
  displayName: string;
  packages: Array<{
    id: string;
    identifier: string;
    isAvailable: boolean;
    metadata: unknown;
    packageSetupCmd: unknown;
    packageCleanupCmd: unknown;
    uninstallMetadata: unknown;
    source: {
      id: string;
      name: string;
      slug: string;
      installCmd: string;
      removeCmd: string | null;
      requireSudo: boolean | null;
      setupCmd: unknown;
      cleanupCmd: unknown;
      supportsDependencyCleanup: boolean | null;
      dependencyCleanupCmd: string | null;
    };
  }>;
}

/**
 * Source with priority information
 */
export interface SourceWithPriority {
  id: string;
  name: string;
  slug: string;
  installCmd: string;
  removeCmd: string | null;
  requireSudo: boolean | null;
  setupCmd: unknown;
  cleanupCmd: unknown;
  supportsDependencyCleanup: boolean | null;
  dependencyCleanupCmd: string | null;
  distroSourcePriority: number | null;
  isDefault: boolean | null;
}

/**
 * Package with calculated priority
 */
export interface PackageWithPriority {
  id: string;
  identifier: string;
  isAvailable: boolean;
  metadata: unknown;
  packageSetupCmd: unknown;
  packageCleanupCmd: unknown;
  uninstallMetadata: unknown;
  source: {
    id: string;
    name: string;
    slug: string;
    installCmd: string;
    removeCmd: string | null;
    requireSudo: boolean | null;
    setupCmd: unknown;
    cleanupCmd: unknown;
    supportsDependencyCleanup: boolean | null;
    dependencyCleanupCmd: string | null;
  };
  calculatedPriority: number;
}

/**
 * Fetch distro with its configured sources
 *
 * SHARED between install and uninstall generators (IDENTICAL logic)
 */
export async function getDistroWithSources(distroSlug: string): Promise<DistroWithSources> {
  const distro = await db.query.distros.findFirst({
    where: eq(distros.slug, distroSlug),
    with: {
      distroSources: {
        with: {
          source: true,
        },
      },
    },
  });

  if (!distro) {
    throw new Error(`Distribution not found. Please select a valid Linux distribution.`);
  }

  if (!distro.distroSources || distro.distroSources.length === 0) {
    throw new Error(`No sources configured for distro "${distro.name}"`);
  }

  return distro as DistroWithSources;
}

/**
 * Fetch selected apps with their available packages
 *
 * SHARED between install and uninstall generators (IDENTICAL logic)
 */
export async function getAppsWithPackages(appIds: string[]): Promise<AppWithPackages[]> {
  const selectedApps = await db.query.apps.findMany({
    where: inArray(apps.id, appIds),
    with: {
      packages: {
        where: eq(packages.isAvailable, true),
        with: {
          source: true,
        },
      },
    },
  });

  if (selectedApps.length === 0) {
    throw new Error('No apps found for the provided IDs');
  }

  return selectedApps as AppWithPackages[];
}

/**
 * Build a map of available sources for a distro with their priorities
 *
 * SHARED between install and uninstall generators (IDENTICAL logic)
 */
export function buildDistroSourceMap(
  distroSources: DistroWithSources['distroSources']
): Map<string, SourceWithPriority> {
  return new Map(
    distroSources.map((ds) => [
      ds.source.slug,
      {
        ...ds.source,
        distroSourcePriority: ds.priority,
        isDefault: ds.isDefault,
      },
    ])
  );
}

/**
 * Calculate priority for a package based on distro source priority and user preference
 *
 * CRITICAL BUSINESS LOGIC - 100% IDENTICAL in both install and uninstall generators
 *
 * Priority calculation:
 * - Base: distro source priority
 * - +100: User's preferred source
 * - +5: Default source for distro
 */
export function calculatePackagePriority(
  distroSourcePriority: number | null,
  isDefault: boolean | null,
  sourceSlug: string,
  sourcePreference?: string
): number {
  let totalPriority = distroSourcePriority ?? 0;

  // Boost priority if this is the user's preferred source
  if (sourcePreference && sourceSlug === sourcePreference) {
    totalPriority += 100; // Significant boost for user preference
  }

  // Boost if this is the default source for the distro
  if (isDefault === true) {
    totalPriority += 5;
  }

  return totalPriority;
}

/**
 * Select the best package for an app based on priority
 *
 * SHARED between install and uninstall generators (IDENTICAL algorithm)
 *
 * Returns the package with calculated priorities, or null if no packages available
 */
export function selectBestPackage<T extends AppWithPackages['packages'][0]>(
  availablePackages: T[],
  distroSourceMap: Map<string, SourceWithPriority>,
  sourcePreference?: string
): (T & { calculatedPriority: number }) | null {
  if (availablePackages.length === 0) {
    return null;
  }

  // Calculate priority for each package
  const packagesWithPriority = availablePackages.map((pkg) => {
    const distroSource = distroSourceMap.get(pkg.source.slug);
    if (!distroSource) {
      throw new Error(`Source ${pkg.source.slug} not found in distro source map`);
    }

    const calculatedPriority = calculatePackagePriority(
      distroSource.distroSourcePriority,
      distroSource.isDefault,
      pkg.source.slug,
      sourcePreference
    );

    return {
      ...pkg,
      calculatedPriority,
    };
  });

  // Select the package with the highest priority
  const bestPackage = packagesWithPriority.sort(
    (a, b) => b.calculatedPriority - a.calculatedPriority
  )[0];

  return bestPackage;
}

/**
 * Resolve a command based on distro family
 *
 * Commands can be:
 * - string: Universal command that works on all distros
 * - object: Distro-family-specific commands with fallback to '*'
 * - null/undefined: No command available
 *
 * SHARED between install (setupCmd) and uninstall (cleanupCmd)
 * IDENTICAL logic with different parameter names
 */
export function resolveCommandByDistroFamily(
  command: string | Record<string, string | null> | null | undefined,
  distroFamily: string
): string | null {
  if (!command) return null;

  // If it's a string, return as-is (universal command)
  if (typeof command === 'string') return command;

  // If it's an object, select based on distro family
  if (typeof command === 'object' && command !== null) {
    return command[distroFamily] || command['*'] || null;
  }

  return null;
}

/**
 * Parse JSON string to typed object, with fallback to original value
 *
 * Used for packageSetupCmd, packageCleanupCmd, and uninstallMetadata
 */
export function parseJsonField<T>(field: unknown): T | string | null {
  if (!field) return null;

  if (typeof field === 'string') {
    try {
      return JSON.parse(field) as T;
    } catch {
      // If parsing fails, return as string
      return field;
    }
  }

  return field as T;
}

/**
 * Group packages by source slug
 *
 * Used to generate bulk install/uninstall commands per source
 */
export function groupPackagesBySource<T extends { sourceSlug: string }>(
  packages: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const pkg of packages) {
    const existing = grouped.get(pkg.sourceSlug) || [];
    existing.push(pkg);
    grouped.set(pkg.sourceSlug, existing);
  }

  return grouped;
}

/**
 * Detect OS type from distro slug
 *
 * SHARED between install and uninstall generators (IDENTICAL logic)
 */
export function detectOS(distroSlug: string): 'windows' | 'linux' {
  return distroSlug === 'windows' ? 'windows' : 'linux';
}

/**
 * Determine if sudo is needed for a command
 *
 * SHARED logic for both install and uninstall
 */
export function shouldUseSudo(requireSudo: boolean, os: 'windows' | 'linux'): boolean {
  return requireSudo && os !== 'windows';
}

/**
 * Nix command templates for both install and uninstall operations
 *
 * UNIFIED interface replacing getNixCommandTemplate and getNixUninstallTemplate
 */
export interface NixCommandTemplate {
  installCmd: string | null;
  removeCmd: string | null;
  setupCmd: string | null;
  cleanupCmd: string | null;
}

/**
 * Get Nix commands for install and uninstall based on installation method
 *
 * CONSOLIDATED from command-generator.ts and uninstall-command-generator.ts
 */
export function getNixCommands(
  method: 'nix-shell' | 'nix-env' | 'nix-flakes' | null
): NixCommandTemplate {
  switch (method) {
    case 'nix-env':
      return {
        installCmd: 'nix-env -iA nixpkgs.',
        removeCmd: 'nix-env -e',
        setupCmd: 'nix-channel --update',
        cleanupCmd: 'nix-collect-garbage -d',
      };
    case 'nix-flakes':
      return {
        installCmd: 'nix profile install nixpkgs#',
        removeCmd: 'nix profile remove',
        setupCmd:
          'nix-channel --update && echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf',
        cleanupCmd: 'nix-collect-garbage -d',
      };
    case 'nix-shell':
    default:
      return {
        installCmd: 'nix-shell -p',
        removeCmd: null, // nix-shell is ephemeral, nothing to uninstall
        setupCmd: null,
        cleanupCmd: null,
      };
  }
}

/**
 * Build script command for install based on OS and script URL
 *
 * SHARED between install and uninstall generators (IDENTICAL logic)
 */
export function buildScriptCommand(scriptUrl: string, os: 'windows' | 'linux'): string {
  if (os === 'windows') {
    // Windows PowerShell command
    if (scriptUrl.endsWith('.exe')) {
      // Direct download and run executable
      return `irm ${scriptUrl} -OutFile installer.exe; .\\installer.exe`;
    } else {
      // Run script directly
      return `irm ${scriptUrl} | iex`;
    }
  } else {
    // Linux curl command
    return `curl -fsSL ${scriptUrl} | bash`;
  }
}
