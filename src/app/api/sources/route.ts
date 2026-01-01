import { db, sources } from '@/db';
import { successResponse } from '@/lib/api-utils';
import { desc } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';
import { createPublicApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { createSourceSchema } from '@/lib/validation';
import type { GetSourcesResponse, CreateSourceResponse } from '@/types';

// GET /api/sources - Get all sources (public)
export const GET = createPublicApiHandler(
  async () => {
    const allSources = await db.query.sources.findMany({
      orderBy: [desc(sources.priority), desc(sources.name)],
    });

    return successResponse(allSources as GetSourcesResponse);
  },
  publicApiLimiter
);

// POST /api/sources - Create new source (admin)
export const POST = createAuthValidatedApiHandler(
  createSourceSchema,
  async (_request, data) => {
    const newSource = await db
      .insert(sources)
      .values({
        name: data.name,
        slug: data.slug,
        installCmd: data.installCmd,
        requireSudo: data.requireSudo ?? false,
        setupCmd: data.setupCmd || null,
        priority: data.priority ?? 0,
        apiEndpoint: data.apiEndpoint || null,
      })
      .returning()
      .then((rows) => rows[0]);

    return successResponse(newSource as CreateSourceResponse, 201);
  }
);
