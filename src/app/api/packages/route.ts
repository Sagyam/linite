import { NextRequest } from 'next/server';
import { db, packages } from '@/db';
import { successResponse } from '@/lib/api-utils';
import { eq, and } from 'drizzle-orm';
import { createAuthApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { createPackageSchema, getPackagesQuerySchema } from '@/lib/validation';
import type { GetPackagesResponse, CreatePackageResponse } from '@/types';

// GET /api/packages - Get all packages (admin)
export const GET = createAuthApiHandler(
  async (request: NextRequest) => {
    // Validate and parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryObject = Object.fromEntries(searchParams.entries());
    const validatedQuery = getPackagesQuerySchema.parse(queryObject);

    const { appId, sourceId, available, limit = 100, offset = 0 } = validatedQuery;

    // Build WHERE conditions dynamically
    const conditions = [];

    if (appId) {
      conditions.push(eq(packages.appId, appId));
    }

    if (sourceId) {
      conditions.push(eq(packages.sourceId, sourceId));
    }

    if (available !== undefined) {
      conditions.push(eq(packages.isAvailable, available));
    }

    const allPackages = await db.query.packages.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        app: true,
        source: true,
      },
      limit,
      offset,
    });

    return successResponse<GetPackagesResponse>(allPackages as GetPackagesResponse);
  }
);

// POST /api/packages - Create new package (admin)
export const POST = createAuthValidatedApiHandler(
  createPackageSchema,
  async (_request, data) => {
    const newPackage = await db
      .insert(packages)
      .values({
        appId: data.appId,
        sourceId: data.sourceId,
        identifier: data.identifier,
        version: data.version || null,
        size: data.size || null,
        maintainer: data.maintainer || null,
        isAvailable: data.isAvailable ?? true,
        metadata: data.metadata || null,
      })
      .returning()
      .then((rows) => rows[0]);

    return successResponse<CreatePackageResponse>(newPackage as CreatePackageResponse, 201);
  }
);
