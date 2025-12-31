/**
 * Test script to manually trigger package refresh
 */

import { refreshPackages } from '../src/services/package-refresh';

async function main() {
  console.log('🔄 Starting package refresh...\n');

  try {
    const results = await refreshPackages();

    console.log('\n=== 📊 Refresh Results ===\n');
    for (const result of results) {
      console.log(`📦 Source: ${result.sourceName}`);
      console.log(`   ✓ Checked: ${result.packagesChecked} packages`);
      console.log(`   ✓ Updated: ${result.packagesUpdated} packages`);
      console.log(`   ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);

      if (result.errors.length > 0) {
        console.log(`   ⚠️  Errors: ${result.errors.length}`);
        result.errors.slice(0, 3).forEach(err => {
          console.log(`      - ${err}`);
        });
        if (result.errors.length > 3) {
          console.log(`      ... and ${result.errors.length - 3} more errors`);
        }
      }
      console.log('');
    }

    const totalChecked = results.reduce((sum, r) => sum + r.packagesChecked, 0);
    const totalUpdated = results.reduce((sum, r) => sum + r.packagesUpdated, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log('=== 🎯 Summary ===');
    console.log(`Total packages checked: ${totalChecked}`);
    console.log(`Total packages updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log('\n✅ Refresh completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Refresh failed:', error);
    process.exit(1);
  }
}

main();
