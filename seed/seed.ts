#!/usr/bin/env bun

/**
 * Database Seeder
 * Loads data from JSON files and seeds the database
 */

import { db, categories, sources, distros, distroSources, apps, packages, user, collections, collectionItems } from '@/db';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { uploadImageFromUrl } from '@/lib/blob';
import { eq } from 'drizzle-orm';
import { TIMEOUTS } from '../src/lib/constants';
import { createId } from '@paralleldrive/cuid2';

// Load JSON data
const seedDir = __dirname;

const categoriesData = JSON.parse(readFileSync(join(seedDir, 'categories.json'), 'utf-8'));
const sourcesData = JSON.parse(readFileSync(join(seedDir, 'sources.json'), 'utf-8'));
const distrosData = JSON.parse(readFileSync(join(seedDir, 'distros.json'), 'utf-8'));
const distroSourcesData = JSON.parse(readFileSync(join(seedDir, 'distro-sources.json'), 'utf-8'));
const appsData = JSON.parse(readFileSync(join(seedDir, 'apps.json'), 'utf-8'));
const collectionsData = JSON.parse(readFileSync(join(seedDir, 'collections.json'), 'utf-8'));

// Load packages from individual source files in seed/packages/
const packagesDir = join(seedDir, 'packages');
const packageFiles = readdirSync(packagesDir).filter(f => f.endsWith('.json'));
const packagesData = packageFiles.flatMap(file => {
  const data = JSON.parse(readFileSync(join(packagesDir, file), 'utf-8'));
  return data;
});

/**
 * Generate random delay between min and max
 */
function getRandomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seed() {
  console.log('🌱 Seeding database from JSON files...\n');
  console.log(`📦 Loading packages from ${packageFiles.length} source files...\n`);

  // 1. Create categories
  console.log('Creating categories...');
  const createdCategories = await db.insert(categories).values(categoriesData).returning();
  console.log(`✅ Created ${createdCategories.length} categories`);

  // 2. Create sources
  console.log('Creating sources...');
  const createdSources = await db.insert(sources).values(sourcesData).returning();
  console.log(`✅ Created ${createdSources.length} sources`);

  // 3. Create distros (without icons initially)
  console.log('Creating distros...');
  const distroValues = distrosData.map((distro: { slug: string; name: string; family: string; basedOn: string | null; isPopular: boolean; iconUrl?: string }) => ({
    slug: distro.slug,
    name: distro.name,
    family: distro.family,
    basedOn: distro.basedOn,
    isPopular: distro.isPopular,
    iconUrl: null, // Will be populated after icon upload
  }));
  const createdDistros = await db.insert(distros).values(distroValues).returning();
  console.log(`✅ Created ${createdDistros.length} distros`);

  // Create lookup maps
  const categoryMap = Object.fromEntries(createdCategories.map(c => [c.slug, c.id]));
  const sourceMap = Object.fromEntries(createdSources.map(s => [s.slug, s.id]));
  const distroMap = Object.fromEntries(createdDistros.map(d => [d.slug, d.id]));

  // 3.5. Download and upload distro icons to Azure Blob Storage
  console.log('\nDownloading and uploading distro icons to Azure Blob Storage...');
  let distroIconCount = 0;
  let distroIconErrors = 0;

  for (const distro of distrosData) {
    const iconUrl = (distro as { iconUrl?: string }).iconUrl;

    // Skip if no iconUrl or if it's a placeholder
    if (!iconUrl || iconUrl === 'PLACEHOLDER') {
      console.log(`  ⏭️  ${distro.slug}: Skipping (no icon URL)`);
      continue;
    }

    try {
      console.log(`  ⬇️  ${distro.slug}: Downloading from ${iconUrl.substring(0, 60)}...`);

      // Download icon from URL and upload to Azure Blob Storage
      const uploadedUrl = await uploadImageFromUrl(iconUrl, distro.slug, 'distro-icons');

      if (uploadedUrl) {
        // Update distro's iconUrl with the Azure Blob Storage URL
        const distroId = distroMap[distro.slug];
        if (distroId) {
          await db
            .update(distros)
            .set({ iconUrl: uploadedUrl })
            .where(eq(distros.id, distroId));

          distroIconCount++;
          console.log(`  ✅ ${distro.slug}: Uploaded successfully`);
        }
      } else {
        distroIconErrors++;
        console.log(`  ❌ ${distro.slug}: Upload failed`);
      }

      // Random delay to avoid overwhelming the network and rate limiting
      const delay = getRandomDelay(TIMEOUTS.ICON_DOWNLOAD_MIN_DELAY, TIMEOUTS.ICON_DOWNLOAD_MAX_DELAY);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      distroIconErrors++;
      console.error(`  ❌ ${distro.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`\n✅ Uploaded ${distroIconCount} distro icons to Azure Blob Storage`);
  if (distroIconErrors > 0) {
    console.log(`⚠️  ${distroIconErrors} distro icons failed to upload`);
  }

  // 4. Map distros to sources
  console.log('\nMapping distros to sources...');
  const distroSourceMappings = distroSourcesData.map((ds: { distro: string; source: string; priority: number; isDefault: boolean }) => ({
    distroId: distroMap[ds.distro],
    sourceId: sourceMap[ds.source],
    priority: ds.priority,
    isDefault: ds.isDefault,
  }));
  await db.insert(distroSources).values(distroSourceMappings);
  console.log(`✅ Created ${distroSourceMappings.length} distro-source mappings`);

  // 5. Create apps (with icons from apps.json)
  console.log('Creating apps...');
  const appValues = appsData.map((app: { slug: string; displayName: string; description: string; homepage: string; isPopular: boolean; isFoss: boolean; category: string; iconUrl?: string | null }) => ({
    slug: app.slug,
    displayName: app.displayName,
    description: app.description,
    homepage: app.homepage,
    isPopular: app.isPopular,
    isFoss: app.isFoss,
    categoryId: categoryMap[app.category],
    iconUrl: null, // Will be populated after icon upload
  }));
  const createdApps = await db.insert(apps).values(appValues).returning();
  console.log(`✅ Created ${createdApps.length} apps`);

  const appMap = Object.fromEntries(createdApps.map(a => [a.slug, a.id]));

  // 6. Download and upload app icons to Azure Blob Storage
  console.log('\nDownloading and uploading app icons to Azure Blob Storage...');
  let iconCount = 0;
  let iconErrors = 0;

  for (const app of appsData) {
    const iconUrl = (app as { iconUrl?: string | null }).iconUrl;

    // Skip if no iconUrl
    if (!iconUrl) {
      console.log(`  ⏭️  ${app.slug}: Skipping (no icon URL)`);
      continue;
    }

    try {
      console.log(`  ⬇️  ${app.slug}: Downloading from ${iconUrl.substring(0, 50)}...`);

      // Download icon from URL and upload to Azure Blob Storage
      const uploadedUrl = await uploadImageFromUrl(iconUrl, app.slug);

      if (uploadedUrl) {
        // Update app's iconUrl with the Azure Blob Storage URL
        const appId = appMap[app.slug];
        if (appId) {
          await db
            .update(apps)
            .set({ iconUrl: uploadedUrl })
            .where(eq(apps.id, appId));

          iconCount++;
          console.log(`  ✅ ${app.slug}: Uploaded successfully`);
        }
      } else {
        iconErrors++;
        console.log(`  ❌ ${app.slug}: Upload failed`);
      }

      // Random delay to avoid overwhelming the network and rate limiting
      const delay = getRandomDelay(TIMEOUTS.ICON_DOWNLOAD_MIN_DELAY, TIMEOUTS.ICON_DOWNLOAD_MAX_DELAY);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      iconErrors++;
      console.error(`  ❌ ${app.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`\n✅ Uploaded ${iconCount} app icons to Azure Blob Storage`);
  if (iconErrors > 0) {
    console.log(`⚠️  ${iconErrors} app icons failed to upload`);
  }

  // 7. Create packages
  console.log('\nCreating packages...');
  const packageValues = packagesData.map((pkg: { app: string; source: string; identifier: string; isAvailable: boolean; metadata?: Record<string, unknown> }) => ({
    appId: appMap[pkg.app],
    sourceId: sourceMap[pkg.source],
    identifier: pkg.identifier,
    isAvailable: pkg.isAvailable,
    metadata: pkg.metadata ? JSON.stringify(pkg.metadata) : null,
  }));

  // Check for undefined appIds or sourceIds
  const invalidPackages = packageValues.filter((p: { appId?: string; sourceId?: string }) => !p.appId || !p.sourceId);
  if (invalidPackages.length > 0) {
    console.error(`⚠️  Found ${invalidPackages.length} packages with invalid app/source references`);
    console.error('First few:', invalidPackages.slice(0, 3));
  }

  const validPackages = packageValues.filter((p: { appId?: string; sourceId?: string }) => p.appId && p.sourceId);
  await db.insert(packages).values(validPackages);
  console.log(`✅ Created ${validPackages.length} packages`);

  // 8. Create system user and seed collections
  console.log('\nCreating system user...');
  const [systemUser] = await db.insert(user).values({
    id: createId(),
    email: 'system@linite.local',
    name: 'Linite System',
    role: 'user',
    emailVerified: true,
    image: null,
  }).returning();
  console.log(`✅ Created system user: ${systemUser.email}`);

  // Create collections
  console.log('Creating template collections...');
  let collectionCount = 0;

  for (const collectionData of collectionsData) {
    const [collection] = await db.insert(collections).values({
      id: createId(),
      userId: systemUser.id,
      name: collectionData.name,
      description: collectionData.description || null,
      slug: collectionData.slug,
      iconUrl: null,
      isPublic: collectionData.isPublic ?? true,
      isFeatured: collectionData.isFeatured ?? false,
      isTemplate: collectionData.isTemplate ?? false,
      shareToken: null,
      viewCount: 0,
      installCount: 0,
      tags: collectionData.tags || null,
    }).returning();

    // Create collection items
    if (collectionData.apps?.length > 0) {
      const items = collectionData.apps
        .map((appSlug: string, index: number) => {
          const appId = appMap[appSlug];
          if (!appId) {
            console.warn(`  ⚠️  App not found: ${appSlug} (skipping)`);
            return null;
          }
          return {
            id: createId(),
            collectionId: collection.id,
            appId,
            displayOrder: index,
            note: null,
          };
        })
        .filter(Boolean);

      if (items.length > 0) {
        await db.insert(collectionItems).values(items);
        console.log(`  ✅ ${collectionData.name} (${items.length} apps)`);
      }
    }
    collectionCount++;
  }

  console.log(`✅ Created ${collectionCount} template collections`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🚀 You can now start the dev server with: bun run dev');
  console.log('\n📝 Note: Sign in with GitHub OAuth at /admin/login');
  console.log('   Only sagyamthapa32@gmail.com will be granted superadmin role');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
