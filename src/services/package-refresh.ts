/**
 * Package Refresh Service
 * Handles updating package metadata from external APIs
 */

import { db } from '@/db';
import { packages, sources, refreshLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getFlathubAppMetadata, checkFlathubAvailability } from './external-apis/flathub';
import { getSnapcraftPackageMetadata, checkSnapcraftAvailability } from './external-apis/snapcraft';
import { getAURPackageMetadata, checkAURAvailability } from './external-apis/aur';

interface SourceRecord {
  id: string;
  name: string;
  slug: string;
}

interface PackageRecord {
  id: string;
  identifier: string;
  version: string | null;
  size: number | null;
  maintainer: string | null;
  isAvailable: boolean | null;
  lastChecked: Date | null;
  metadata: unknown;
}

export interface RefreshResult {
  sourceId: string;
  sourceName: string;
  packagesChecked: number;
  packagesUpdated: number;
  errors: string[];
  duration: number;
}

export interface RefreshOptions {
  sourceId?: string; // If specified, only refresh packages from this source
  dryRun?: boolean; // If true, don't actually update the database
}

/**
 * Refresh package metadata from external APIs
 */
export async function refreshPackages(options: RefreshOptions = {}): Promise<RefreshResult[]> {
  const results: RefreshResult[] = [];

  try {
    // Get sources to refresh
    let sourcesToRefresh;
    if (options.sourceId) {
      sourcesToRefresh = await db.query.sources.findMany({
        where: eq(sources.id, options.sourceId),
      });
    } else {
      // Only refresh sources with API endpoints
      sourcesToRefresh = await db.query.sources.findMany();
    }

    // Filter to only sources with API endpoints
    const apiSources = sourcesToRefresh.filter(
      (source) => source.apiEndpoint && source.apiEndpoint.trim().length > 0
    );

    for (const source of apiSources) {
      const sourceResult = await refreshSourcePackages(source, options.dryRun || false);
      results.push(sourceResult);

      // Log the refresh
      if (!options.dryRun) {
        await logRefresh(sourceResult);
      }
    }

    return results;
  } catch (error) {
    console.error('Package refresh error:', error);
    throw error;
  }
}

/**
 * Refresh packages for a specific source
 */
async function refreshSourcePackages(
  source: SourceRecord,
  dryRun: boolean
): Promise<RefreshResult> {
  const sourceStartTime = Date.now();
  const result: RefreshResult = {
    sourceId: source.id,
    sourceName: source.name,
    packagesChecked: 0,
    packagesUpdated: 0,
    errors: [],
    duration: 0,
  };

  try {
    // Get all packages for this source
    const sourcePackages = await db.query.packages.findMany({
      where: eq(packages.sourceId, source.id),
      with: {
        app: true,
      },
    });

    result.packagesChecked = sourcePackages.length;

    // Refresh each package based on source type
    for (const pkg of sourcePackages) {
      try {
        const updated = await refreshSinglePackage(pkg, source, dryRun);
        if (updated) {
          result.packagesUpdated++;
        }
      } catch (error) {
        const errorMsg = `${pkg.identifier}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.error(`Error refreshing package ${pkg.identifier}:`, error);
      }

      // Small delay to avoid rate limiting (100ms between requests)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMsg);
    console.error(`Error refreshing source ${source.name}:`, error);
  }

  result.duration = Date.now() - sourceStartTime;
  return result;
}

/**
 * Refresh a single package
 */
async function refreshSinglePackage(
  pkg: PackageRecord,
  source: SourceRecord,
  dryRun: boolean
): Promise<boolean> {
  let metadata = null;
  let isAvailable = false;

  // Fetch metadata based on source type
  switch (source.slug) {
    case 'flatpak':
      metadata = await getFlathubAppMetadata(pkg.identifier);
      isAvailable = metadata !== null;
      break;

    case 'snap':
      metadata = await getSnapcraftPackageMetadata(pkg.identifier);
      isAvailable = metadata !== null;
      break;

    case 'aur':
      metadata = await getAURPackageMetadata(pkg.identifier);
      isAvailable = metadata !== null;
      break;

    default:
      // For native package managers (apt, dnf, pacman, etc.), we can't easily check availability
      // without actually running commands on the system. Skip these for now.
      return false;
  }

  // Check if anything changed
  const hasChanges =
    (pkg.isAvailable ?? false) !== (isAvailable ?? false) ||
    (metadata !== null && pkg.version !== metadata.version);

  if (hasChanges && !dryRun) {
    // Update the package
    await db
      .update(packages)
      .set({
        isAvailable: isAvailable ?? false,
        version: metadata?.version || pkg.version,
        size: metadata?.downloadSize || pkg.size,
        maintainer: metadata?.maintainer || pkg.maintainer,
        lastChecked: new Date(),
        metadata: metadata?.metadata || pkg.metadata,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, pkg.id));

    return true;
  }

  // Even if nothing changed, update lastChecked
  if (!dryRun) {
    await db
      .update(packages)
      .set({
        lastChecked: new Date(),
      })
      .where(eq(packages.id, pkg.id));
  }

  return hasChanges;
}

/**
 * Log a refresh operation
 */
async function logRefresh(result: RefreshResult): Promise<void> {
  const status = result.errors.length === 0 ? 'success' : 'partial';
  const errorMessage =
    result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null;

  await db.insert(refreshLogs).values({
    sourceId: result.sourceId,
    status,
    packagesUpdated: result.packagesUpdated,
    errorMessage,
    startedAt: new Date(Date.now() - result.duration),
    completedAt: new Date(),
  });
}

/**
 * Get recent refresh logs
 */
export async function getRefreshLogs(limit: number = 50) {
  const logs = await db.query.refreshLogs.findMany({
    orderBy: (logs, { desc }) => [desc(logs.startedAt)],
    limit,
    with: {
      source: true,
    },
  });

  return logs;
}

/**
 * Check the availability of a specific package
 */
export async function checkPackageAvailability(
  packageId: string
): Promise<{ available: boolean; version?: string }> {
  const pkg = await db.query.packages.findFirst({
    where: eq(packages.id, packageId),
    with: {
      source: true,
    },
  });

  if (!pkg) {
    throw new Error('Package not found');
  }

  let available = false;
  let version: string | undefined;

  switch (pkg.source.slug) {
    case 'flatpak':
      available = await checkFlathubAvailability(pkg.identifier);
      if (available) {
        const metadata = await getFlathubAppMetadata(pkg.identifier);
        version = metadata?.version;
      }
      break;

    case 'snap':
      available = await checkSnapcraftAvailability(pkg.identifier);
      if (available) {
        const metadata = await getSnapcraftPackageMetadata(pkg.identifier);
        version = metadata?.version;
      }
      break;

    case 'aur':
      available = await checkAURAvailability(pkg.identifier);
      if (available) {
        const metadata = await getAURPackageMetadata(pkg.identifier);
        version = metadata?.version;
      }
      break;

    default:
      // For native package managers, assume available
      available = true;
      version = pkg.version || undefined;
      break;
  }

  return { available, version };
}
