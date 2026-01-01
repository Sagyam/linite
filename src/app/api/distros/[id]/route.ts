import { db, distros } from '@/db';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';
import { createPublicApiHandler, createAuthValidatedApiHandler, createAuthApiHandler } from '@/lib/api-middleware';
import { updateDistroSchema } from '@/lib/validation';
import type { UpdateDistroInput } from '@/lib/validation';
import type { UpdateDistroResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/distros/[id] - Get single distro (public)
export const GET = createPublicApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    const distro = await db.query.distros.findFirst({
      where: eq(distros.id, id),
      with: {
        distroSources: {
          with: {
            source: true,
          },
        },
      },
    });

    if (!distro) {
      return errorResponse('Distro not found', 404);
    }

    return successResponse(distro);
  }
);

// PUT /api/distros/[id] - Update distro (admin)
export const PUT = createAuthValidatedApiHandler<UpdateDistroInput, RouteContext>(
  updateDistroSchema,
  async (_request, data, context) => {
    const { id } = await context!.params;

    if (data.id !== id) {
      return errorResponse('ID in body must match ID in URL', 400);
    }

    const [updated] = await db
      .update(distros)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.family && { family: data.family }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl || null }),
        ...(data.basedOn !== undefined && { basedOn: data.basedOn || null }),
        ...(data.isPopular !== undefined && { isPopular: data.isPopular }),
        updatedAt: new Date(),
      })
      .where(eq(distros.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Distro not found', 404);
    }

    return successResponse<UpdateDistroResponse>(updated as UpdateDistroResponse);
  }
);

// DELETE /api/distros/[id] - Delete distro (admin)
export const DELETE = createAuthApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

    const result = await db.delete(distros).where(eq(distros.id, id)).returning();

    if (result.length === 0) {
      return errorResponse('Distro not found', 404);
    }

    return successResponse({ success: true });
  }
);
