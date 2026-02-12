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
  isPopular: boolean | null; // Has default(false) but nullable in schema
  isFoss: boolean | null; // Has default(true) but nullable in schema
  categoryId: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
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
  displayOrder: number | null; // Has default(0) but nullable in schema
  colorLight: string | null;
  colorDark: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Source {
  id: string;
  name: string;
  slug: string;
  installCmd: string;
  removeCmd: string | null; // Uninstall command template
  requireSudo: boolean | null; // Has default(false) but nullable in schema
  setupCmd: string | Record<string, string> | null; // JSON field - can be string or object
  cleanupCmd: string | Record<string, string> | null; // JSON field - reverse of setupCmd
  supportsDependencyCleanup: boolean | null; // Has default(false) but nullable in schema
  dependencyCleanupCmd: string | null; // e.g., "apt autoremove -y"
  priority: number | null; // Has default(0) but nullable in schema
  apiEndpoint: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Distro {
  id: string;
  name: string;
  slug: string;
  family: string;
  iconUrl: string | null;
  basedOn: string | null;
  isPopular: boolean | null; // Has default(false) but nullable in schema
  themeColorLight: string | null;
  themeColorDark: string | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UninstallMetadata {
  linux?: string;
  windows?: string;
  manualInstructions?: string;
}

export interface Package {
  id: string;
  appId: string;
  sourceId: string;
  identifier: string;
  version: string | null;
  size: number | null;
  maintainer: string | null;
  isAvailable: boolean | null; // Has default(true) but nullable in schema
  lastChecked: Date | null;
  metadata: unknown;
  packageSetupCmd?: string | Record<string, string | null> | null;
  packageCleanupCmd?: string | Record<string, string | null> | null;
  uninstallMetadata?: UninstallMetadata | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
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
  priority: number | null; // Has default(0) but nullable in schema
  isDefault: boolean | null; // Has default(false) but nullable in schema
  createdAt?: Date | null;
  updatedAt?: Date | null;
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

export interface User {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean | null;
  image: string | null;
  role: ('user' | 'admin' | 'superadmin') | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  slug: string;
  iconUrl: string | null;
  isPublic: boolean;
  isFeatured: boolean;
  isTemplate: boolean;
  shareToken: string | null;
  viewCount: number;
  installCount: number;
  tags: string[] | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CollectionWithRelations extends Collection {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  items: CollectionItemWithApp[];
  likes?: CollectionLike[];
  _count?: {
    likes: number;
  };
}

export interface CollectionItem {
  id: string;
  collectionId: string;
  appId: string;
  displayOrder: number;
  note: string | null;
  createdAt?: Date;
}

export interface CollectionItemWithApp extends CollectionItem {
  app: App;
}

export interface CollectionLike {
  id: string;
  userId: string;
  collectionId: string;
  createdAt?: Date;
}

// ============================================================================
// INSTALLATION TRACKING (Authenticated Users)
// ============================================================================

export interface Installation {
  id: string;
  userId: string;
  appId: string;
  packageId: string;
  distroId: string;
  deviceIdentifier: string; // User-provided name: "My Laptop", "Work PC"
  installedAt: Date;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InstallationWithRelations extends Installation {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  app: {
    id: string;
    displayName: string;
    slug: string;
    iconUrl: string | null;
  };
  package: {
    id: string;
    identifier: string;
    version: string | null;
    source: {
      id: string;
      name: string;
      slug: string;
    };
  };
  distro: {
    id: string;
    name: string;
    slug: string;
    iconUrl: string | null;
  };
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
  // Extended fields for installation tracking
  appId?: string;
  appName?: string;
  packageId?: string;
  distroId?: string;
}

export interface GenerateCommandRequest {
  distroSlug: string;
  appIds: string[];
  sourcePreference?: string;
  nixosInstallMethod?: 'nix-shell' | 'nix-env' | 'nix-flakes';
}

export interface GenerateCommandResponse {
  commands: string[];
  setupCommands: string[];
  warnings: string[];
  breakdown: PackageBreakdown[];
}

export interface ManualUninstallStep {
  appName: string;
  instructions: string;
}

export interface GenerateUninstallCommandRequest {
  distroSlug: string;
  appIds: string[];
  sourcePreference?: string;
  nixosInstallMethod?: 'nix-shell' | 'nix-env' | 'nix-flakes';
  includeDependencyCleanup?: boolean; // Default: false
  includeSetupCleanup?: boolean; // Default: false
}

export interface GenerateUninstallCommandResponse {
  commands: string[];
  cleanupCommands: string[]; // Reverse of setupCommands
  dependencyCleanupCommands: string[]; // apt autoremove, etc.
  warnings: string[];
  breakdown: PackageBreakdown[];
  manualSteps: ManualUninstallStep[]; // For script sources
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
