import { NextRequest } from 'next/server';
import { db, packages } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/packages - Get all packages (admin)
export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const searchParams = request.nextUrl.searchParams;
    const sourceId = searchParams.get('sourceId');
    const available = searchParams.get('available');

    let allPackages = await db.query.packages.findMany({
      with: {
        app: true,
        source: true,
      },
    });

    if (sourceId) {
      allPackages = allPackages.filter(pkg => pkg.sourceId === sourceId);
    }

    if (available !== null) {
      const isAvailable = available === 'true';
      allPackages = allPackages.filter(pkg => pkg.isAvailable === isAvailable);
    }

    return successResponse(allPackages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    return errorResponse('Failed to fetch packages', 500);
  }
}

// POST /api/packages - Create new package (admin)
export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const body = await request.json();
    const { appId, sourceId, identifier, version, size, maintainer, isAvailable, metadata } = body;

    if (!appId || !sourceId || !identifier) {
      return errorResponse('App ID, source ID, and identifier are required');
    }

    const [newPackage] = await db.insert(packages).values({
      appId,
      sourceId,
      identifier,
      version,
      size,
      maintainer,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      metadata,
    }).returning();

    return successResponse(newPackage, 201);
  } catch (error) {
    console.error('Error creating package:', error);
    if (error instanceof Error && error.message?.includes('UNIQUE')) {
      return errorResponse('Package with this identifier already exists for this app and source', 409);
    }
    return errorResponse('Failed to create package', 500);
  }
}
