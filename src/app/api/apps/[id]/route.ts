import { NextRequest } from 'next/server';
import { db, apps } from '@/db';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';
import { createPublicApiHandler, createAuthValidatedApiHandler, createAuthApiHandler } from '@/lib/api-middleware';
import { updateAppSchema } from '@/lib/validation';
import type { GetAppByIdResponse, UpdateAppResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/apps/[id] - Get single app (public)
export const GET = createPublicApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    const app = await db.query.apps.findFirst({
      where: eq(apps.id, id),
      with: {
        category: true,
        packages: {
          with: {
            source: true,
          },
        },
      },
    });

    if (!app) {
      return errorResponse('App not found', 404);
    }

    return successResponse<GetAppByIdResponse>(app);
  }
);

// PUT /api/apps/[id] - Update app (admin)
export const PUT = createAuthValidatedApiHandler<UpdateAppInput, RouteContext>(
  updateAppSchema,
  async (_request, data, context) => {
    const { id } = await context!.params;

    // Verify ID matches
    if (data.id !== id) {
      return errorResponse('ID in body must match ID in URL', 400);
    }

    const [updated] = await db
      .update(apps)
      .set({
        ...(data.slug && { slug: data.slug }),
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl || null }),
        ...(data.homepage !== undefined && { homepage: data.homepage || null }),
        ...(data.isPopular !== undefined && { isPopular: data.isPopular }),
        ...(data.isFoss !== undefined && { isFoss: data.isFoss }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        updatedAt: new Date(),
      })
      .where(eq(apps.id, id))
      .returning();

    if (!updated) {
      return errorResponse('App not found', 404);
    }

    return successResponse<UpdateAppResponse>(updated);
  }
);

// DELETE /api/apps/[id] - Delete app (admin)
export const DELETE = createAuthApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    // Packages will be cascade deleted due to onDelete: 'cascade' in schema
    const result = await db.delete(apps).where(eq(apps.id, id)).returning();

    if (result.length === 0) {
      return errorResponse('App not found', 404);
    }

    return successResponse({ success: true });
  }
);

// Import type for UpdateAppInput
import type { UpdateAppInput } from '@/lib/validation';
