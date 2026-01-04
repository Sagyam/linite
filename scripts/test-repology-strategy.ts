/**
 * Test Repology refresh strategy
 */

import { RepologyRefreshStrategy } from '../src/services/refresh-strategies/repology-strategy';

async function testRepologyStrategy() {
  console.log('Testing Repology strategy for Firefox on different package managers...\n');

  const testCases = [
    { source: 'apt', identifier: 'firefox' },
    { source: 'dnf', identifier: 'firefox' },
    { source: 'pacman', identifier: 'firefox' },
  ];

  for (const { source, identifier } of testCases) {
    console.log(`\n📦 Testing ${source}: ${identifier}`);
    console.log('─'.repeat(50));

    const strategy = new RepologyRefreshStrategy(source);

    try {
      const metadata = await strategy.getMetadata(identifier);

      if (metadata) {
        console.log('✅ Metadata found:');
        console.log(`   Name: ${metadata.name}`);
        console.log(`   Version: ${metadata.version || 'N/A'}`);
        console.log(`   License: ${metadata.license || 'N/A'}`);
        console.log(`   Homepage: ${metadata.homepage || 'N/A'}`);
        console.log(`   Maintainer: ${metadata.maintainer || 'N/A'}`);
        console.log(`   Summary: ${metadata.summary || 'N/A'}`);
        if (metadata.metadata) {
          const meta = metadata.metadata as Record<string, unknown>;
          console.log(`   Repo: ${meta.repo || 'N/A'}`);
        }
      } else {
        console.log('❌ No metadata found');
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  }

  console.log('\n✨ Done!');
  process.exit(0);
}

testRepologyStrategy().catch(console.error);
