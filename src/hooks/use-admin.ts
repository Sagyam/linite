'use client';

import { createCrudHooks } from './use-crud';
import type { Category, Source, Distro, PackageWithRelations } from '@/types/entities';

// App type with category relation for admin list view
export interface App {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  isPopular: boolean;
  isFoss: boolean;
  category: {
    name: string;
  } | null;
}

// Re-export types for backward compatibility
export type { Category, Source, Distro };
export type Package = PackageWithRelations;

// ============================================================================
// CRUD HOOKS
// ============================================================================

// Apps
const appHooks = createCrudHooks<App>({
  entityName: 'App',
  pluralName: 'apps',
  endpoint: '/api/apps',
  queryKey: 'apps',
});

export const useAdminApps = appHooks.useList;
export const useDeleteApp = appHooks.useDelete;

// Categories
const categoryHooks = createCrudHooks<Category>({
  entityName: 'Category',
  pluralName: 'categories',
  endpoint: '/api/categories',
  queryKey: 'categories',
});

export const useAdminCategories = categoryHooks.useList;
export const useDeleteCategory = categoryHooks.useDelete;

// Sources
const sourceHooks = createCrudHooks<Source>({
  entityName: 'Source',
  pluralName: 'sources',
  endpoint: '/api/sources',
  queryKey: 'sources',
});

export const useAdminSources = sourceHooks.useList;
export const useDeleteSource = sourceHooks.useDelete;

// Distros
const distroHooks = createCrudHooks<Distro>({
  entityName: 'Distribution',
  pluralName: 'distros',
  endpoint: '/api/distros',
  queryKey: 'distros',
});

export const useAdminDistros = distroHooks.useList;
export const useDeleteDistro = distroHooks.useDelete;

// Packages
const packageHooks = createCrudHooks<Package>({
  entityName: 'Package',
  pluralName: 'packages',
  endpoint: '/api/packages',
  queryKey: 'packages',
});

export const useAdminPackages = packageHooks.useList;
export const useDeletePackage = packageHooks.useDelete;
