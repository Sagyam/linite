import { db, distroSources } from '@/db';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { createPublicApiHandler, createAuthValidatedApiHandler, createAuthApiHandler } from '@/lib/api-middleware';
import { updateDistroSourceSchema, type UpdateDistroSourceInput } from '@/lib/validation/schemas/distro-source.schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/distro-sources/[id] - Get single mapping (public)
export const GET = createPublicApiHandler<RouteContext>(async (_request, context) => {
  const { id } = await context!.params;
  const mapping = await db.query.distroSources.findFirst({
    where: eq(distroSources.id, id),
    with: {
      distro: true,
      source: true,
    },
  });

  if (!mapping) {
    return errorResponse('Distro-source mapping not found', 404);
  }

  return successResponse(mapping);
});

// PUT /api/distro-sources/[id] - Update mapping (admin)
export const PUT = createAuthValidatedApiHandler<UpdateDistroSourceInput, RouteContext>(
  updateDistroSourceSchema,
  async (_request, data, context) => {
    const { id } = await context!.params;

    if (data.id !== id) {
      return errorResponse('ID in body must match ID in URL', 400);
    }

    const [updated] = await db.update(distroSources)
      .set({
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      })
      .where(eq(distroSources.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Distro-source mapping not found', 404);
    }

    return successResponse(updated);
  }
);

// DELETE /api/distro-sources/[id] - Delete mapping (admin)
export const DELETE = createAuthApiHandler<RouteContext>(async (_request, context) => {
  const { id } = await context!.params;

  const result = await db.delete(distroSources).where(eq(distroSources.id, id)).returning();

  if (result.length === 0) {
    return errorResponse('Distro-source mapping not found', 404);
  }

  return successResponse({ success: true });
});
