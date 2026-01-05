import { NextRequest } from 'next/server';
import { db, apps, categories } from '@/db';
import { successResponse } from '@/lib/api-utils';
import {asc, eq, and, or, like, sql, desc} from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';
import { createPublicApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { getAppsQuerySchema, createAppSchema } from '@/lib/validation';

// GET /api/apps - Get all apps with optional filtering (public)
export const GET = createPublicApiHandler(
  async (request: NextRequest) => {
    // Validate and parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryObject = Object.fromEntries(searchParams.entries());
    const validatedQuery = getAppsQuerySchema.parse(queryObject);

    const { category, popular, search, limit, offset } = validatedQuery;

    // Determine if pagination is requested (for public API with infinite scroll)
    // If no limit/offset specified, return all results as array (for admin)
    const usePagination = limit !== undefined || offset !== undefined;
    const actualLimit = limit ?? 20;
    const actualOffset = offset ?? 0;

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

    // If not using pagination, return all results as a simple array
    if (!usePagination) {
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
        orderBy: [desc(apps.isPopular), asc(apps.displayName)],
      });

      return successResponse(allApps);
    }

    // Get total count for pagination
    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(apps)
      .where(whereClause);

    const total = Number(totalCountResult.count);

    // Execute a query with database-level filtering
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
      orderBy: [desc(apps.isPopular), asc(apps.displayName)],
      limit: actualLimit + 1, // Fetch one extra to determine if there are more
      offset: actualOffset,
    });

    // Check if there are more results
    const hasMore = allApps.length > actualLimit;
    const appsData = hasMore ? allApps.slice(0, actualLimit) : allApps;

    return successResponse({
      apps: appsData,
      pagination: {
        total,
        limit: actualLimit,
        offset: actualOffset,
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
