/**
 * API Request and Response Types
 * Centralized types for all API operations
 */

import type {
  App,
  Category,
  Source,
  Distro,
  Package,
  DistroSource,
  AppWithRelations,
  PackageWithRelations,
  Installation,
  InstallationWithRelations,
  GenerateUninstallCommandRequest,
  GenerateUninstallCommandResponse
} from './entities';

// ============================================================================
// GENERIC API TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  error?: never;
}

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
  data?: never;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// APP API TYPES
// ============================================================================

export interface GetAppsParams extends PaginationParams, SortParams {
  category?: string;
  popular?: boolean;
  search?: string;
}

export type GetAppsResponse = AppWithRelations[];

export interface CreateAppRequest {
  slug: string;
  displayName: string;
  description?: string;
  iconUrl?: string;
  homepage?: string;
  isPopular?: boolean;
  isFoss?: boolean;
  categoryId: string;
}

export type CreateAppResponse = App;

export interface UpdateAppRequest extends Partial<CreateAppRequest> {
  id: string;
}

export type UpdateAppResponse = App;

export type GetAppByIdResponse = AppWithRelations;

export type GetAppBySlugResponse = AppWithRelations;

// ============================================================================
// CATEGORY API TYPES
// ============================================================================

export type GetCategoriesParams = PaginationParams & SortParams;

export type GetCategoriesResponse = Category[];

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  displayOrder?: number;
}

export type CreateCategoryResponse = Category;

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: string;
}

export type UpdateCategoryResponse = Category;

// ============================================================================
// SOURCE API TYPES
// ============================================================================

export type GetSourcesParams = PaginationParams;

export type GetSourcesResponse = Source[];

export interface CreateSourceRequest {
  name: string;
  slug: string;
  installCmd: string;
  requireSudo?: boolean;
  setupCmd?: string;
  priority?: number;
  apiEndpoint?: string;
}

export type CreateSourceResponse = Source;

export interface UpdateSourceRequest extends Partial<CreateSourceRequest> {
  id: string;
}

export type UpdateSourceResponse = Source;

// ============================================================================
// DISTRO API TYPES
// ============================================================================

export interface DistroWithRelations extends Distro {
  distroSources: Array<{
    id: string;
    priority: number;
    isDefault: boolean;
    source: Source;
  }>;
}

export type GetDistrosParams = PaginationParams;

export type GetDistrosResponse = DistroWithRelations[];

export interface CreateDistroRequest {
  name: string;
  slug: string;
  family: string;
  iconUrl?: string;
  basedOn?: string;
  isPopular?: boolean;
}

export type CreateDistroResponse = Distro;

export interface UpdateDistroRequest extends Partial<CreateDistroRequest> {
  id: string;
}

export type UpdateDistroResponse = Distro;

// ============================================================================
// PACKAGE API TYPES
// ============================================================================

export interface GetPackagesParams extends PaginationParams {
  appId?: string;
  sourceId?: string;
  available?: boolean;
}

export type GetPackagesResponse = PackageWithRelations[];

export interface CreatePackageRequest {
  appId: string;
  sourceId: string;
  identifier: string;
  version?: string;
  size?: number;
  maintainer?: string;
  isAvailable?: boolean;
  metadata?: Record<string, unknown>;
}

export type CreatePackageResponse = Package;

export interface UpdatePackageRequest extends Partial<CreatePackageRequest> {
  id: string;
}

export type UpdatePackageResponse = Package;

// ============================================================================
// DISTRO SOURCE API TYPES
// ============================================================================

export interface CreateDistroSourceRequest {
  distroId: string;
  sourceId: string;
  priority?: number;
  isDefault?: boolean;
}

export type CreateDistroSourceResponse = DistroSource;

export interface UpdateDistroSourceRequest extends Partial<CreateDistroSourceRequest> {
  id: string;
}

export type UpdateDistroSourceResponse = DistroSource;

// ============================================================================
// SEARCH API TYPES
// ============================================================================

export interface SearchExternalRequest {
  source: string;
  query: string;
}

export interface ExternalPackageResult {
  identifier: string;
  name: string;
  version?: string;
  description?: string;
  iconUrl?: string;
}

export type SearchExternalResponse = ExternalPackageResult[];

// ============================================================================
// UPLOAD API TYPES
// ============================================================================

export interface UploadImageRequest {
  file: File;
  pathname?: string;
}

export interface UploadImageResponse {
  url: string;
}

export interface DeleteImageRequest {
  url: string;
}

export interface DeleteImageResponse {
  success: boolean;
}

// ============================================================================
// REFRESH API TYPES
// ============================================================================

export interface TriggerRefreshRequest {
  sourceId?: string;
  dryRun?: boolean;
}

export interface RefreshLogResponse {
  id: string;
  sourceId: string;
  sourceName: string;
  status: 'success' | 'partial' | 'failed';
  packagesUpdated: number;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date;
}

export type GetRefreshLogsResponse = RefreshLogResponse[];

// ============================================================================
// INSTALLATION HISTORY API TYPES (Authenticated Users)
// ============================================================================

export interface GetInstallationsParams extends PaginationParams {
  deviceIdentifier?: string;
  appId?: string;
  distroId?: string;
}

export type GetInstallationsResponse = InstallationWithRelations[];

export interface CreateInstallationRequest {
  appId: string;
  packageId: string;
  distroId: string;
  deviceIdentifier: string;
  notes?: string;
}

export type CreateInstallationResponse = Installation;

export interface UpdateInstallationRequest {
  deviceIdentifier?: string;
  notes?: string;
}

export type UpdateInstallationResponse = Installation;

export type GetInstallationByIdResponse = InstallationWithRelations;

export interface GetUserDevicesResponse {
  devices: string[];
}

// ============================================================================
// UNINSTALL COMMAND GENERATION API TYPES
// ============================================================================

export type GenerateUninstallRequest = GenerateUninstallCommandRequest;
export type GenerateUninstallResponse = GenerateUninstallCommandResponse;