import { NextRequest } from 'next/server';
import { db, distroSources } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

// GET /api/distro-sources/[id] - Get single mapping (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mapping = await db.query.distroSources.findFirst({
      where: eq(distroSources.id, id),
      with: {
        distro: true,
        source: true,
      },
    });

    if (!mapping) {
      return errorResponse('Distro-source mapping not found', 404);
    }

    return successResponse(mapping);
  } catch (error) {
    console.error('Error fetching distro-source mapping:', error);
    return errorResponse('Failed to fetch distro-source mapping', 500);
  }
}

// PUT /api/distro-sources/[id] - Update mapping (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { priority, isDefault } = body;

    const [updated] = await db.update(distroSources)
      .set({
        ...(priority !== undefined && { priority }),
        ...(isDefault !== undefined && { isDefault }),
      })
      .where(eq(distroSources.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Distro-source mapping not found', 404);
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating distro-source mapping:', error);
    return errorResponse('Failed to update distro-source mapping', 500);
  }
}

// DELETE /api/distro-sources/[id] - Delete mapping (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;

    await db.delete(distroSources).where(eq(distroSources.id, id));

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error deleting distro-source mapping:', error);
    return errorResponse('Failed to delete distro-source mapping', 500);
  }
}
