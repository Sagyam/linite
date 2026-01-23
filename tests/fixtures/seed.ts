import { DbHelpers } from '../helpers/db-helpers';
import { baseFixtures } from './base-fixtures';

/**
 * Seed Test Data - Functions to populate test database
 *
 * These functions seed the test database with fixture data
 * for E2E tests.
 */

/**
 * Seed all base data (categories, distros, sources, apps, packages)
 * This creates a complete set of test data
 */
export async function seedTestData(
  scenario: 'minimal' | 'full' | 'custom' = 'minimal'
): Promise<void> {
  console.log(`Seeding test database with ${scenario} data...`);

  const db = DbHelpers.getDb();

  try {
    // Seed categories
    await db.insert(schema.categories).values([
      baseFixtures.categories.browsers,
      baseFixtures.categories.development,
      baseFixtures.categories.media,
      baseFixtures.categories.utilities,
    ]);

    // Seed distros
    await db.insert(schema.distros).values([
      baseFixtures.distros.ubuntu,
      ...(scenario === 'full'
        ? [
            baseFixtures.distros.fedora,
            baseFixtures.distros.arch,
            baseFixtures.distros.debian,
          ]
        : []),
    ]);

    // Seed sources
    await db.insert(schema.sources).values([
      baseFixtures.sources.apt,
      baseFixtures.sources.flatpak,
      ...(scenario === 'full'
        ? [
            baseFixtures.sources.snap,
            baseFixtures.sources.dnf,
            baseFixtures.sources.pacman,
          ]
        : [baseFixtures.sources.snap]),
    ]);

    // Seed distro-source mappings
    await db.insert(schema.distroSources).values([
      baseFixtures.distroSources.ubuntuApt,
      baseFixtures.distroSources.ubuntuFlatpak,
      baseFixtures.distroSources.ubuntuSnap,
      ...(scenario === 'full'
        ? [
            baseFixtures.distroSources.fedoraDnf,
            baseFixtures.distroSources.fedoraFlatpak,
            baseFixtures.distroSources.archPacman,
            baseFixtures.distroSources.archFlatpak,
          ]
        : []),
    ]);

    // Seed apps
    await db.insert(schema.apps).values([
      baseFixtures.apps.firefox,
      baseFixtures.apps.vlc,
      ...(scenario === 'full'
        ? [
            baseFixtures.apps.chrome,
            baseFixtures.apps.vscode,
            baseFixtures.apps.gimp,
          ]
        : []),
    ]);

    // Seed packages
    await db.insert(schema.packages).values([
      baseFixtures.packages.firefoxApt,
      baseFixtures.packages.firefoxFlatpak,
      baseFixtures.packages.firefoxSnap,
      baseFixtures.packages.vlcApt,
      baseFixtures.packages.vlcFlatpak,
      ...(scenario === 'full'
        ? [
            baseFixtures.packages.chromeFlatpak,
            baseFixtures.packages.vscodeDeb,
            baseFixtures.packages.vscodeFlatpak,
            baseFixtures.packages.gimpApt,
          ]
        : []),
    ]);

    // Seed test admin user
    await db.insert(schema.user).values({
      ...baseFixtures.testAdmin,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('Test database seeded successfully');
  } catch (error) {
    console.error('Error seeding test database:', error);
    throw error;
  }
}

/**
 * Clean up all test data
 * Removes all data from the test database
 */
export async function cleanupTestData(): Promise<void> {
  console.log('Cleaning up test database...');

  try {
    await DbHelpers.cleanDatabase();
    console.log('Test database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning test database:', error);
    throw error;
  }
}

/**
 * Reset test database
 * Cleans and re-seeds with fresh data
 */
export async function resetTestDatabase(
  scenario: 'minimal' | 'full' = 'minimal'
): Promise<void> {
  console.log('Resetting test database...');

  await cleanupTestData();
  await seedTestData(scenario);

  console.log('Test database reset complete');
}

/**
 * Seed specific fixture data
 * @param fixtureName - Name of the fixture to seed
 * @param data - Fixture data to seed
 */
export async function seedFixture(
  fixtureName: string,
  data: any
): Promise<void> {
  console.log(`Seeding fixture: ${fixtureName}`);

  const db = DbHelpers.getDb();
  const { schema } = await import('@/db/schema');

  try {
    // Map fixture names to schema tables
    const tableMap: Record<string, any> = {
      apps: schema.apps,
      categories: schema.categories,
      distros: schema.distros,
      sources: schema.sources,
      packages: schema.packages,
      distroSources: schema.distroSources,
    };

    const table = tableMap[fixtureName];
    if (!table) {
      throw new Error(`Unknown fixture: ${fixtureName}`);
    }

    await db.insert(table).values(data);
    console.log(`Fixture ${fixtureName} seeded successfully`);
  } catch (error) {
    console.error(`Error seeding fixture ${fixtureName}:`, error);
    throw error;
  }
}

// Import schema for use in seed functions
import * as schema from '@/db/schema';
