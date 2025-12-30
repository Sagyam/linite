import { NextRequest } from 'next/server';
import { db, distroSources } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/distro-sources - Get all distro-source mappings (public)
export async function GET() {
  try {
    const mappings = await db.query.distroSources.findMany({
      with: {
        distro: true,
        source: true,
      },
    });

    return successResponse(mappings);
  } catch (error) {
    console.error('Error fetching distro-sources:', error);
    return errorResponse('Failed to fetch distro-sources', 500);
  }
}

// POST /api/distro-sources - Create new mapping (admin)
export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const body = await request.json();
    const { distroId, sourceId, priority, isDefault } = body;

    if (!distroId || !sourceId) {
      return errorResponse('Distro ID and source ID are required');
    }

    const [newMapping] = await db.insert(distroSources).values({
      distroId,
      sourceId,
      priority: priority || 0,
      isDefault: isDefault || false,
    }).returning();

    return successResponse(newMapping, 201);
  } catch (error) {
    console.error('Error creating distro-source mapping:', error);
    if (error instanceof Error && error.message?.includes('UNIQUE')) {
      return errorResponse('Distro source mapping already exists', 409);
    }
    return errorResponse('Failed to create distro-source mapping', 500);
  }
}
