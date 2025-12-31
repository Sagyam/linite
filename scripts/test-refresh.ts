/**
 * Test script to verify refresh functionality
 */

import { db } from '../src/db';
import { sources, packages } from '../src/db/schema';

async function testRefreshSetup() {
  console.log('🔍 Checking refresh setup...\n');

  // Check sources
  const allSources = await db.query.sources.findMany();
  console.log(`📦 Found ${allSources.length} sources:`);
  for (const source of allSources) {
    console.log(`  - ${source.name} (${source.slug})`);
    console.log(`    API Endpoint: ${source.apiEndpoint || '❌ NOT SET'}`);
  }

  console.log('\n');

  // Check packages
  const allPackages = await db.query.packages.findMany({
    with: {
      app: true,
      source: true,
    },
  });

  console.log(`📦 Found ${allPackages.length} packages:\n`);

  // Group by source
  const bySource = allPackages.reduce((acc, pkg) => {
    const sourceSlug = pkg.source.slug;
    if (!acc[sourceSlug]) acc[sourceSlug] = [];
    acc[sourceSlug].push(pkg);
    return acc;
  }, {} as Record<string, typeof allPackages>);

  for (const [sourceSlug, pkgs] of Object.entries(bySource)) {
    console.log(`  ${sourceSlug}: ${pkgs.length} packages`);
    pkgs.slice(0, 3).forEach(pkg => {
      console.log(`    - ${pkg.identifier} (${pkg.app?.displayName})`);
      console.log(`      Version: ${pkg.version || 'null'}, Size: ${pkg.size || 'null'}, Metadata: ${pkg.metadata ? 'present' : 'null'}`);
    });
    if (pkgs.length > 3) {
      console.log(`    ... and ${pkgs.length - 3} more`);
    }
    console.log('');
  }

  process.exit(0);
}

testRefreshSetup().catch(console.error);
