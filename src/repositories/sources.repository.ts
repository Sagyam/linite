import { sources } from '@/db/schema';
import { BaseRepository } from './base.repository';
import { eq, desc } from 'drizzle-orm';
import type { Source } from '@/types';

/**
 * Sources Repository
 * Handles all database operations for package sources
 */

export class SourcesRepository extends BaseRepository<Source> {
  constructor() {
    super(sources, 'sources');
  }

  /**
   * Find all sources ordered by priority
   */
  async findAllOrdered(): Promise<Source[]> {
    return this.findMany({
      orderBy: [desc(sources.priority), desc(sources.name)],
    });
  }

  /**
   * Find source by slug
   */
  async findBySlug(slug: string): Promise<Source | undefined> {
    return this.findFirst({
      where: eq(sources.slug, slug),
    });
  }

  /**
   * Find source with packages
   */
  async findByIdWithPackages(id: string) {
    return this.findById(id, {
      packages: true,
    });
  }

  /**
   * Check if source has packages
   */
  async hasPackages(id: string): Promise<boolean> {
    const source = await this.findByIdWithPackages(id);
    return !!(source && 'packages' in source && Array.isArray(source.packages) && source.packages.length > 0);
  }

  /**
   * Find sources with API endpoints
   */
  async findWithApiEndpoints(): Promise<Source[]> {
    const { isNotNull } = await import('drizzle-orm');
    return this.findMany({
      where: isNotNull(sources.apiEndpoint),
    });
  }
}

// Export singleton instance
export const sourcesRepository = new SourcesRepository();
