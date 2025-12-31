/**
 * Update native package manager sources to use Repology API
 */

import { db } from '../src/db';
import { sources } from '../src/db/schema';
import { eq } from 'drizzle-orm';

const REPOLOGY_API = 'https://repology.org/api/v1/';

const SOURCES_TO_UPDATE = [
  { slug: 'apt', name: 'APT' },
  { slug: 'dnf', name: 'DNF' },
  { slug: 'pacman', name: 'Pacman' },
  { slug: 'zypper', name: 'Zypper' },
];

async function updateSources() {
  console.log('🔄 Updating sources to use Repology API...\n');

  for (const { slug, name } of SOURCES_TO_UPDATE) {
    try {
      const source = await db.query.sources.findFirst({
        where: eq(sources.slug, slug),
      });

      if (!source) {
        console.log(`⚠️  Source '${name}' (${slug}) not found, skipping...`);
        continue;
      }

      if (source.apiEndpoint) {
        console.log(`ℹ️  Source '${name}' already has API endpoint: ${source.apiEndpoint}`);
        continue;
      }

      await db
        .update(sources)
        .set({
          apiEndpoint: REPOLOGY_API,
          updatedAt: new Date(),
        })
        .where(eq(sources.id, source.id));

      console.log(`✅ Updated '${name}' (${slug}) with Repology API`);
    } catch (error) {
      console.error(`❌ Error updating '${name}' (${slug}):`, error);
    }
  }

  console.log('\n✨ Done!');
  process.exit(0);
}

updateSources().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
