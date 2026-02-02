#!/usr/bin/env bun
/**
 * Package Discovery Script
 *
 * This script helps discover new packages for existing apps by:
 * 1. Reading all apps from seed/apps.json
 * 2. Reading existing package mappings from seed/packages/*.json
 * 3. Searching external APIs (Flathub, Snapcraft, AUR, Repology) for packages
 * 4. Comparing found packages with existing data
 * 5. Reporting missing packages that could be added
 *
 * Usage:
 *   bun scripts/package-discovery/discover-packages.ts [app-slug]
 *   bun scripts/package-discovery/discover-packages.ts --all
 *   bun scripts/package-discovery/discover-packages.ts --coverage
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { searchFlathub } from '../../src/services/external-apis/flathub';
import { searchSnapcraft } from '../../src/services/external-apis/snapcraft';
import { searchAUR } from '../../src/services/external-apis/aur';
import { searchRepology } from '../../src/services/external-apis/repology';

// Types
interface App {
  slug: string;
  displayName: string;
  description: string;
  category: string;
  homepage: string;
  isFoss: boolean;
  isPopular: boolean;
  iconUrl: string | null;
}

interface PackageEntry {
  app: string;
  identifier: string;
  isAvailable: boolean;
  source: string;
  metadata?: Record<string, unknown>;
}

interface DiscoveryResult {
  app: string;
  displayName: string;
  source: 'flatpak' | 'snap' | 'aur' | 'repology';
  existingPackage: string | null;
  suggestedPackages: Array<{
    identifier: string;
    name: string;
    summary?: string;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>;
}

interface CoverageStats {
  totalApps: number;
  coverageBySource: Record<string, {
    count: number;
    percentage: number;
    missingApps: string[];
  }>;
}

// Load data files
function loadApps(): App[] {
  const path = join(process.cwd(), 'seed/apps.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function loadPackages(source: string): PackageEntry[] {
  try {
    const path = join(process.cwd(), `seed/packages/${source}.json`);
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return [];
  }
}

function getAllPackages(): Map<string, Map<string, PackageEntry>> {
  const sources = ['flatpak', 'snap', 'aur', 'apt', 'dnf', 'pacman', 'zypper', 'homebrew', 'nix', 'script'];
  const result = new Map<string, Map<string, PackageEntry>>();

  for (const source of sources) {
    const packages = loadPackages(source);
    const sourceMap = new Map<string, PackageEntry>();

    for (const pkg of packages) {
      sourceMap.set(pkg.app, pkg);
    }

    result.set(source, sourceMap);
  }

  return result;
}

// Calculate confidence score for a match
function calculateConfidence(
  appName: string,
  appSlug: string,
  packageName: string,
  packageSummary?: string
): { confidence: 'high' | 'medium' | 'low'; reason: string } {
  const normalizeForComparison = (str: string | null | undefined) =>
    (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const normalizedAppName = normalizeForComparison(appName);
  const normalizedSlug = normalizeForComparison(appSlug);
  const normalizedPackageName = normalizeForComparison(packageName);
  const normalizedSummary = normalizeForComparison(packageSummary);

  // High confidence: exact match
  if (normalizedPackageName === normalizedSlug ||
      normalizedPackageName === normalizedAppName) {
    return { confidence: 'high', reason: 'Exact name match' };
  }

  // High confidence: slug is contained in package name
  if (normalizedPackageName.includes(normalizedSlug) &&
      normalizedSlug.length > 3) {
    return { confidence: 'high', reason: 'Slug matches package name' };
  }

  // Medium confidence: app name in package name
  if (normalizedPackageName.includes(normalizedAppName) ||
      normalizedAppName.includes(normalizedPackageName)) {
    return { confidence: 'medium', reason: 'Partial name match' };
  }

  // Medium confidence: matches in summary
  if (normalizedSummary.includes(normalizedAppName) ||
      normalizedSummary.includes(normalizedSlug)) {
    return { confidence: 'medium', reason: 'Name found in description' };
  }

  // Low confidence: some keywords match
  const appWords = normalizedAppName.split(/\s+/).filter(w => w.length > 3);
  const pkgWords = normalizedPackageName.split(/\s+/).filter(w => w.length > 3);
  const matchingWords = appWords.filter(w => pkgWords.some(p => p.includes(w) || w.includes(p)));

  if (matchingWords.length > 0) {
    return { confidence: 'low', reason: `Keyword match: ${matchingWords.join(', ')}` };
  }

  return { confidence: 'low', reason: 'Appears in search results' };
}

// Discover packages for a single app
async function discoverPackagesForApp(app: App, existingPackages: Map<string, Map<string, PackageEntry>>): Promise<DiscoveryResult[]> {
  const results: DiscoveryResult[] = [];
  const searchQuery = app.slug;

  console.log(`\nSearching for: ${app.displayName} (${app.slug})`);

  // Search Flathub
  try {
    console.log('  - Checking Flathub...');
    const flatpakResults = await searchFlathub(searchQuery);
    const existing = existingPackages.get('flatpak')?.get(app.slug);

    const suggestions = flatpakResults.slice(0, 5).map(pkg => {
      const { confidence, reason } = calculateConfidence(
        app.displayName,
        app.slug,
        pkg.name,
        pkg.summary
      );
      return {
        identifier: pkg.identifier,
        name: pkg.name,
        summary: pkg.summary,
        confidence,
        reason,
      };
    });

    if (suggestions.length > 0) {
      results.push({
        app: app.slug,
        displayName: app.displayName,
        source: 'flatpak',
        existingPackage: existing?.identifier || null,
        suggestedPackages: suggestions,
      });
    } else {
      console.log('    No results found');
    }
  } catch {
    console.log('    ⚠️  Flathub search unavailable (API may be down)');
  }

  // Add delay to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 500));

  // Search Snapcraft
  try {
    console.log('  - Checking Snapcraft...');
    const snapResults = await searchSnapcraft(searchQuery);
    const existing = existingPackages.get('snap')?.get(app.slug);

    const suggestions = snapResults.slice(0, 5).map(pkg => {
      const { confidence, reason } = calculateConfidence(
        app.displayName,
        app.slug,
        pkg.name,
        pkg.summary
      );
      return {
        identifier: pkg.identifier,
        name: pkg.name,
        summary: pkg.summary,
        confidence,
        reason,
      };
    });

    if (suggestions.length > 0) {
      results.push({
        app: app.slug,
        displayName: app.displayName,
        source: 'snap',
        existingPackage: existing?.identifier || null,
        suggestedPackages: suggestions,
      });
    }
  } catch (error) {
    console.error(`    Error searching Snapcraft: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  // Search AUR
  try {
    console.log('  - Checking AUR...');
    const aurResults = await searchAUR(searchQuery);
    const existing = existingPackages.get('aur')?.get(app.slug);

    const suggestions = aurResults.slice(0, 5).map(pkg => {
      const { confidence, reason } = calculateConfidence(
        app.displayName,
        app.slug,
        pkg.name,
        pkg.summary
      );
      return {
        identifier: pkg.identifier,
        name: pkg.name,
        summary: pkg.summary,
        confidence,
        reason,
      };
    });

    if (suggestions.length > 0) {
      results.push({
        app: app.slug,
        displayName: app.displayName,
        source: 'aur',
        existingPackage: existing?.identifier || null,
        suggestedPackages: suggestions,
      });
    }
  } catch (error) {
    console.error(`    Error searching AUR: ${error}`);
  }

  await new Promise(resolve => setTimeout(resolve, 500));

  // Search Repology
  try {
    console.log('  - Checking Repology...');
    const repologyResults = await searchRepology(searchQuery);

    const suggestions = repologyResults.slice(0, 5).map(pkg => {
      const { confidence, reason } = calculateConfidence(
        app.displayName,
        app.slug,
        pkg.name || pkg.identifier,
        pkg.summary
      );
      return {
        identifier: pkg.identifier,
        name: pkg.name || pkg.identifier,
        summary: pkg.summary,
        confidence,
        reason,
      };
    });

    if (suggestions.length > 0) {
      results.push({
        app: app.slug,
        displayName: app.displayName,
        source: 'repology',
        existingPackage: null,
        suggestedPackages: suggestions,
      });
    } else {
      console.log('    No results found');
    }
  } catch {
    console.log('    ⚠️  Repology search unavailable');
  }

  return results;
}

// Generate coverage report
function generateCoverageReport(apps: App[], packages: Map<string, Map<string, PackageEntry>>): CoverageStats {
  const sources = ['flatpak', 'snap', 'aur', 'apt', 'dnf', 'pacman', 'zypper', 'homebrew', 'nix', 'script'];
  const stats: CoverageStats = {
    totalApps: apps.length,
    coverageBySource: {},
  };

  for (const source of sources) {
    const sourcePackages = packages.get(source) || new Map();
    const coveredApps = new Set(sourcePackages.keys());
    const missingApps = apps
      .filter(app => !coveredApps.has(app.slug))
      .map(app => app.slug);

    stats.coverageBySource[source] = {
      count: coveredApps.size,
      percentage: Math.round((coveredApps.size / apps.length) * 100),
      missingApps,
    };
  }

  return stats;
}

// Print results
function printDiscoveryResults(results: DiscoveryResult[]) {
  console.log('\n' + '='.repeat(80));
  console.log('PACKAGE DISCOVERY RESULTS');
  console.log('='.repeat(80));

  for (const result of results) {
    console.log(`\nApp: ${result.displayName} (${result.app})`);
    console.log(`Source: ${result.source}`);

    if (result.existingPackage) {
      console.log(`Existing package: ${result.existingPackage}`);
    } else {
      console.log('Existing package: NONE');
    }

    console.log('\nSuggested packages:');
    for (const pkg of result.suggestedPackages) {
      const confidenceEmoji =
        pkg.confidence === 'high' ? '✅' :
        pkg.confidence === 'medium' ? '⚠️' : '❓';

      console.log(`  ${confidenceEmoji} [${pkg.confidence.toUpperCase()}] ${pkg.identifier}`);
      console.log(`     Name: ${pkg.name}`);
      if (pkg.summary) {
        console.log(`     Summary: ${pkg.summary.substring(0, 80)}...`);
      }
      console.log(`     Reason: ${pkg.reason}`);
    }
  }
}

function printCoverageReport(stats: CoverageStats) {
  console.log('\n' + '='.repeat(80));
  console.log('PACKAGE COVERAGE REPORT');
  console.log('='.repeat(80));
  console.log(`\nTotal apps: ${stats.totalApps}\n`);

  // Sort by coverage percentage
  const sortedSources = Object.entries(stats.coverageBySource)
    .sort(([, a], [, b]) => b.percentage - a.percentage);

  console.log('Coverage by source:');
  console.log('-'.repeat(80));

  for (const [source, data] of sortedSources) {
    const bar = '█'.repeat(Math.floor(data.percentage / 2));
    console.log(`${source.padEnd(15)} ${data.count.toString().padStart(4)} / ${stats.totalApps} (${data.percentage}%) ${bar}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('MISSING PACKAGES BY SOURCE');
  console.log('='.repeat(80));

  for (const [source, data] of sortedSources) {
    if (data.missingApps.length > 0) {
      console.log(`\n${source} (missing ${data.missingApps.length} apps):`);
      console.log(data.missingApps.slice(0, 20).join(', '));
      if (data.missingApps.length > 20) {
        console.log(`... and ${data.missingApps.length - 20} more`);
      }
    }
  }
}

// Save results to file
function saveResultsToFile(results: DiscoveryResult[], filename: string) {
  const reportsDir = join(process.cwd(), '.reports');
  mkdirSync(reportsDir, { recursive: true });
  const outputPath = join(reportsDir, filename);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: .reports/${filename}`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const appSlug = args[0];

  const apps = loadApps();
  const packages = getAllPackages();

  if (args.includes('--coverage')) {
    // Generate coverage report only
    const stats = generateCoverageReport(apps, packages);
    printCoverageReport(stats);
    return;
  }

  if (args.includes('--all')) {
    // Discover for all apps (WARNING: This will take a long time!)
    console.log('⚠️  WARNING: This will search for ALL apps and may take 30+ minutes!');
    console.log('Consider running this for specific apps or categories instead.\n');

    const allResults: DiscoveryResult[] = [];

    for (const app of apps) {
      const results = await discoverPackagesForApp(app, packages);
      allResults.push(...results);

      // Add delay between apps to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    printDiscoveryResults(allResults);
    saveResultsToFile(allResults, 'package-discovery-results.json');
    return;
  }

  if (appSlug) {
    // Discover for specific app
    const app = apps.find(a => a.slug === appSlug);

    if (!app) {
      console.error(`App not found: ${appSlug}`);
      console.log('\nAvailable apps:');
      apps.slice(0, 10).forEach(a => console.log(`  - ${a.slug} (${a.displayName})`));
      console.log(`  ... and ${apps.length - 10} more`);
      process.exit(1);
    }

    const results = await discoverPackagesForApp(app, packages);
    printDiscoveryResults(results);
    saveResultsToFile(results, `package-discovery-${appSlug}.json`);
    return;
  }

  // Default: show usage
  console.log('Package Discovery Tool\n');
  console.log('Usage:');
  console.log('  bun scripts/discover-packages.ts [app-slug]     # Discover packages for specific app');
  console.log('  bun scripts/discover-packages.ts --coverage      # Show coverage report');
  console.log('  bun scripts/discover-packages.ts --all           # Discover for all apps (slow!)');
  console.log('\nExamples:');
  console.log('  bun scripts/discover-packages.ts firefox');
  console.log('  bun scripts/discover-packages.ts vscode');
  console.log('  bun scripts/discover-packages.ts --coverage');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});