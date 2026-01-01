import { categories } from '@/db/schema';
import { BaseRepository } from './base.repository';
import { eq, asc } from 'drizzle-orm';
import type { Category } from '@/types';

/**
 * Categories Repository
 * Handles all database operations for categories
 */

export class CategoriesRepository extends BaseRepository<Category> {
  constructor() {
    super(categories, 'categories');
  }

  /**
   * Find all categories ordered by display order
   */
  async findAllOrdered(): Promise<Category[]> {
    return this.findMany({
      orderBy: [asc(categories.displayOrder), asc(categories.name)],
    });
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<Category | undefined> {
    return this.findFirst({
      where: eq(categories.slug, slug),
    });
  }

  /**
   * Find category with apps
   */
  async findByIdWithApps(id: string) {
    return this.findById(id, {
      apps: true,
    });
  }

  /**
   * Check if category has apps
   */
  async hasApps(id: string): Promise<boolean> {
    const category = await this.findByIdWithApps(id);
    return category && 'apps' in category && Array.isArray(category.apps) && category.apps.length > 0;
  }
}

// Export singleton instance
export const categoriesRepository = new CategoriesRepository();
