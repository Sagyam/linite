import { db } from '@/db';
import { distros } from '@/db/schema';
import { BaseRepository } from './base.repository';
import { eq, desc } from 'drizzle-orm';
import type { Distro } from '@/types';

/**
 * Distros Repository
 * Handles all database operations for distros
 */

export class DistrosRepository extends BaseRepository<Distro> {
  constructor() {
    super(distros, 'distros');
  }

  /**
   * Find all distros ordered by popularity
   */
  async findAllOrdered(): Promise<Distro[]> {
    return this.findMany({
      orderBy: [desc(distros.isPopular), desc(distros.name)],
    });
  }

  /**
   * Find all distros with their sources (normalized)
   * Applies default values and normalizes the data structure
   */
  async findAllWithSourcesNormalized() {
    const allDistros = await db.query.distros.findMany({
      orderBy: [desc(distros.isPopular), desc(distros.name)],
      with: {
        distroSources: {
          with: {
            source: true,
          },
          orderBy: (ds, { desc }) => [desc(ds.priority)],
        },
      },
    });

    // Normalize distros data with proper defaults
    return allDistros.map((distro) => ({
      id: distro.id,
      name: distro.name,
      slug: distro.slug,
      family: distro.family,
      iconUrl: distro.iconUrl,
      basedOn: distro.basedOn,
      isPopular: distro.isPopular ?? false,
      themeColorLight: distro.themeColorLight ?? null,
      themeColorDark: distro.themeColorDark ?? null,
      distroSources: distro.distroSources.map((ds) => ({
        sourceId: ds.sourceId,
        priority: ds.priority ?? 0,
        isDefault: ds.isDefault ?? false,
        source: {
          id: ds.source.id,
          name: ds.source.name,
          slug: ds.source.slug,
        },
      })),
    }));
  }

  /**
   * Find distro by slug
   */
  async findBySlug(slug: string): Promise<Distro | undefined> {
    return this.findFirst({
      where: eq(distros.slug, slug),
    });
  }

  /**
   * Find distro by slug with sources
   */
  async findBySlugWithSources(slug: string) {
    const distro = await db.query.distros.findFirst({
      where: eq(distros.slug, slug),
      with: {
        distroSources: {
          with: {
            source: true,
          },
          orderBy: (ds, { desc }) => [desc(ds.priority)],
        },
      },
    });

    if (!distro) return undefined;

    // Normalize the distro data
    return {
      id: distro.id,
      name: distro.name,
      slug: distro.slug,
      family: distro.family,
      iconUrl: distro.iconUrl,
      basedOn: distro.basedOn,
      isPopular: distro.isPopular ?? false,
      themeColorLight: distro.themeColorLight ?? null,
      themeColorDark: distro.themeColorDark ?? null,
      distroSources: distro.distroSources.map((ds) => ({
        sourceId: ds.sourceId,
        priority: ds.priority ?? 0,
        isDefault: ds.isDefault ?? false,
        source: {
          id: ds.source.id,
          name: ds.source.name,
          slug: ds.source.slug,
        },
      })),
    };
  }

  /**
   * Find popular distros
   */
  async findPopular(): Promise<Distro[]> {
    return this.findMany({
      where: eq(distros.isPopular, true),
      orderBy: [desc(distros.name)],
    });
  }
}

// Export singleton instance
export const distrosRepository = new DistrosRepository();
