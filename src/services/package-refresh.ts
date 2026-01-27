/**
 * Package Refresh Service
 * Handles updating package metadata from external APIs
 */

import { db } from '@/db';
import { packages, sources, refreshLogs, apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getRefreshStrategy } from './refresh-strategies';
import type { RefreshResult, RefreshOptions } from '@/types/entities';
import { uploadImageFromUrl } from '@/lib/blob';

// Re-export for backward compatibility
export type { RefreshResult, RefreshOptions };

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
  app: {
    id: string;
    slug: string;
    iconUrl: string | null;
  };
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

      // Small delay between packages
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
 * Refresh a single package using the appropriate strategy
 */
async function refreshSinglePackage(
  pkg: PackageRecord,
  source: SourceRecord,
  dryRun: boolean
): Promise<boolean> {
  // Get the refresh strategy for this source
  const strategy = getRefreshStrategy(source.slug);

  // If no strategy exists, skip (e.g., for native package managers)
  if (!strategy) {
    return false;
  }

  // Fetch metadata using the strategy
  const metadata = await strategy.getMetadata(pkg.identifier);
  const isAvailable = metadata !== null;

  console.log(`[Refresh] ${source.slug}:${pkg.identifier} - Available: ${isAvailable}, Has metadata: ${!!metadata}`);

  // Store the full metadata object with all rich information
  // (license, screenshots, categories, releaseDate, etc.)
  const fullMetadata = metadata ? {
    license: metadata.license,
    screenshots: metadata.screenshots,
    categories: metadata.categories,
    releaseDate: metadata.releaseDate,
    description: metadata.description,
    summary: metadata.summary,
    homepage: metadata.homepage,
    iconUrl: metadata.iconUrl,
    ...metadata.metadata, // Include any source-specific extras
  } : pkg.metadata;

  // Check if anything significant changed (version or availability)
  const hasVersionChange =
    (pkg.isAvailable ?? false) !== (isAvailable ?? false) ||
    (metadata !== null && pkg.version !== metadata.version);

  // Always update if we have metadata from the API
  // This ensures we populate metadata even if version hasn't changed
  if (metadata && !dryRun) {
    await db
      .update(packages)
      .set({
        isAvailable: isAvailable ?? false,
        version: metadata.version || pkg.version,
        size: metadata.downloadSize || pkg.size,
        maintainer: metadata.maintainer || pkg.maintainer,
        lastChecked: new Date(),
        metadata: fullMetadata,
        updatedAt: new Date(),
      })
      .where(eq(packages.id, pkg.id));

    return true;
  }

  // If no metadata from API but not dry run, still update lastChecked
  if (!dryRun) {
    await db
      .update(packages)
      .set({
        lastChecked: new Date(),
      })
      .where(eq(packages.id, pkg.id));
  }

  return hasVersionChange;
}

/**
 * Sync app icon by downloading from external URL and uploading to Azure Blob Storage
 */
export async function syncAppIcon(
  appId: string,
  appSlug: string,
  iconUrl: string
): Promise<void> {
  try {
    console.log(`[Icon Sync] Syncing icon for app ${appSlug} from ${iconUrl}`);

    // Download icon from URL and upload to Azure Blob Storage
    const uploadResult = await uploadImageFromUrl(iconUrl, appSlug);

    if (uploadResult) {
      // Extract the best URL to use: prefer 64px variant for display, fallback to original for SVG
      const urlToStore = uploadResult.variants[64] || uploadResult.original;

      // Update app's iconUrl with the Azure Blob Storage URL
      await db
        .update(apps)
        .set({
          iconUrl: urlToStore,
          updatedAt: new Date(),
        })
        .where(eq(apps.id, appId));

      console.log(`[Icon Sync] Successfully updated icon for app ${appSlug}: ${urlToStore}`);
    }
  } catch (error) {
    // Silent fail - just log and continue
    console.error(`[Icon Sync] Failed to sync icon for app ${appSlug}:`, error);
  }
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
 * Check the availability of a specific package using the appropriate strategy
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

  // Get the refresh strategy for this source
  const strategy = getRefreshStrategy(pkg.source.slug);

  // If no strategy exists, assume available (e.g., for native package managers)
  if (!strategy) {
    return {
      available: true,
      version: pkg.version || undefined,
    };
  }

  // Check availability using the strategy
  const available = await strategy.checkAvailability(pkg.identifier);
  let version: string | undefined;

  if (available) {
    const metadata = await strategy.getMetadata(pkg.identifier);
    version = metadata?.version;
  }

  return { available, version };
}
