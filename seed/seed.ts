#!/usr/bin/env bun

/**
 * Database Seeder
 * Loads data from JSON files and seeds the database
 */

import { db, categories, sources, distros, distroSources, apps, packages } from '@/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { uploadImageFromUrl } from '@/lib/blob';
import { eq } from 'drizzle-orm';
import { TIMEOUTS } from '../src/lib/constants';

// Load JSON data
const seedDir = __dirname;

const categoriesData = JSON.parse(readFileSync(join(seedDir, 'categories.json'), 'utf-8'));
const sourcesData = JSON.parse(readFileSync(join(seedDir, 'sources.json'), 'utf-8'));
const distrosData = JSON.parse(readFileSync(join(seedDir, 'distros.json'), 'utf-8'));
const distroSourcesData = JSON.parse(readFileSync(join(seedDir, 'distro-sources.json'), 'utf-8'));
const appsData = JSON.parse(readFileSync(join(seedDir, 'apps.json'), 'utf-8'));
const packagesData = JSON.parse(readFileSync(join(seedDir, 'packages.json'), 'utf-8'));
const iconsData = JSON.parse(readFileSync(join(seedDir, 'icons.json'), 'utf-8'));

async function seed() {
  console.log('🌱 Seeding database from JSON files...\n');

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

      // Small delay to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.ICON_DOWNLOAD_DELAY));
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

  // 5. Create apps (without icons initially)
  console.log('Creating apps...');
  const appValues = appsData.map((app: { slug: string; displayName: string; description: string; homepage: string; isPopular: boolean; isFoss: boolean; category: string }) => ({
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

  // 6. Download and upload icons to Azure Blob Storage
  console.log('\nDownloading and uploading icons to Azure Blob Storage...');
  const icons = iconsData.icons as Record<string, string>;
  let iconCount = 0;
  let iconErrors = 0;

  for (const [appSlug, iconUrl] of Object.entries(icons)) {
    try {
      console.log(`  ⬇️  ${appSlug}: Downloading from ${iconUrl.substring(0, 50)}...`);

      // Download icon from URL and upload to Azure Blob Storage
      const uploadedUrl = await uploadImageFromUrl(iconUrl, appSlug);

      if (uploadedUrl) {
        // Update app's iconUrl with the Azure Blob Storage URL
        const appId = appMap[appSlug];
        if (appId) {
          await db
            .update(apps)
            .set({ iconUrl: uploadedUrl })
            .where(eq(apps.id, appId));

          iconCount++;
          console.log(`  ✅ ${appSlug}: Uploaded successfully`);
        }
      } else {
        iconErrors++;
        console.log(`  ❌ ${appSlug}: Upload failed`);
      }

      // Small delay to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, TIMEOUTS.ICON_DOWNLOAD_DELAY));
    } catch (error) {
      iconErrors++;
      console.error(`  ❌ ${appSlug}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  console.log(`\n✅ Uploaded ${iconCount} icons to Azure Blob Storage`);
  if (iconErrors > 0) {
    console.log(`⚠️  ${iconErrors} icons failed to upload`);
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

  console.log('\n✅ Database seeded successfully!');
  console.log('\n🚀 You can now start the dev server with: bun run dev');
  console.log('\n📝 Note: Sign in with GitHub OAuth at /admin/login');
  console.log('   Only sagyamthapa32@gmail.com will be granted superadmin role');
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
