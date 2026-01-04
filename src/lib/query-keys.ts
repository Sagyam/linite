/**
 * Centralized Query Keys Factory
 * Provides consistent query keys for React Query across the application
 *
 * Benefits:
 * - Type-safe query keys
 * - Consistent key structure
 * - Easy cache invalidation
 * - Better debugging
 */

import type { AppsQueryParams } from '@/hooks/use-apps';

/**
 * Query keys for apps-related queries
 */
export const queryKeys = {
  /**
   * Apps queries
   */
  apps: {
    /** Base key for all apps queries */
    all: ['apps'] as const,

    /** All list queries (paginated/filtered) */
    lists: () => [...queryKeys.apps.all, 'list'] as const,

    /** Specific list query with params */
    list: (params: AppsQueryParams) => [...queryKeys.apps.lists(), params] as const,

    /** All detail queries (single app) */
    details: () => [...queryKeys.apps.all, 'detail'] as const,

    /** Specific detail query by ID */
    detail: (id: string) => [...queryKeys.apps.details(), id] as const,

    /** Specific detail query by slug */
    detailBySlug: (slug: string) => [...queryKeys.apps.details(), 'slug', slug] as const,

    /** Batch fetch by IDs */
    byIds: (ids: string[]) => [...queryKeys.apps.all, 'batch', ids.sort()] as const,

    /** Selection-specific query */
    selection: (ids: string[]) => [...queryKeys.apps.all, 'selection', ids.sort()] as const,
  },

  /**
   * Categories queries
   */
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    detail: (id: string) => [...queryKeys.categories.all, 'detail', id] as const,
  },

  /**
   * Distros queries
   */
  distros: {
    all: ['distros'] as const,
    lists: () => [...queryKeys.distros.all, 'list'] as const,
    list: () => [...queryKeys.distros.lists()] as const,
    detail: (id: string) => [...queryKeys.distros.all, 'detail', id] as const,
    detailBySlug: (slug: string) => [...queryKeys.distros.all, 'detail', 'slug', slug] as const,
  },

  /**
   * Sources queries
   */
  sources: {
    all: ['sources'] as const,
    lists: () => [...queryKeys.sources.all, 'list'] as const,
    list: () => [...queryKeys.sources.lists()] as const,
    detail: (id: string) => [...queryKeys.sources.all, 'detail', id] as const,
  },

  /**
   * Collections queries
   */
  collections: {
    all: ['collections'] as const,
    lists: () => [...queryKeys.collections.all, 'list'] as const,
    list: (params?: { featured?: boolean; userId?: string }) =>
      [...queryKeys.collections.lists(), params] as const,
    detail: (id: string) => [...queryKeys.collections.all, 'detail', id] as const,
    detailBySlug: (slug: string) =>
      [...queryKeys.collections.all, 'detail', 'slug', slug] as const,
  },

  /**
   * Command generation queries
   */
  commands: {
    all: ['commands'] as const,
    generate: (distroSlug: string, appIds: string[], sourcePreference?: string) =>
      [
        ...queryKeys.commands.all,
        'generate',
        { distroSlug, appIds: appIds.sort(), sourcePreference },
      ] as const,
  },
} as const;

/**
 * Type-safe query key getter
 * Ensures query keys are always accessed consistently
 */
export type QueryKeys = typeof queryKeys;

/**
 * Helper to extract the return type of query key functions
 */
export type QueryKey<T extends (...args: any[]) => readonly unknown[]> = ReturnType<T>;
