import { NextRequest } from 'next/server';
import { db, sources } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

// GET /api/sources/[id] - Get single source (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const source = await db.query.sources.findFirst({
      where: eq(sources.id, id),
      with: {
        packages: true,
      },
    });

    if (!source) {
      return errorResponse('Source not found', 404);
    }

    return successResponse(source);
  } catch (error) {
    console.error('Error fetching source:', error);
    return errorResponse('Failed to fetch source', 500);
  }
}

// PUT /api/sources/[id] - Update source (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, installCmd, requireSudo, setupCmd, priority, apiEndpoint } = body;

    const [updated] = await db.update(sources)
      .set({
        ...(name && { name }),
        ...(slug && { slug }),
        ...(installCmd && { installCmd }),
        ...(requireSudo !== undefined && { requireSudo }),
        ...(setupCmd !== undefined && { setupCmd }),
        ...(priority !== undefined && { priority }),
        ...(apiEndpoint !== undefined && { apiEndpoint }),
        updatedAt: new Date(),
      })
      .where(eq(sources.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Source not found', 404);
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating source:', error);
    if (error instanceof Error && error.message?.includes('UNIQUE')) {
      return errorResponse('Source with this slug already exists', 409);
    }
    return errorResponse('Failed to update source', 500);
  }
}

// DELETE /api/sources/[id] - Delete source (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;

    // Check if source has packages
    const source = await db.query.sources.findFirst({
      where: eq(sources.id, id),
      with: {
        packages: true,
      },
    });

    if (!source) {
      return errorResponse('Source not found', 404);
    }

    if (source.packages.length > 0) {
      return errorResponse('Cannot delete source with packages. Delete packages first.', 400);
    }

    await db.delete(sources).where(eq(sources.id, id));

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error deleting source:', error);
    return errorResponse('Failed to delete source', 500);
  }
}
