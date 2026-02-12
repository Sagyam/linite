import { db, distroSources } from '@/db';
import { successResponse } from '@/lib/api-utils';
import { createPublicApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { createDistroSourceSchema } from '@/lib/validation/schemas/distro-source.schema';

// GET /api/distro-sources - Get all distro-source mappings (public)
export const GET = createPublicApiHandler(async () => {
  const mappings = await db.query.distroSources.findMany({
    with: {
      distro: true,
      source: true,
    },
  });

  return successResponse(mappings);
});

// POST /api/distro-sources - Create new mapping (admin)
export const POST = createAuthValidatedApiHandler(
  createDistroSourceSchema,
  async (_request, data) => {
    const [newMapping] = await db.insert(distroSources).values(data).returning();

    return successResponse(newMapping, 201);
  }
);
