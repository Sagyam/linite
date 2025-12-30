/**
 * Shared entity type definitions
 * Single source of truth for all entity types across the application
 */

// ============================================================================
// DATABASE ENTITIES
// ============================================================================

export interface App {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  iconUrl: string | null;
  homepage: string | null;
  isPopular: boolean;
  isFoss: boolean;
  categoryId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppWithRelations extends App {
  category: Category;
  packages: PackageWithRelations[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Source {
  id: string;
  name: string;
  slug: string;
  installCmd: string;
  requireSudo: boolean;
  setupCmd: string | null;
  priority: number;
  apiEndpoint: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Distro {
  id: string;
  name: string;
  slug: string;
  family: string;
  iconUrl: string | null;
  basedOn: string | null;
  isPopular: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Package {
  id: string;
  appId: string;
  sourceId: string;
  identifier: string;
  version: string | null;
  downloadSize: string | null;
  isAvailable: boolean;
  lastChecked: Date | null;
  metadata: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PackageWithRelations extends Package {
  app: {
    id: string;
    displayName: string;
    slug?: string;
  };
  source: {
    id: string;
    name: string;
    slug: string;
    installCmd?: string;
    requireSudo?: boolean;
  };
}

export interface DistroSource {
  id: string;
  distroId: string;
  sourceId: string;
  priority: number;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefreshLog {
  id: string;
  sourceId: string;
  status: 'success' | 'partial' | 'failed';
  packagesUpdated: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ============================================================================
// COMMAND GENERATION TYPES
// ============================================================================

export interface PackageBreakdown {
  source: string;
  packages: string[];
}

export interface GenerateCommandRequest {
  distroSlug: string;
  appIds: string[];
  sourcePreference?: string;
}

export interface GenerateCommandResponse {
  commands: string[];
  setupCommands: string[];
  warnings: string[];
  breakdown: PackageBreakdown[];
}

// ============================================================================
// REFRESH TYPES
// ============================================================================

export interface RefreshResult {
  sourceId: string;
  sourceName: string;
  packagesChecked: number;
  packagesUpdated: number;
  errors: string[];
  duration: number;
}

export interface RefreshOptions {
  sourceId?: string;
  dryRun?: boolean;
}

// ============================================================================
// PACKAGE METADATA TYPES
// ============================================================================

export interface PackageMetadata {
  version?: string;
  downloadSize?: number | null;
  maintainer?: string;
  metadata?: unknown;
}
