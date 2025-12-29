#!/usr/bin/env bun

/**
 * Check if database has been seeded with data
 */

import { db, categories, sources, distros, apps } from '../src/db';

async function checkData() {
  console.log('🔍 Checking database for seeded data...\n');

  try {
    const [categoryCount] = await db.select().from(categories);
    const [sourceCount] = await db.select().from(sources);
    const [distroCount] = await db.select().from(distros);
    const [appCount] = await db.select().from(apps);

    const categoriesLength = (await db.select().from(categories)).length;
    const sourcesLength = (await db.select().from(sources)).length;
    const distrosLength = (await db.select().from(distros)).length;
    const appsLength = (await db.select().from(apps)).length;

    console.log('📊 Database Status:');
    console.log(`   Categories: ${categoriesLength}`);
    console.log(`   Sources: ${sourcesLength}`);
    console.log(`   Distros: ${distrosLength}`);
    console.log(`   Apps: ${appsLength}\n`);

    if (categoriesLength === 0 || sourcesLength === 0 || distrosLength === 0) {
      console.log('❌ Database is not properly seeded!');
      console.log('\n💡 To seed the database, run: bun run db:seed\n');
      process.exit(1);
    } else {
      console.log('✅ Database is properly seeded and ready to use!\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkData();
