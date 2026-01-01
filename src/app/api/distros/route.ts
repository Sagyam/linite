import { db, distros } from '@/db';
import { successResponse } from '@/lib/api-utils';
import { desc } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';
import { createPublicApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { createDistroSchema } from '@/lib/validation';
import type { GetDistrosResponse, CreateDistroResponse } from '@/types';

// GET /api/distros - Get all distros (public)
export const GET = createPublicApiHandler(
  async () => {
    const allDistros = await db.query.distros.findMany({
      orderBy: [desc(distros.isPopular), desc(distros.name)],
      with: {
        distroSources: {
          with: {
            source: true,
          },
          orderBy: (ds, { desc }) => [desc(ds.priority)],
        },
      },
    });

    return successResponse<GetDistrosResponse>(allDistros as GetDistrosResponse);
  },
  publicApiLimiter
);

// POST /api/distros - Create new distro (admin)
export const POST = createAuthValidatedApiHandler(
  createDistroSchema,
  async (_request, data) => {
    const newDistro = await db
      .insert(distros)
      .values({
        name: data.name,
        slug: data.slug,
        family: data.family,
        iconUrl: data.iconUrl || null,
        basedOn: data.basedOn || null,
        isPopular: data.isPopular ?? false,
      })
      .returning()
      .then((rows) => rows[0]);

    return successResponse<CreateDistroResponse>(newDistro as CreateDistroResponse, 201);
  }
);
