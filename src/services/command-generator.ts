import { parsePackageMetadata } from '@/lib/package-metadata';
import type {
  GenerateCommandRequest,
  GenerateCommandResponse,
  PackageBreakdown,
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
  buildScriptCommand,
} from './command-generator-shared';

// Re-export for backward compatibility
export type { GenerateCommandRequest, GenerateCommandResponse, PackageBreakdown };

interface SelectedPackage {
  appId: string;
  appName: string;
  packageId: string;
  packageIdentifier: string;
  sourceName: string;
  sourceSlug: string;
  installCmd: string;
  requireSudo: boolean;
  setupCmd: string | Record<string, string | null> | null; // Supports string (universal) or object (distro-family-specific)
  packageSetupCmd: string | Record<string, string | null> | null; // Per-package setup command (e.g., PPA, COPR)
  priority: number;
  metadata?: unknown;
}

// Alias for backward compatibility - now uses shared function
const resolveSetupCmd = resolveCommandByDistroFamily;

export async function generateInstallCommands(
  request: GenerateCommandRequest
): Promise<GenerateCommandResponse> {
  const { distroSlug, appIds, sourcePreference, nixosInstallMethod } = request;

  // 1. Get the selected distro with its available sources (SHARED FUNCTION)
  const distro = await getDistroWithSources(distroSlug);

  // 2. Get all selected apps with their packages (SHARED FUNCTION)
  const selectedApps = await getAppsWithPackages(appIds);

  // 3. Build a map of available sources for this distro with their priorities (SHARED FUNCTION)
  const distroSourceMap = buildDistroSourceMap(distro.distroSources);

  // 4. Select the best package for each app (USES SHARED FUNCTION)
  const selectedPackages: SelectedPackage[] = [];
  const warnings: string[] = [];

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

    // Parse packageSetupCmd from JSON string if needed (SHARED FUNCTION)
    const parsedPackageSetupCmd = parseJsonField<Record<string, string | null>>(
      bestPackage.packageSetupCmd
    );

    selectedPackages.push({
      appId: app.id,
      appName: app.displayName,
      packageId: bestPackage.id,
      packageIdentifier: bestPackage.identifier,
      sourceName: bestPackage.source.name,
      sourceSlug: bestPackage.source.slug,
      installCmd: bestPackage.source.installCmd,
      requireSudo: bestPackage.source.requireSudo ?? false,
      setupCmd: (bestPackage.source.setupCmd as string | Record<string, string | null> | null) ?? null,
      packageSetupCmd: parsedPackageSetupCmd,
      priority: bestPackage.calculatedPriority ?? 0,
      metadata: bestPackage.metadata,
    });
  }

  // 5. Group packages by source (SHARED FUNCTION)
  const packagesBySource = groupPackagesBySource(selectedPackages);

  // 6. Generate install commands for each source
  const commands: string[] = [];
  const setupCommands: string[] = [];
  const breakdown: PackageBreakdown[] = [];
  const processedSetupCmds = new Set<string>();

  // Determine OS based on distro (SHARED FUNCTION)
  const os = detectOS(distro.slug);

  for (const [sourceSlug, pkgs] of packagesBySource.entries()) {
    const firstPkg = pkgs[0];
    const packageIdentifiers = pkgs.map((p) => p.packageIdentifier);

    // For Nix source, use the command template based on installation method
    let installCmd = firstPkg.installCmd;
    let setupCmd = firstPkg.setupCmd;

    if (sourceSlug === 'nix' && nixosInstallMethod) {
      const nixCommands = getNixCommands(nixosInstallMethod);
      installCmd = nixCommands.installCmd || firstPkg.installCmd;
      setupCmd = nixCommands.setupCmd;
    }

    // Handle script source specially
    if (sourceSlug === 'script') {
      // For script source, generate individual commands for each package
      for (const pkg of pkgs) {
        // Parse metadata safely
        const metadata = parsePackageMetadata(pkg.metadata);

        const scriptUrl = metadata.scriptUrl?.[os];
        if (scriptUrl) {
          // Use shared script command builder (SHARED FUNCTION)
          const scriptCommand = buildScriptCommand(scriptUrl, os);
          commands.push(scriptCommand);
        } else {
          warnings.push(`${pkg.appName}: No install script available for ${os}`);
        }
      }

      // Add to breakdown (one entry per package for script sources)
      for (const pkg of pkgs) {
        breakdown.push({
          source: pkg.sourceName,
          packages: [pkg.packageIdentifier],
          appId: pkg.appId,
          appName: pkg.appName,
          packageId: pkg.packageId,
          distroId: distro.id,
        });
      }

      continue; // Skip normal command generation for a script source
    }

    // Add per-package setup commands (e.g., PPAs, COPR, RPMFusion, OBS)
    for (const pkg of pkgs) {
      if (pkg.packageSetupCmd) {
        const pkgSetup = resolveSetupCmd(pkg.packageSetupCmd, distro.family);
        if (pkgSetup && !processedSetupCmds.has(pkgSetup)) {
          setupCommands.push(pkgSetup);
          processedSetupCmds.add(pkgSetup);
        }
      }
    }

    // Add source-level setup command if needed (only once per source)
    if (setupCmd && !processedSetupCmds.has(sourceSlug)) {
      const srcSetup = resolveSetupCmd(setupCmd, distro.family);
      if (srcSetup) {
        setupCommands.push(srcSetup);
      }
      processedSetupCmds.add(sourceSlug);
    }

    // Build the install command
    const packageList = packageIdentifiers.join(' ');
    // Use shared sudo logic (SHARED FUNCTION)
    const fullCommand = shouldUseSudo(firstPkg.requireSudo, os)
      ? `sudo ${installCmd} ${packageList}`
      : `${installCmd} ${packageList}`;

    commands.push(fullCommand);

    // Add to breakdown (one entry per package)
    for (const pkg of pkgs) {
      breakdown.push({
        source: pkg.sourceName,
        packages: [pkg.packageIdentifier],
        appId: pkg.appId,
        appName: pkg.appName,
        packageId: pkg.packageId,
        distroId: distro.id,
      });
    }
  }

  return {
    commands,
    setupCommands,
    warnings,
    breakdown,
  };
}
