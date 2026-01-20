import { db, packages } from '@/db';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';
import { createAuthApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { updatePackageSchema } from '@/lib/validation';
import type { UpdatePackageInput } from '@/lib/validation';
import type { UpdatePackageResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/packages/[id] - Get single package (admin)
export const GET = createAuthApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    const pkg = await db.query.packages.findFirst({
      where: eq(packages.id, id),
      with: {
        app: true,
        source: true,
      },
    });

    if (!pkg) {
      return errorResponse('Package not found', 404);
    }

    return successResponse(pkg);
  }
);

// PUT /api/packages/[id] - Update package (admin)
export const PUT = createAuthValidatedApiHandler<UpdatePackageInput, RouteContext>(
  updatePackageSchema,
  async (_request, data, context) => {
    const { id } = await context!.params;

    if (data.id !== id) {
      return errorResponse('ID in body must match ID in URL', 400);
    }

    const [updated] = await db
      .update(packages)
      .set({
        ...(data.appId && { appId: data.appId }),
        ...(data.sourceId && { sourceId: data.sourceId }),
        ...(data.identifier && { identifier: data.identifier }),
        ...(data.version !== undefined && { version: data.version || null }),
        ...(data.size !== undefined && { size: data.size || null }),
        ...(data.maintainer !== undefined && { maintainer: data.maintainer || null }),
        ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
        ...(data.metadata !== undefined && { metadata: data.metadata || null }),
        ...(data.packageSetupCmd !== undefined && { packageSetupCmd: data.packageSetupCmd || null }),
        updatedAt: new Date(),
      })
      .where(eq(packages.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Package not found', 404);
    }

    return successResponse(updated as UpdatePackageResponse);
  }
);

// DELETE /api/packages/[id] - Delete package (admin)
export const DELETE = createAuthApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    const result = await db.delete(packages).where(eq(packages.id, id)).returning();

    if (result.length === 0) {
      return errorResponse('Package not found', 404);
    }

    return successResponse({ success: true });
  }
);
