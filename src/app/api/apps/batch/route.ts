import { NextRequest } from 'next/server';
import { db, apps } from '@/db';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { inArray } from 'drizzle-orm';
import { createPublicApiHandler } from '@/lib/api-middleware';
import { z } from 'zod';

// Validation schema for batch request
const batchQuerySchema = z.object({
  ids: z.string().min(1, 'At least one ID is required'),
});

/**
 * GET /api/apps/batch - Get multiple apps by IDs (public)
 * Query params: ids (comma-separated list of app IDs)
 */
export const GET = createPublicApiHandler(
  async (request: NextRequest) => {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return errorResponse('Missing required parameter: ids', 400);
    }

    const validatedQuery = batchQuerySchema.parse({ ids: idsParam });

    // Split comma-separated IDs and filter out empty strings
    const appIds = validatedQuery.ids
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (appIds.length === 0) {
      return errorResponse('No valid IDs provided', 400);
    }

    // Limit to prevent abuse (max 100 apps at once)
    if (appIds.length > 100) {
      return errorResponse('Maximum 100 IDs allowed per request', 400);
    }

    // Fetch apps with their relations
    const appsData = await db.query.apps.findMany({
      where: inArray(apps.id, appIds),
      with: {
        category: true,
        packages: {
          with: {
            source: true,
          },
        },
      },
    });

    return successResponse(appsData);
  }
);
