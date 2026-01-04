import { NextRequest } from 'next/server';
import { db, apps, categories } from '@/db';
import { successResponse } from '@/lib/api-utils';
import { desc, eq, and, or, like, sql } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';
import { createPublicApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { getAppsQuerySchema, createAppSchema } from '@/lib/validation';
import type { GetAppsResponse, CreateAppResponse } from '@/types';

// GET /api/apps - Get all apps with optional filtering (public)
export const GET = createPublicApiHandler(
  async (request: NextRequest) => {
    // Validate and parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryObject = Object.fromEntries(searchParams.entries());
    const validatedQuery = getAppsQuerySchema.parse(queryObject);

    const { category, popular, search, limit = 20, offset = 0 } = validatedQuery;

    // Build WHERE conditions dynamically
    const conditions = [];

    // Category filter - support both slug and ID
    if (category) {
      const categoryRecord = await db.query.categories.findFirst({
        where: or(eq(categories.slug, category), eq(categories.id, category)),
      });
      if (categoryRecord) {
        conditions.push(eq(apps.categoryId, categoryRecord.id));
      }
    }

    // Popular filter
    if (popular) {
      conditions.push(eq(apps.isPopular, true));
    }

    // Search filter - search in display name and description
    if (search) {
      conditions.push(
        or(
          like(apps.displayName, `%${search}%`),
          like(sql`COALESCE(${apps.description}, '')`, `%${search}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(apps)
      .where(whereClause);

    const total = Number(totalCountResult.count);

    // Execute query with database-level filtering
    const allApps = await db.query.apps.findMany({
      where: whereClause,
      with: {
        category: true,
        packages: {
          with: {
            source: true,
          },
        },
      },
      orderBy: [desc(apps.isPopular), desc(apps.displayName)],
      limit: limit + 1, // Fetch one extra to determine if there are more
      offset,
    });

    // Check if there are more results
    const hasMore = allApps.length > limit;
    const apps_data = hasMore ? allApps.slice(0, limit) : allApps;

    return successResponse({
      apps: apps_data,
      pagination: {
        total,
        limit,
        offset,
        hasMore,
      },
    });
  },
  publicApiLimiter
);

// POST /api/apps - Create new app (admin)
export const POST = createAuthValidatedApiHandler(
  createAppSchema,
  async (_request, data) => {
    const newApp = await db
      .insert(apps)
      .values({
        slug: data.slug,
        displayName: data.displayName,
        description: data.description || null,
        iconUrl: data.iconUrl || null,
        homepage: data.homepage || null,
        isPopular: data.isPopular,
        isFoss: data.isFoss,
        categoryId: data.categoryId,
      })
      .returning()
      .then((rows) => rows[0]);

    return successResponse(newApp, 201);
  }
);
