import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { eq } from 'drizzle-orm';
import * as schema from '@/db/schema';

/**
 * Database Helpers - Utilities for managing test database
 *
 * These helpers provide functions for seeding data, cleaning up,
 * and managing database state during E2E tests.
 */

export class DbHelpers {
  private static dbInstance: ReturnType<typeof drizzle> | null = null;

  /**
   * Get database instance
   * Uses test database configuration
   */
  static getDb() {
    if (!this.dbInstance) {
      const client = createClient({
        url: process.env.DATABASE_URL || 'file:./test.db',
        authToken: process.env.DATABASE_AUTH_TOKEN,
      });

      this.dbInstance = drizzle(client, { schema });
    }

    return this.dbInstance;
  }

  /**
   * Clean all tables
   * Warning: This deletes ALL data from the test database
   */
  static async cleanDatabase(): Promise<void> {
    const db = this.getDb();

    try {
      // Delete in order to respect foreign key constraints
      await db.delete(schema.packages);
      await db.delete(schema.distroSources);
      await db.delete(schema.installations);
      await db.delete(schema.refreshLogs);
      await db.delete(schema.collectionItems);
      await db.delete(schema.collections);
      await db.delete(schema.apps);
      await db.delete(schema.categories);
      await db.delete(schema.sources);
      await db.delete(schema.distros);
      await db.delete(schema.session);
      await db.delete(schema.account);
      await db.delete(schema.verification);
      await db.delete(schema.user);
    } catch (error) {
      console.error('Error cleaning database:', error);
      throw error;
    }
  }

  /**
   * Seed basic test data
   * Creates minimal data needed for most tests
   */
  static async seedBasicData(): Promise<{
    category: any;
    distro: any;
    source: any;
    app: any;
  }> {
    const db = this.getDb();

    // Create category
    const [category] = await db
      .insert(schema.categories)
      .values({
        id: 'test-category',
        name: 'Test Category',
        slug: 'test-category',
        description: 'Category for testing',
        icon: '🧪',
      })
      .returning();

    // Create distro
    const [distro] = await db
      .insert(schema.distros)
      .values({
        id: 'test-ubuntu',
        name: 'Ubuntu 22.04',
        slug: 'ubuntu-22-04',
        family: 'debian',
        basedOn: 'debian',
        iconUrl: 'ubuntu.svg',
        isPopular: true,
      })
      .returning();

    // Create source
    const [source] = await db
      .insert(schema.sources)
      .values({
        id: 'test-apt',
        name: 'APT',
        slug: 'apt',
        installCmd: 'apt install -y',
        removeCmd: 'apt remove -y',
        requireSudo: true,
        setupCmd: null,
        cleanupCmd: null,
        supportsDependencyCleanup: true,
        dependencyCleanupCmd: 'apt autoremove -y',
        priority: 10,
        apiEndpoint: null,
      })
      .returning();

    // Link distro and source
    await db.insert(schema.distroSources).values({
      distroId: distro.id,
      sourceId: source.id,
      priority: 1,
    });

    // Create app
    const [app] = await db
      .insert(schema.apps)
      .values({
        id: 'test-firefox',
        slug: 'firefox',
        displayName: 'Firefox',
        description: 'Web browser',
        categoryId: category.id,
        homepage: 'https://firefox.com',
        iconUrl: 'https://example.com/firefox.png',
        isPopular: false,
        isFoss: true,
      })
      .returning();

    // Create package for app
    await db.insert(schema.packages).values({
      appId: app.id,
      sourceId: source.id,
      identifier: 'firefox',
      version: null,
      size: null,
      maintainer: null,
      isAvailable: true,
      metadata: { url: 'https://packages.ubuntu.com/firefox' },
    });

    return { category, distro, source, app };
  }

  /**
   * Create test user (admin)
   */
  static async createTestAdmin(): Promise<any> {
    const db = this.getDb();

    const [user] = await db
      .insert(schema.user)
      .values({
        id: 'test-admin-id',
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.linite.com',
        name: 'Test Admin',
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return user;
  }

  /**
   * Create test app
   */
  static async createTestApp(data: {
    id?: string;
    displayName: string;
    slug: string;
    categoryId: string;
    description?: string;
  }): Promise<any> {
    const db = this.getDb();

    const [app] = await db
      .insert(schema.apps)
      .values({
        id: data.id || `test-app-${Date.now()}`,
        slug: data.slug,
        displayName: data.displayName,
        description: data.description || 'Test app',
        categoryId: data.categoryId,
        homepage: 'https://example.com',
        iconUrl: 'https://example.com/icon.png',
        isPopular: false,
        isFoss: true,
      })
      .returning();

    return app;
  }

  /**
   * Create test package
   */
  static async createTestPackage(data: {
    appId: string;
    sourceId: string;
    identifier: string;
  }): Promise<any> {
    const db = this.getDb();

    const [pkg] = await db
      .insert(schema.packages)
      .values({
        appId: data.appId,
        sourceId: data.sourceId,
        identifier: data.identifier,
        version: null,
        size: null,
        maintainer: null,
        isAvailable: true,
        metadata: { url: `https://example.com/${data.identifier}` },
      })
      .returning();

    return pkg;
  }

  /**
   * Get app by ID
   */
  static async getAppById(appId: string): Promise<any> {
    const db = this.getDb();
    const result = await db.select().from(schema.apps).where(eq(schema.apps.id, appId)).limit(1);
    return result[0];
  }

  /**
   * Get all apps
   */
  static async getAllApps(): Promise<any[]> {
    const db = this.getDb();
    const result = await db.select().from(schema.apps);
    return result;
  }

  /**
   * Delete app by ID
   */
  static async deleteApp(appId: string): Promise<void> {
    const db = this.getDb();

    // Delete packages first (foreign key constraint)
    await db.delete(schema.packages).where(eq(schema.packages.appId, appId));

    // Delete app
    await db.delete(schema.apps).where(eq(schema.apps.id, appId));
  }

  /**
   * Get packages for app
   */
  static async getPackagesForApp(appId: string): Promise<any[]> {
    const db = this.getDb();
    const result = await db.select().from(schema.packages).where(eq(schema.packages.appId, appId));
    return result;
  }

  /**
   * Check if database is empty
   */
  static async isDatabaseEmpty(): Promise<boolean> {
    const db = this.getDb();
    const apps = await db.select().from(schema.apps);
    return apps.length === 0;
  }

  /**
   * Get database statistics
   */
  static async getStats(): Promise<{
    apps: number;
    categories: number;
    distros: number;
    sources: number;
    packages: number;
  }> {
    const db = this.getDb();

    const [apps, categories, distros, sources, packages] = await Promise.all([
      db.select().from(schema.apps),
      db.select().from(schema.categories),
      db.select().from(schema.distros),
      db.select().from(schema.sources),
      db.select().from(schema.packages),
    ]);

    return {
      apps: apps.length,
      categories: categories.length,
      distros: distros.length,
      sources: sources.length,
      packages: packages.length,
    };
  }

  /**
   * Verify database connection
   */
  static async verifyConnection(): Promise<boolean> {
    try {
      const db = this.getDb();
      await db.select().from(schema.apps).limit(1);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Reset auto-increment sequences (if using SQLite)
   */
  static async resetSequences(): Promise<void> {
    // SQLite doesn't have sequences like PostgreSQL
    // This is a placeholder for future use if needed
    console.log('Sequence reset not needed for SQLite');
  }

  /**
   * Close database connection
   */
  static async closeConnection(): Promise<void> {
    if (this.dbInstance) {
      // libSQL client doesn't have a close method
      // Just null out the instance
      this.dbInstance = null;
    }
  }
}
