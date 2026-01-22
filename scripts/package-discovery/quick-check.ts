#!/usr/bin/env bun
/**
 * Quick Package Check
 *
 * Quickly check which sources have packages for a specific app
 *
 * Usage:
 *   bun scripts/package-discovery/quick-check.ts <app-slug>
 *   bun scripts/package-discovery/quick-check.ts firefox
 *   bun scripts/package-discovery/quick-check.ts --missing
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface App {
  slug: string;
  displayName: string;
  description: string;
  category: string;
}

interface PackageEntry {
  app: string;
  identifier: string;
  isAvailable: boolean;
  source: string;
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

function quickCheck(appSlug: string) {
  const apps = loadApps();
  const app = apps.find(a => a.slug === appSlug);

  if (!app) {
    console.error(`\nApp not found: ${appSlug}`);
    console.log('\nSuggestions:');
    const similar = apps.filter(a =>
      a.slug.includes(appSlug) || a.displayName.toLowerCase().includes(appSlug.toLowerCase())
    );
    similar.slice(0, 5).forEach(a => console.log(`  - ${a.slug} (${a.displayName})`));
    process.exit(1);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`App: ${app.displayName}`);
  console.log(`Slug: ${app.slug}`);
  console.log(`Category: ${app.category}`);
  console.log('='.repeat(80));

  const sources = ['flatpak', 'snap', 'aur', 'apt', 'dnf', 'pacman', 'zypper', 'homebrew', 'nix', 'script'];
  const results: Array<{ source: string; has: boolean; identifier?: string }> = [];

  for (const source of sources) {
    const packages = loadPackages(source);
    const pkg = packages.get(appSlug);

    results.push({
      source,
      has: !!pkg,
      identifier: pkg?.identifier,
    });
  }

  console.log('\nPackage Availability:\n');

  const maxSourceLength = Math.max(...sources.map(s => s.length));

  results.forEach(({ source, has, identifier }) => {
    const status = has ? '✅' : '❌';
    const info = identifier ? `: ${identifier}` : '';
    console.log(`  ${status} ${source.padEnd(maxSourceLength)}${info}`);
  });

  const available = results.filter(r => r.has).length;
  const total = results.length;
  const percentage = Math.round((available / total) * 100);

  console.log(`\nCoverage: ${available}/${total} sources (${percentage}%)`);

  if (available < total) {
    console.log('\nMissing from:');
    results
      .filter(r => !r.has)
      .forEach(r => console.log(`  - ${r.source}`));
  }
}

function showMissingSourcesStats() {
  const apps = loadApps();
  const sources = ['flatpak', 'snap', 'aur', 'apt', 'dnf', 'pacman', 'zypper', 'homebrew', 'nix', 'script'];

  console.log('\n' + '='.repeat(80));
  console.log('APPS WITH LEAST COVERAGE');
  console.log('='.repeat(80));

  const appCoverage = apps.map(app => {
    let count = 0;
    sources.forEach(source => {
      const packages = loadPackages(source);
      if (packages.has(app.slug)) count++;
    });

    return {
      app: app.slug,
      displayName: app.displayName,
      category: app.category,
      coverage: count,
      percentage: Math.round((count / sources.length) * 100),
    };
  });

  // Sort by coverage (ascending)
  appCoverage.sort((a, b) => a.coverage - b.coverage);

  console.log('\nApps with lowest package coverage (need attention):\n');

  appCoverage.slice(0, 30).forEach((item, index) => {
    const bar = '█'.repeat(Math.floor(item.percentage / 10));
    console.log(
      `${(index + 1).toString().padStart(3)}. ${item.displayName.padEnd(30)} ` +
      `${item.coverage}/${sources.length} (${item.percentage}%) ${bar} [${item.category}]`
    );
  });

  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATION');
  console.log('='.repeat(80));

  const needsWork = appCoverage.filter(a => a.coverage <= 3);
  console.log(`\n${needsWork.length} apps have 3 or fewer package sources.`);
  console.log('Run package discovery for these apps to improve coverage:\n');

  needsWork.slice(0, 10).forEach(item => {
    console.log(`  bun scripts/package-discovery/discover-packages.ts ${item.app}`);
  });

  if (needsWork.length > 10) {
    console.log(`  ... and ${needsWork.length - 10} more`);
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes('--missing') || args.includes('--worst')) {
    showMissingSourcesStats();
    return;
  }

  if (args.length === 0) {
    console.log('Quick Package Check\n');
    console.log('Usage:');
    console.log('  bun scripts/package-discovery/quick-check.ts <app-slug>    # Check specific app');
    console.log('  bun scripts/package-discovery/quick-check.ts --missing     # Show apps with worst coverage');
    console.log('\nExamples:');
    console.log('  bun scripts/package-discovery/quick-check.ts firefox');
    console.log('  bun scripts/package-discovery/quick-check.ts vscode');
    console.log('  bun scripts/package-discovery/quick-check.ts --missing');
    return;
  }

  const appSlug = args[0];
  quickCheck(appSlug);
}

main();