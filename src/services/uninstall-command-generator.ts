import { db } from '@/db';
import { apps, packages, distros } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type {
  GenerateUninstallCommandRequest,
  GenerateUninstallCommandResponse,
  PackageBreakdown,
  ManualUninstallStep,
  UninstallMetadata,
} from '@/types/entities';

// Re-export for backward compatibility
export type {
  GenerateUninstallCommandRequest,
  GenerateUninstallCommandResponse,
  ManualUninstallStep,
};

interface SelectedPackageForUninstall {
  appName: string;
  packageIdentifier: string;
  sourceName: string;
  sourceSlug: string;
  removeCmd: string | null;
  requireSudo: boolean;
  cleanupCmd: string | Record<string, string | null> | null;
  packageCleanupCmd: string | Record<string, string | null> | null;
  supportsDependencyCleanup: boolean;
  dependencyCleanupCmd: string | null;
  uninstallMetadata?: UninstallMetadata | null;
  priority: number;
  metadata?: unknown;
}

/**
 * Generates uninstall commands for selected apps based on distro and source preferences
 */

// Helper function to get Nix uninstall command templates
function getNixUninstallTemplate(method: 'nix-shell' | 'nix-env' | 'nix-flakes' | null) {
  switch (method) {
    case 'nix-env':
      return {
        removeCmd: 'nix-env -e',
        cleanupCmd: 'nix-collect-garbage -d',
      };
    case 'nix-flakes':
      return {
        removeCmd: 'nix profile remove',
        cleanupCmd: 'nix-collect-garbage -d',
      };
    case 'nix-shell':
    default:
      return {
        removeCmd: null, // nix-shell is ephemeral, nothing to uninstall
        cleanupCmd: null,
      };
  }
}

// Helper function to resolve cleanup command based on distro family
function resolveCleanupCmd(
  cleanupCmd: string | Record<string, string | null> | null | undefined,
  distroFamily: string
): string | null {
  if (!cleanupCmd) return null;

  // If it's a string, return as-is (universal command)
  if (typeof cleanupCmd === 'string') return cleanupCmd;

  // If it's an object, select based on distro family
  if (typeof cleanupCmd === 'object' && cleanupCmd !== null) {
    return cleanupCmd[distroFamily] || cleanupCmd['*'] || null;
  }

  return null;
}

export async function generateUninstallCommands(
  request: GenerateUninstallCommandRequest
): Promise<GenerateUninstallCommandResponse> {
  const {
    distroSlug,
    appIds,
    sourcePreference,
    nixosInstallMethod,
    includeDependencyCleanup = false,
    includeSetupCleanup = false,
  } = request;

  // 1. Get the selected distro with its available sources
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

  // 2. Get all selected apps with their packages
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

  // 3. Build a map of available sources for this distro with their priorities
  const distroSourceMap = new Map(
    distro.distroSources.map((ds) => [
      ds.source.slug,
      {
        ...ds.source,
        distroSourcePriority: ds.priority,
        isDefault: ds.isDefault,
      },
    ])
  );

  // 4. Select the best package for each app (SAME algorithm as install)
  const selectedPackages: SelectedPackageForUninstall[] = [];
  const warnings: string[] = [];
  const manualSteps: ManualUninstallStep[] = [];

  for (const app of selectedApps) {
    const availablePackages = app.packages.filter((pkg) =>
      distroSourceMap.has(pkg.source.slug)
    );

    if (availablePackages.length === 0) {
      warnings.push(`${app.displayName}: No package available for ${distro.name}`);
      continue;
    }

    // Calculate priority for each package (SAME as install)
    const packagesWithPriority = availablePackages.map((pkg) => {
      const distroSource = distroSourceMap.get(pkg.source.slug)!;
      let totalPriority = distroSource.distroSourcePriority ?? 0;

      // Boost priority if this is the user's preferred source
      if (sourcePreference && pkg.source.slug === sourcePreference) {
        totalPriority += 100; // Significant boost for user preference
      }

      // Boost if this is the default source for the distro
      if (distroSource.isDefault === true) {
        totalPriority += 5;
      }

      return {
        ...pkg,
        calculatedPriority: totalPriority,
      };
    });

    // Select the package with the highest priority
    const bestPackage = packagesWithPriority.sort(
      (a, b) => (b.calculatedPriority ?? 0) - (a.calculatedPriority ?? 0)
    )[0];

    // Parse packageCleanupCmd from JSON string if needed
    let parsedPackageCleanupCmd: string | Record<string, string | null> | null = null;
    if (bestPackage.packageCleanupCmd) {
      if (typeof bestPackage.packageCleanupCmd === 'string') {
        try {
          parsedPackageCleanupCmd = JSON.parse(bestPackage.packageCleanupCmd);
        } catch {
          parsedPackageCleanupCmd = bestPackage.packageCleanupCmd;
        }
      } else {
        parsedPackageCleanupCmd = bestPackage.packageCleanupCmd as string | Record<string, string | null>;
      }
    }

    // Parse uninstallMetadata if present
    let parsedUninstallMetadata: UninstallMetadata | null = null;
    if (bestPackage.uninstallMetadata) {
      if (typeof bestPackage.uninstallMetadata === 'string') {
        try {
          parsedUninstallMetadata = JSON.parse(bestPackage.uninstallMetadata) as UninstallMetadata;
        } catch {
          parsedUninstallMetadata = null;
        }
      } else {
        parsedUninstallMetadata = bestPackage.uninstallMetadata as UninstallMetadata;
      }
    }

    selectedPackages.push({
      appName: app.displayName,
      packageIdentifier: bestPackage.identifier,
      sourceName: bestPackage.source.name,
      sourceSlug: bestPackage.source.slug,
      removeCmd: bestPackage.source.removeCmd,
      requireSudo: bestPackage.source.requireSudo ?? false,
      cleanupCmd: (bestPackage.source.cleanupCmd as string | Record<string, string | null> | null) ?? null,
      packageCleanupCmd: parsedPackageCleanupCmd,
      supportsDependencyCleanup: bestPackage.source.supportsDependencyCleanup ?? false,
      dependencyCleanupCmd: bestPackage.source.dependencyCleanupCmd,
      uninstallMetadata: parsedUninstallMetadata,
      priority: bestPackage.calculatedPriority ?? 0,
      metadata: bestPackage.metadata,
    });
  }

  // 5. Group packages by source
  const packagesBySource = new Map<string, SelectedPackageForUninstall[]>();

  for (const pkg of selectedPackages) {
    const existing = packagesBySource.get(pkg.sourceSlug) || [];
    existing.push(pkg);
    packagesBySource.set(pkg.sourceSlug, existing);
  }

  // 6. Generate uninstall commands for each source
  const commands: string[] = [];
  const cleanupCommands: string[] = [];
  const dependencyCleanupCommands: string[] = [];
  const breakdown: PackageBreakdown[] = [];
  const processedCleanupCmds = new Set<string>();

  // Determine OS based on distro
  const isWindows = distro.slug === 'windows';
  const os = isWindows ? 'windows' : 'linux';

  for (const [sourceSlug, pkgs] of packagesBySource.entries()) {
    const firstPkg = pkgs[0];
    const packageIdentifiers = pkgs.map((p) => p.packageIdentifier);

    // For Nix source, use the command template based on installation method
    let removeCmd = firstPkg.removeCmd;
    let cleanupCmd = firstPkg.cleanupCmd;

    if (sourceSlug === 'nix' && nixosInstallMethod) {
      const nixTemplate = getNixUninstallTemplate(nixosInstallMethod);
      removeCmd = nixTemplate.removeCmd;
      cleanupCmd = nixTemplate.cleanupCmd;

      // For nix-shell, warn and skip
      if (nixosInstallMethod === 'nix-shell') {
        warnings.push('nix-shell environments are ephemeral - no uninstall needed');
        continue;
      }
    }

    // Handle script source specially
    if (sourceSlug === 'script') {
      // For script source, check for uninstall metadata
      for (const pkg of pkgs) {
        if (pkg.uninstallMetadata) {
          const uninstallScript = pkg.uninstallMetadata[os as 'linux' | 'windows'];
          if (uninstallScript) {
            // Script-based uninstall available
            commands.push(uninstallScript);
          } else if (pkg.uninstallMetadata.manualInstructions) {
            // Manual uninstall instructions
            manualSteps.push({
              appName: pkg.appName,
              instructions: pkg.uninstallMetadata.manualInstructions,
            });
          } else {
            warnings.push(`${pkg.appName}: No uninstall method available for script-based installation`);
          }
        } else {
          warnings.push(`${pkg.appName}: No uninstall metadata available for script-based installation`);
        }
      }

      // Add to breakdown
      breakdown.push({
        source: firstPkg.sourceName,
        packages: packageIdentifiers,
      });

      continue; // Skip normal command generation for script source
    }

    // Check if source supports uninstallation
    if (!removeCmd) {
      for (const pkg of pkgs) {
        warnings.push(`${pkg.appName}: Uninstall not supported for ${firstPkg.sourceName} source`);
      }
      continue;
    }

    // Add per-package cleanup commands (reverse of packageSetupCmd)
    if (includeSetupCleanup) {
      for (const pkg of pkgs) {
        if (pkg.packageCleanupCmd) {
          const pkgCleanup = resolveCleanupCmd(pkg.packageCleanupCmd, distro.family);
          if (pkgCleanup && !processedCleanupCmds.has(pkgCleanup)) {
            cleanupCommands.push(pkgCleanup);
            processedCleanupCmds.add(pkgCleanup);
          }
        }
      }
    }

    // Add source-level cleanup command if needed (reverse of setupCmd)
    if (includeSetupCleanup && cleanupCmd && !processedCleanupCmds.has(sourceSlug)) {
      const srcCleanup = resolveCleanupCmd(cleanupCmd, distro.family);
      if (srcCleanup) {
        cleanupCommands.push(srcCleanup);
      }
      processedCleanupCmds.add(sourceSlug);
    }

    // Build the uninstall command
    const packageList = packageIdentifiers.join(' ');
    const fullCommand = firstPkg.requireSudo && !isWindows
      ? `sudo ${removeCmd} ${packageList}`
      : `${removeCmd} ${packageList}`;

    commands.push(fullCommand);

    // Add dependency cleanup if requested and supported
    if (includeDependencyCleanup && firstPkg.supportsDependencyCleanup && firstPkg.dependencyCleanupCmd) {
      const depCleanup = firstPkg.requireSudo && !isWindows
        ? `sudo ${firstPkg.dependencyCleanupCmd}`
        : firstPkg.dependencyCleanupCmd;

      if (!dependencyCleanupCommands.includes(depCleanup)) {
        dependencyCleanupCommands.push(depCleanup);
      }
    }

    // Add to breakdown
    breakdown.push({
      source: firstPkg.sourceName,
      packages: packageIdentifiers,
    });
  }

  return {
    commands,
    cleanupCommands,
    dependencyCleanupCommands,
    warnings,
    breakdown,
    manualSteps,
  };
}
