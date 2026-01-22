#!/usr/bin/env bun
/**
 * Batch Package Discovery by Category
 *
 * This script discovers packages for all apps in a specific category.
 * Useful for focusing on specific types of applications.
 *
 * Usage:
 *   bun scripts/package-discovery/discover-by-category.ts <category>
 *   bun scripts/package-discovery/discover-by-category.ts browsers
 *   bun scripts/package-discovery/discover-by-category.ts --list-categories
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { searchFlathub } from '../../src/services/external-apis/flathub';
import { searchSnapcraft } from '../../src/services/external-apis/snapcraft';
import { searchAUR } from '../../src/services/external-apis/aur';

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
  category: string;
  discoveries: {
    flatpak?: string[];
    snap?: string[];
    aur?: string[];
  };
  existing: {
    flatpak?: string;
    snap?: string;
    aur?: string;
  };
  hasNewFindings: boolean;
}

function loadApps(): App[] {
  const path = join(process.cwd(), 'seed/apps.json');
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function loadPackages(source: string): Map<string, PackageEntry> {
  try {
    const path = join(process.cwd(), `seed/packages/${source}.json`);
    const packages: PackageEntry[] = JSON.parse(readFileSync(path, 'utf-8'));
    const map = new Map<string, PackageEntry>();
    packages.forEach(pkg => map.set(pkg.app, pkg));
    return map;
  } catch {
    return new Map();
  }
}

function listCategories(apps: App[]) {
  const categories = new Map<string, number>();
  apps.forEach(app => {
    categories.set(app.category, (categories.get(app.category) || 0) + 1);
  });

  console.log('\nAvailable categories:\n');
  const sorted = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([category, count]) => {
    console.log(`  ${category.padEnd(20)} (${count} apps)`);
  });
}

async function discoverForCategory(category: string) {
  const apps = loadApps();
  const categoryApps = apps.filter(app => app.category === category);

  if (categoryApps.length === 0) {
    console.error(`\nNo apps found in category: ${category}`);
    console.log('\nUse --list-categories to see available categories');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Discovering packages for category: ${category}`);
  console.log(`Total apps: ${categoryApps.length}`);
  console.log('='.repeat(80));

  const flatpakPackages = loadPackages('flatpak');
  const snapPackages = loadPackages('snap');
  const aurPackages = loadPackages('aur');

  const results: DiscoveryResult[] = [];

  for (let i = 0; i < categoryApps.length; i++) {
    const app = categoryApps[i];
    console.log(`\n[${i + 1}/${categoryApps.length}] ${app.displayName} (${app.slug})`);

    const result: DiscoveryResult = {
      app: app.slug,
      displayName: app.displayName,
      category: app.category,
      discoveries: {},
      existing: {},
      hasNewFindings: false,
    };

    // Check Flatpak
    try {
      console.log('  Checking Flathub...');
      const existing = flatpakPackages.get(app.slug);
      result.existing.flatpak = existing?.identifier;

      const flatpakResults = await searchFlathub(app.slug);
      if (flatpakResults.length > 0) {
        result.discoveries.flatpak = flatpakResults
          .slice(0, 3)
          .map(pkg => `${pkg.identifier} (${pkg.name})`);

        if (!existing) {
          result.hasNewFindings = true;
          console.log(`    ✨ Found: ${flatpakResults[0].identifier}`);
        } else {
          console.log(`    ✓ Existing: ${existing.identifier}`);
        }
      }
    } catch (error) {
      console.error(`    ❌ Error: ${error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check Snap
    try {
      console.log('  Checking Snapcraft...');
      const existing = snapPackages.get(app.slug);
      result.existing.snap = existing?.identifier;

      const snapResults = await searchSnapcraft(app.slug);
      if (snapResults.length > 0) {
        result.discoveries.snap = snapResults
          .slice(0, 3)
          .map(pkg => `${pkg.identifier} (${pkg.name})`);

        if (!existing) {
          result.hasNewFindings = true;
          console.log(`    ✨ Found: ${snapResults[0].identifier}`);
        } else {
          console.log(`    ✓ Existing: ${existing.identifier}`);
        }
      }
    } catch (error) {
      console.error(`    ❌ Error: ${error}`);
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // Check AUR
    try {
      console.log('  Checking AUR...');
      const existing = aurPackages.get(app.slug);
      result.existing.aur = existing?.identifier;

      const aurResults = await searchAUR(app.slug);
      if (aurResults.length > 0) {
        result.discoveries.aur = aurResults
          .slice(0, 3)
          .map(pkg => `${pkg.identifier} (${pkg.name})`);

        if (!existing) {
          result.hasNewFindings = true;
          console.log(`    ✨ Found: ${aurResults[0].identifier}`);
        } else {
          console.log(`    ✓ Existing: ${existing.identifier}`);
        }
      }
    } catch (error) {
      console.error(`    ❌ Error: ${error}`);
    }

    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Print summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('DISCOVERY SUMMARY');
  console.log('='.repeat(80));

  const newFindings = results.filter(r => r.hasNewFindings);
  console.log(`\nApps with new package discoveries: ${newFindings.length} / ${results.length}`);

  if (newFindings.length > 0) {
    console.log('\nNew packages found for:');
    newFindings.forEach(result => {
      console.log(`\n  ${result.displayName} (${result.app}):`);

      if (result.discoveries.flatpak && !result.existing.flatpak) {
        console.log(`    Flatpak: ${result.discoveries.flatpak[0]}`);
      }

      if (result.discoveries.snap && !result.existing.snap) {
        console.log(`    Snap: ${result.discoveries.snap[0]}`);
      }

      if (result.discoveries.aur && !result.existing.aur) {
        console.log(`    AUR: ${result.discoveries.aur[0]}`);
      }
    });
  }

  // Save results
  const filename = `discovery-${category}-${Date.now()}.json`;
  const reportsDir = join(process.cwd(), '.reports');
  mkdirSync(reportsDir, { recursive: true });
  const outputPath = join(reportsDir, filename);
  writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n\nResults saved to: .reports/${filename}`);

  // Generate missing packages report
  console.log(`\n${'='.repeat(80)}`);
  console.log('MISSING PACKAGES REPORT');
  console.log('='.repeat(80));

  const missingFlatpak = results.filter(r => !r.existing.flatpak && r.discoveries.flatpak);
  const missingSnap = results.filter(r => !r.existing.snap && r.discoveries.snap);
  const missingAur = results.filter(r => !r.existing.aur && r.discoveries.aur);

  console.log(`\nFlatpak: ${missingFlatpak.length} apps missing`);
  console.log(`Snap: ${missingSnap.length} apps missing`);
  console.log(`AUR: ${missingAur.length} apps missing`);

  // Generate seed file additions
  if (missingFlatpak.length > 0 || missingSnap.length > 0 || missingAur.length > 0) {
    console.log('\n\nSuggested additions to seed files:\n');

    if (missingFlatpak.length > 0) {
      console.log('// Add to seed/packages/flatpak.json:');
      missingFlatpak.forEach(r => {
        if (r.discoveries.flatpak) {
          const pkgId = r.discoveries.flatpak[0].split(' ')[0];
          console.log(`  { "app": "${r.app}", "identifier": "${pkgId}", "isAvailable": true, "source": "flatpak" },`);
        }
      });
      console.log('');
    }

    if (missingSnap.length > 0) {
      console.log('// Add to seed/packages/snap.json:');
      missingSnap.forEach(r => {
        if (r.discoveries.snap) {
          const pkgId = r.discoveries.snap[0].split(' ')[0];
          console.log(`  { "app": "${r.app}", "identifier": "${pkgId}", "isAvailable": true, "source": "snap" },`);
        }
      });
      console.log('');
    }

    if (missingAur.length > 0) {
      console.log('// Add to seed/packages/aur.json:');
      missingAur.forEach(r => {
        if (r.discoveries.aur) {
          const pkgId = r.discoveries.aur[0].split(' ')[0];
          console.log(`  { "app": "${r.app}", "identifier": "${pkgId}", "isAvailable": true, "source": "aur" },`);
        }
      });
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--list-categories') || args.length === 0) {
    const apps = loadApps();
    listCategories(apps);
    return;
  }

  const category = args[0];
  await discoverForCategory(category);
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});