/**
 * Test Repology refresh manually
 */

import { db } from '../src/db';
import { RepologyRefreshStrategy } from '../src/services/refresh-strategies/repology-strategy';

async function testRepologyRefresh() {
  console.log('🔍 Testing Repology refresh...\n');

  // Get packages by source slug
  const allPackages = await db.query.packages.findMany({
    with: {
      source: true,
    },
  });

  // Filter for native package managers
  const nativePackages = allPackages.filter(pkg =>
    ['apt', 'dnf', 'pacman', 'zypper'].includes(pkg.source.slug)
  );

  if (nativePackages.length === 0) {
    console.log('❌ No packages found for native package managers');
    process.exit(1);
  }

  console.log(`Found ${nativePackages.length} native packages\n`);

  // Test a few packages from each source
  const testCases = new Map<string, typeof nativePackages>();
  for (const pkg of nativePackages) {
    if (!testCases.has(pkg.source.slug)) {
      testCases.set(pkg.source.slug, []);
    }
    const cases = testCases.get(pkg.source.slug)!;
    if (cases.length < 2) {
      cases.push(pkg);
    }
  }

  for (const [sourceSlug, pkgs] of testCases) {
    console.log(`\n📦 Testing ${sourceSlug.toUpperCase()} packages:`);
    console.log('─'.repeat(60));

    const strategy = new RepologyRefreshStrategy(sourceSlug);

    for (const pkg of pkgs) {
      console.log(`\n  Package: ${pkg.identifier}`);
      console.log(`  Current version: ${pkg.version || 'N/A'}`);

      try {
        const metadata = await strategy.getMetadata(pkg.identifier);

        if (metadata) {
          console.log(`  ✅ Metadata found:`);
          console.log(`     Version: ${metadata.version || 'N/A'}`);
          console.log(`     License: ${metadata.license || 'N/A'}`);
          console.log(`     Maintainer: ${metadata.maintainer || 'N/A'}`);
          console.log(`     Homepage: ${metadata.homepage || 'N/A'}`);
          console.log(`     Summary: ${metadata.summary || 'N/A'}`);

          if (metadata.metadata) {
            const meta = metadata.metadata as Record<string, unknown>;
            console.log(`     Repo: ${meta.repo || 'N/A'}`);
            console.log(`     Status: ${meta.status || 'N/A'}`);
            if (Array.isArray(meta.availableRepos)) {
              console.log(`     Available in ${meta.availableRepos.length} repos`);
            }
          }
        } else {
          console.log(`  ❌ No metadata found`);
        }
      } catch (error) {
        console.error(`  ❌ Error:`, error);
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n\n✨ Test complete!');
  process.exit(0);
}

testRepologyRefresh().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
