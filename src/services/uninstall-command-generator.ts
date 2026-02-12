import type {
  GenerateUninstallCommandRequest,
  GenerateUninstallCommandResponse,
  PackageBreakdown,
  ManualUninstallStep,
  UninstallMetadata,
} from '@/types/entities';
import {
  getDistroWithSources,
  getAppsWithPackages,
  buildDistroSourceMap,
  selectBestPackage,
  resolveCommandByDistroFamily,
  parseJsonField,
  groupPackagesBySource,
  detectOS,
  shouldUseSudo,
  getNixCommands,
} from './command-generator-shared';

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

// Alias for backward compatibility - now uses shared function
const resolveCleanupCmd = resolveCommandByDistroFamily;

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

  // 1. Get the selected distro with its available sources (SHARED FUNCTION)
  const distro = await getDistroWithSources(distroSlug);

  // 2. Get all selected apps with their packages (SHARED FUNCTION)
  const selectedApps = await getAppsWithPackages(appIds);

  // 3. Build a map of available sources for this distro with their priorities (SHARED FUNCTION)
  const distroSourceMap = buildDistroSourceMap(distro.distroSources);

  // 4. Select the best package for each app (USES SHARED ALGORITHM)
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

    // Select best package using shared algorithm
    const bestPackage = selectBestPackage(availablePackages, distroSourceMap, sourcePreference);

    if (!bestPackage) {
      warnings.push(`${app.displayName}: No package available for ${distro.name}`);
      continue;
    }

    // Parse packageCleanupCmd from JSON string if needed (SHARED FUNCTION)
    const parsedPackageCleanupCmd = parseJsonField<Record<string, string | null>>(
      bestPackage.packageCleanupCmd
    );

    // Parse uninstallMetadata if present (SHARED FUNCTION)
    const parsedUninstallMetadata = parseJsonField<UninstallMetadata>(
      bestPackage.uninstallMetadata
    );

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
      uninstallMetadata: parsedUninstallMetadata as UninstallMetadata | null,
      priority: bestPackage.calculatedPriority ?? 0,
      metadata: bestPackage.metadata,
    });
  }

  // 5. Group packages by source (SHARED FUNCTION)
  const packagesBySource = groupPackagesBySource(selectedPackages);

  // 6. Generate uninstall commands for each source
  const commands: string[] = [];
  const cleanupCommands: string[] = [];
  const dependencyCleanupCommands: string[] = [];
  const breakdown: PackageBreakdown[] = [];
  const processedCleanupCmds = new Set<string>();

  // Determine OS based on distro
  const os = detectOS(distro.slug);

  for (const [sourceSlug, pkgs] of packagesBySource.entries()) {
    const firstPkg = pkgs[0];
    const packageIdentifiers = pkgs.map((p) => p.packageIdentifier);

    // For Nix source, use the command template based on installation method
    let removeCmd = firstPkg.removeCmd;
    let cleanupCmd = firstPkg.cleanupCmd;

    if (sourceSlug === 'nix' && nixosInstallMethod) {
      const nixCommands = getNixCommands(nixosInstallMethod);
      removeCmd = nixCommands.removeCmd;
      cleanupCmd = nixCommands.cleanupCmd;

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
    const fullCommand = shouldUseSudo(firstPkg.requireSudo, os)
      ? `sudo ${removeCmd} ${packageList}`
      : `${removeCmd} ${packageList}`;

    commands.push(fullCommand);

    // Add dependency cleanup if requested and supported
    if (includeDependencyCleanup && firstPkg.supportsDependencyCleanup && firstPkg.dependencyCleanupCmd) {
      const depCleanup = shouldUseSudo(firstPkg.requireSudo, os)
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
