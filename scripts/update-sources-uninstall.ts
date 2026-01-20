import { db } from '@/db';
import { sources } from '@/db/schema';
import sourcesData from '../seed/sources.json';
import { eq } from 'drizzle-orm';

async function updateSourcesWithUninstallCommands() {
  console.log('🔄 Updating sources with uninstall commands...');

  for (const sourceData of sourcesData) {
    try {
      // Check if source exists
      const existingSource = await db.query.sources.findFirst({
        where: eq(sources.slug, sourceData.slug),
      });

      if (existingSource) {
        // Update existing source with uninstall fields
        await db
          .update(sources)
          .set({
            removeCmd: sourceData.removeCmd || null,
            cleanupCmd: sourceData.cleanupCmd || null,
            supportsDependencyCleanup: sourceData.supportsDependencyCleanup || false,
            dependencyCleanupCmd: sourceData.dependencyCleanupCmd || null,
            updatedAt: new Date(),
          })
          .where(eq(sources.id, existingSource.id));

        console.log(`✓ Updated: ${sourceData.name}`);
      } else {
        // Insert new source (shouldn't happen but handle it)
        await db.insert(sources).values({
          ...sourceData,
          id: undefined, // Let DB generate ID
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        console.log(`✓ Inserted: ${sourceData.name}`);
      }
    } catch (error) {
      console.error(`✗ Failed to update ${sourceData.name}:`, error);
    }
  }

  console.log('✅ All sources updated successfully!');
  process.exit(0);
}

updateSourcesWithUninstallCommands().catch((error) => {
  console.error('❌ Error updating sources:', error);
  process.exit(1);
});
