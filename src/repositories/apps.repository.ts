import { apps, categories } from '@/db/schema';
import { BaseRepository } from './base.repository';
import { eq, and, or, like, sql, desc, asc } from 'drizzle-orm';
import type { App, AppWithRelations } from '@/types';

/**
 * Apps Repository
 * Handles all database operations for apps
 */

export interface AppFilters {
  category?: string; // Category slug or ID
  popular?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export class AppsRepository extends BaseRepository<App> {
  constructor() {
    super(apps, 'apps');
  }

  /**
   * Find apps with filters
   */
  async findWithFilters(filters: AppFilters): Promise<AppWithRelations[]> {
    const {
      category,
      popular,
      search,
      limit = 50,
      offset = 0,
    } = filters;

    const conditions = [];

    // Category filter - support both slug and ID
    if (category) {
      const { db } = await import('@/db');
      const categoryRecord = await db.query.categories.findFirst({
        where: or(eq(categories.slug, category), eq(categories.id, category)),
      });
      if (categoryRecord) {
        conditions.push(eq(apps.categoryId, categoryRecord.id));
      }
    }

    // Popular filter
    if (popular) {
      conditions.push(eq(apps.isPopular, true));
    }

    // Search filter - search in display name and description
    if (search) {
      conditions.push(
        or(
          like(apps.displayName, `%${search}%`),
          like(sql`COALESCE(${apps.description}, '')`, `%${search}%`)
        )
      );
    }

    return this.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        category: true,
        packages: {
          with: {
            source: true,
          },
        },
      },
      orderBy: [desc(apps.isPopular), asc(apps.displayName)],
      limit,
      offset,
    }) as Promise<AppWithRelations[]>;
  }

  /**
   * Find app by slug
   */
  async findBySlug(slug: string): Promise<AppWithRelations | undefined> {
    return this.findFirst({
      where: eq(apps.slug, slug),
      with: {
        category: true,
        packages: {
          with: {
            source: true,
          },
        },
      },
    }) as Promise<AppWithRelations | undefined>;
  }

  /**
   * Find app by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<AppWithRelations | undefined> {
    return this.findById(id, {
      category: true,
      packages: {
        with: {
          source: true,
        },
      },
    }) as Promise<AppWithRelations | undefined>;
  }

  /**
   * Check if slug is available
   */
  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(apps.slug, slug)];

    if (excludeId) {
      const { ne } = await import('drizzle-orm');
      conditions.push(ne(apps.id, excludeId));
    }

    const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0];
    return !(await this.exists(whereClause!));
  }
}

// Export singleton instance
export const appsRepository = new AppsRepository();
