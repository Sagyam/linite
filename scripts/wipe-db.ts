import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function wipeDatabase() {
  console.log('🗑️  Wiping database...');

  try {
    // Get all table names
    const tables = [
      'refresh_logs',
      'distro_sources',
      'packages',
      'apps',
      'sources',
      'distros',
      'categories',
      'verification',
      'account',
      'session',
      'user',
    ];

    // Delete all data from tables in reverse order (to respect foreign keys)
    for (const table of tables) {
      await db.run(sql.raw(`DELETE FROM ${table}`));
      console.log(`  ✓ Cleared ${table}`);
    }

    console.log('✅ Database wiped successfully!');
    console.log('💡 Run "bun run db:seed" to populate with initial data');
  } catch (error) {
    console.error('❌ Failed to wipe database:', error);
    process.exit(1);
  }

  process.exit(0);
}

wipeDatabase();
