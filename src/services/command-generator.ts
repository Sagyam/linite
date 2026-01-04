import { db } from '@/db';
import { apps, packages, distros } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { parsePackageMetadata, type StoredPackageMetadata } from '@/lib/package-metadata';
import type {
  GenerateCommandRequest,
  GenerateCommandResponse,
  PackageBreakdown,
} from '@/types/entities';

// Re-export for backward compatibility
export type { GenerateCommandRequest, GenerateCommandResponse, PackageBreakdown };

interface SelectedPackage {
  appName: string;
  packageIdentifier: string;
  sourceName: string;
  sourceSlug: string;
  installCmd: string;
  requireSudo: boolean;
  setupCmd: string | null;
  priority: number;
  metadata?: unknown;
}

/**
 * Generates install commands for selected apps based on distro and source preferences
 */
// Helper function to get Nix command templates based on installation method
function getNixCommandTemplate(method: 'nix-shell' | 'nix-env' | 'nix-flakes' | null) {
  switch (method) {
    case 'nix-env':
      return {
        installCmd: 'nix-env -iA nixpkgs.',
        setupCmd: 'nix-channel --update',
      };
    case 'nix-flakes':
      return {
        installCmd: 'nix profile install nixpkgs#',
        setupCmd: 'nix-channel --update && echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf',
      };
    case 'nix-shell':
    default:
      return {
        installCmd: 'nix-shell -p',
        setupCmd: null,
      };
  }
}

export async function generateInstallCommands(
  request: GenerateCommandRequest
): Promise<GenerateCommandResponse> {
  const { distroSlug, appIds, sourcePreference, nixosInstallMethod } = request;

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

  // 4. Select the best package for each app
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

    // Calculate priority for each package
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

    selectedPackages.push({
      appName: app.displayName,
      packageIdentifier: bestPackage.identifier,
      sourceName: bestPackage.source.name,
      sourceSlug: bestPackage.source.slug,
      installCmd: bestPackage.source.installCmd,
      requireSudo: bestPackage.source.requireSudo ?? false,
      setupCmd: bestPackage.source.setupCmd ?? null,
      priority: bestPackage.calculatedPriority ?? 0,
      metadata: bestPackage.metadata,
    });
  }

  // 5. Group packages by source
  const packagesBySource = new Map<string, SelectedPackage[]>();

  for (const pkg of selectedPackages) {
    const existing = packagesBySource.get(pkg.sourceSlug) || [];
    existing.push(pkg);
    packagesBySource.set(pkg.sourceSlug, existing);
  }

  // 6. Generate install commands for each source
  const commands: string[] = [];
  const setupCommands: string[] = [];
  const breakdown: PackageBreakdown[] = [];
  const processedSetupCmds = new Set<string>();

  // Determine OS based on distro (simplified logic)
  const isWindows = distro.slug === 'windows';
  const os = isWindows ? 'windows' : 'linux';

  for (const [sourceSlug, pkgs] of packagesBySource.entries()) {
    const firstPkg = pkgs[0];
    const packageIdentifiers = pkgs.map((p) => p.packageIdentifier);

    // For Nix source, use the command template based on installation method
    let installCmd = firstPkg.installCmd;
    let setupCmd = firstPkg.setupCmd;

    if (sourceSlug === 'nix' && nixosInstallMethod) {
      const nixTemplate = getNixCommandTemplate(nixosInstallMethod);
      installCmd = nixTemplate.installCmd;
      setupCmd = nixTemplate.setupCmd;
    }

    // Handle script source specially
    if (sourceSlug === 'script') {
      // For script source, generate individual commands for each package
      for (const pkg of pkgs) {
        // Parse metadata safely
        const metadata = parsePackageMetadata(pkg.metadata);

        const scriptUrl = metadata.scriptUrl?.[os];
        if (scriptUrl) {
          let scriptCommand: string;
          if (isWindows) {
            // Windows PowerShell command
            if (scriptUrl.endsWith('.exe')) {
              // Direct download and run executable
              scriptCommand = `irm ${scriptUrl} -OutFile installer.exe; .\\installer.exe`;
            } else {
              // Run script directly
              scriptCommand = `irm ${scriptUrl} | iex`;
            }
          } else {
            // Linux curl command
            scriptCommand = `curl -fsSL ${scriptUrl} | bash`;
          }
          commands.push(scriptCommand);
        } else {
          warnings.push(`${pkg.appName}: No install script available for ${os}`);
        }
      }

      // Add to breakdown
      breakdown.push({
        source: firstPkg.sourceName,
        packages: packageIdentifiers,
      });

      continue; // Skip normal command generation for script source
    }

    // Add setup command if needed (only once per source)
    if (setupCmd && !processedSetupCmds.has(sourceSlug)) {
      setupCommands.push(setupCmd);
      processedSetupCmds.add(sourceSlug);
    }

    // Build the install command
    const packageList = packageIdentifiers.join(' ');
    const fullCommand = firstPkg.requireSudo
      ? `sudo ${installCmd} ${packageList}`
      : `${installCmd} ${packageList}`;

    commands.push(fullCommand);

    // Add to breakdown
    breakdown.push({
      source: firstPkg.sourceName,
      packages: packageIdentifiers,
    });
  }

  return {
    commands,
    setupCommands,
    warnings,
    breakdown,
  };
}
