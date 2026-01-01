import { db, sources } from '@/db';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';
import { createPublicApiHandler, createAuthValidatedApiHandler, createAuthApiHandler } from '@/lib/api-middleware';
import { updateSourceSchema } from '@/lib/validation';
import type { UpdateSourceInput } from '@/lib/validation';
import type { UpdateSourceResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/sources/[id] - Get single source (public)
export const GET = createPublicApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    const source = await db.query.sources.findFirst({
      where: eq(sources.id, id),
      with: {
        packages: true,
      },
    });

    if (!source) {
      return errorResponse('Source not found', 404);
    }

    return successResponse(source);
  }
);

// PUT /api/sources/[id] - Update source (admin)
export const PUT = createAuthValidatedApiHandler<UpdateSourceInput, RouteContext>(
  updateSourceSchema,
  async (_request, data, context) => {
    const { id } = await context!.params;

    // Verify ID matches
    if (data.id !== id) {
      return errorResponse('ID in body must match ID in URL', 400);
    }

    const [updated] = await db
      .update(sources)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.installCmd && { installCmd: data.installCmd }),
        ...(data.requireSudo !== undefined && { requireSudo: data.requireSudo }),
        ...(data.setupCmd !== undefined && { setupCmd: data.setupCmd || null }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.apiEndpoint !== undefined && { apiEndpoint: data.apiEndpoint || null }),
        updatedAt: new Date(),
      })
      .where(eq(sources.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Source not found', 404);
    }

    return successResponse(updated as UpdateSourceResponse);
  }
);

// DELETE /api/sources/[id] - Delete source (admin)
export const DELETE = createAuthApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    // Check if source has packages
    const source = await db.query.sources.findFirst({
      where: eq(sources.id, id),
      with: {
        packages: true,
      },
    });

    if (!source) {
      return errorResponse('Source not found', 404);
    }

    if (source.packages.length > 0) {
      return errorResponse('Cannot delete source with packages. Delete packages first.', 400);
    }

    const result = await db.delete(sources).where(eq(sources.id, id)).returning();

    if (result.length === 0) {
      return errorResponse('Source not found', 404);
    }

    return successResponse({ success: true });
  }
);
