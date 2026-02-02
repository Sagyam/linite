#!/usr/bin/env bun

/**
 * Temporary script to find orphaned packages
 * (packages whose app slugs don't exist in apps.json)
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface App {
  slug: string;
  displayName: string;
  [key: string]: unknown;
}

interface Package {
  app: string;
  identifier: string;
  source: string;
  isAvailable: boolean;
  [key: string]: unknown;
}

interface OrphanedPackage extends Package {
  file: string;
}

async function findOrphanedPackages() {
  console.log('🔍 Finding orphaned packages...\n');

  // Read all app slugs
  const appsData = JSON.parse(readFileSync('./seed/apps.json', 'utf-8')) as App[];
  const validAppSlugs = new Set(appsData.map(app => app.slug));

  console.log(`✅ Found ${validAppSlugs.size} valid app slugs\n`);

  // Read all package files
  const packagesDir = './seed/packages';
  const packageFiles = readdirSync(packagesDir).filter(f => f.endsWith('.json'));

  const orphanedPackages: OrphanedPackage[] = [];
  const malformedPackages: OrphanedPackage[] = [];
  const stats: Record<string, { total: number; orphaned: number; malformed: number }> = {};

  for (const file of packageFiles) {
    const filePath = join(packagesDir, file);
    let packages: Package[];

    try {
      packages = JSON.parse(readFileSync(filePath, 'utf-8')) as Package[];
    } catch (error) {
      console.error(`❌ Error parsing ${file}:`, error);
      continue;
    }

    const source = file.replace('.json', '');
    stats[source] = { total: packages.length, orphaned: 0, malformed: 0 };

    for (const pkg of packages) {
      // Check for malformed app references (leading/trailing spaces)
      const trimmedApp = pkg.app.trim();
      if (trimmedApp !== pkg.app) {
        malformedPackages.push({ ...pkg, file });
        stats[source].malformed++;
      }

      // Check if app exists
      if (!validAppSlugs.has(trimmedApp)) {
        orphanedPackages.push({ ...pkg, file });
        stats[source].orphaned++;
      }
    }
  }

  // Print statistics
  console.log('📊 Statistics by source:');
  console.log('─'.repeat(80));
  console.log(
    'Source'.padEnd(15),
    'Total'.padStart(8),
    'Orphaned'.padStart(10),
    'Malformed'.padStart(12)
  );
  console.log('─'.repeat(80));

  for (const [source, data] of Object.entries(stats).sort()) {
    console.log(
      source.padEnd(15),
      data.total.toString().padStart(8),
      data.orphaned.toString().padStart(10),
      data.malformed.toString().padStart(12)
    );
  }
  console.log('─'.repeat(80));
  console.log(
    'TOTAL'.padEnd(15),
    Object.values(stats).reduce((sum, s) => sum + s.total, 0).toString().padStart(8),
    orphanedPackages.length.toString().padStart(10),
    malformedPackages.length.toString().padStart(12)
  );
  console.log('─'.repeat(80));
  console.log();

  // Print malformed packages
  if (malformedPackages.length > 0) {
    console.log(`⚠️  Found ${malformedPackages.length} malformed package(s) (with extra spaces):\n`);
    for (const pkg of malformedPackages) {
      console.log(`  ${pkg.file}: "${pkg.app}" -> should be "${pkg.app.trim()}"`);
    }
    console.log();
  }

  // Print orphaned packages
  if (orphanedPackages.length > 0) {
    console.log(`❌ Found ${orphanedPackages.length} orphaned package(s):\n`);

    // Group by file
    const byFile = orphanedPackages.reduce((acc, pkg) => {
      if (!acc[pkg.file]) acc[pkg.file] = [];
      acc[pkg.file].push(pkg);
      return acc;
    }, {} as Record<string, OrphanedPackage[]>);

    for (const [file, pkgs] of Object.entries(byFile).sort()) {
      console.log(`  📁 ${file} (${pkgs.length} orphaned):`);
      for (const pkg of pkgs) {
        console.log(`     - app: "${pkg.app.trim()}" (identifier: ${pkg.identifier})`);
      }
      console.log();
    }
  } else {
    console.log('✅ No orphaned packages found!\n');
  }

  // Summary
  console.log('Summary:');
  console.log(`  • Total apps: ${validAppSlugs.size}`);
  console.log(`  • Total packages: ${Object.values(stats).reduce((sum, s) => sum + s.total, 0)}`);
  console.log(`  • Malformed packages: ${malformedPackages.length}`);
  console.log(`  • Orphaned packages: ${orphanedPackages.length}`);

  if (orphanedPackages.length > 0 || malformedPackages.length > 0) {
    console.log('\n⚠️  Issues found! Please fix the orphaned/malformed packages.');
    process.exit(1);
  } else {
    console.log('\n✅ All packages are valid!');
  }
}

findOrphanedPackages().catch(console.error);