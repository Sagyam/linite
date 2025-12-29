#!/usr/bin/env bun

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function dropSchema() {
  console.log('🗑️  Dropping all tables...');

  try {
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
      '__drizzle_migrations',
    ];

    for (const table of tables) {
      try {
        await db.run(sql.raw(`DROP TABLE IF EXISTS ${table}`));
        console.log(`  ✓ Dropped ${table}`);
      } catch (error) {
        console.log(`  ⚠️  Skipped ${table} (may not exist)`);
      }
    }

    console.log('✅ All tables dropped successfully!');
    console.log('💡 Run "bun run db:push" to recreate schema');
    console.log('💡 Then run "bun run db:seed" to populate with initial data');
  } catch (error) {
    console.error('❌ Failed to drop schema:', error);
    process.exit(1);
  }

  process.exit(0);
}

dropSchema();
