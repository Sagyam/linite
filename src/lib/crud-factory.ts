/**
 * Generic CRUD Route Factory
 *
 * Eliminates ~250 LOC of duplication across 5 entity routes by providing
 * standardized GET/PUT/DELETE handlers with configurable behavior.
 *
 * Usage Example:
 * ```typescript
 * const handlers = createCRUDHandlers({
 *   table: categories,
 *   tableName: 'categories',
 *   updateSchema: updateCategorySchema,
 *   withRelations: { apps: true },
 *   beforeDelete: async (record) => {
 *     if (record.apps.length > 0) {
 *       throw new Error('Cannot delete category with apps');
 *     }
 *   },
 * });
 *
 * export const { GET, PUT, DELETE } = handlers;
 * ```
 */

import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { ZodSchema } from 'zod';
import {
  createPublicApiHandler,
  createAuthValidatedApiHandler,
  createAuthApiHandler,
  type ApiHandler,
} from './api-middleware';
import { errorResponse, successResponse } from './api-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Configuration for CRUD handlers
 */
export interface CRUDConfig<TUpdateInput, TRecord = unknown> {
  /**
   * Drizzle table reference (e.g., apps, categories, sources)
   */
  table: unknown;

  /**
   * Table name for db.query (e.g., 'apps', 'categories')
   */
  tableName: string;

  /**
   * Entity name for error messages (e.g., 'App', 'Category')
   * Defaults to capitalized tableName
   */
  entityName?: string;

  /**
   * Zod schema for update validation
   */
  updateSchema: ZodSchema<TUpdateInput>;

  /**
   * Relations to include in GET request
   * Example: { apps: true, packages: { with: { source: true } } }
   */
  withRelations?: Record<string, unknown>;

  /**
   * Require authentication for GET requests
   * Defaults to false (public GET)
   */
  requireAuthForGet?: boolean;

  /**
   * Optional pre-delete validation hook
   * Receives the record with relations (if configured)
   * Throw an error to prevent deletion
   */
  beforeDelete?: (record: TRecord) => Promise<void> | void;

  /**
   * Custom update logic
   * If provided, overrides default update behavior
   */
  customUpdate?: (data: TUpdateInput, id: string) => Promise<unknown>;
}

/**
 * CRUD handlers result
 */
export interface CRUDHandlers {
  GET: ApiHandler<RouteContext>;
  PUT: ApiHandler<RouteContext>;
  DELETE: ApiHandler<RouteContext>;
}

/**
 * Create standardized CRUD handlers for an entity
 */
export function createCRUDHandlers<TUpdateInput extends { id: string }, TRecord = unknown>(
  config: CRUDConfig<TUpdateInput, TRecord>
): CRUDHandlers {
  const {
    table,
    tableName,
    entityName = tableName.charAt(0).toUpperCase() + tableName.slice(1),
    updateSchema,
    withRelations,
    requireAuthForGet = false,
    beforeDelete,
    customUpdate,
  } = config;

  // GET /api/[resource]/[id] - Get single entity (public or auth-required)
  const getHandler = async (_request: unknown, context: RouteContext | undefined) => {
    const { id } = await context!.params;

    const queryConfig: Record<string, unknown> = {
      where: eq((table as any).id, id),
    };

    if (withRelations) {
      queryConfig.with = withRelations;
    }

    const record = await (db.query as any)[tableName].findFirst(queryConfig);

    if (!record) {
      return errorResponse(`${entityName} not found`, 404);
    }

    return successResponse(record);
  };

  const GET = requireAuthForGet
    ? createAuthApiHandler<RouteContext>(getHandler)
    : createPublicApiHandler<RouteContext>(getHandler);

  // PUT /api/[resource]/[id] - Update entity (admin)
  const PUT = createAuthValidatedApiHandler<TUpdateInput, RouteContext>(
    updateSchema,
    async (_request, data, context) => {
      const { id } = await context!.params;

      // Verify ID matches
      if (data.id !== id) {
        return errorResponse('ID in body must match ID in URL', 400);
      }

      let updated;

      if (customUpdate) {
        // Use custom update logic if provided
        updated = await customUpdate(data, id);
      } else {
        // Default update logic: extract validated fields and update
        const { id: _, ...updateData } = data as Record<string, unknown>;

        // Build update object with conditional field inclusion
        const updateFields: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(updateData)) {
          if (value !== undefined) {
            // Handle null/empty string normalization
            updateFields[key] = value === '' ? null : value;
          }
        }

        // Always update the timestamp
        updateFields.updatedAt = new Date();

        const [result] = (await db
          .update(table as any)
          .set(updateFields)
          .where(eq((table as any).id, id))
          .returning()) as any[];

        updated = result;
      }

      if (!updated) {
        return errorResponse(`${entityName} not found`, 404);
      }

      return successResponse(updated);
    }
  );

  // DELETE /api/[resource]/[id] - Delete entity (admin)
  const DELETE = createAuthApiHandler<RouteContext>(async (_request, context) => {
    const { id } = await context!.params;

    // Run pre-delete validation if configured
    if (beforeDelete) {
      const queryConfig: Record<string, unknown> = {
        where: eq((table as any).id, id),
      };

      if (withRelations) {
        queryConfig.with = withRelations;
      }

      const record = await (db.query as any)[tableName].findFirst(queryConfig);

      if (!record) {
        return errorResponse(`${entityName} not found`, 404);
      }

      try {
        await beforeDelete(record as TRecord);
      } catch (error) {
        return errorResponse(
          error instanceof Error ? error.message : 'Validation failed',
          400
        );
      }
    }

    // Perform deletion
    const result = (await db.delete(table as any).where(eq((table as any).id, id)).returning()) as any[];

    if (result.length === 0) {
      return errorResponse(`${entityName} not found`, 404);
    }

    return successResponse({ success: true });
  });

  return { GET, PUT, DELETE };
}
