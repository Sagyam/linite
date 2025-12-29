import { NextRequest } from 'next/server';
import { db, packages } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

// GET /api/packages/[id] - Get single package (admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const pkg = await db.query.packages.findFirst({
      where: eq(packages.id, id),
      with: {
        app: true,
        source: true,
      },
    });

    if (!pkg) {
      return errorResponse('Package not found', 404);
    }

    return successResponse(pkg);
  } catch (error) {
    console.error('Error fetching package:', error);
    return errorResponse('Failed to fetch package', 500);
  }
}

// PUT /api/packages/[id] - Update package (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { identifier, version, size, maintainer, isAvailable, metadata } = body;

    const [updated] = await db.update(packages)
      .set({
        ...(identifier && { identifier }),
        ...(version !== undefined && { version }),
        ...(size !== undefined && { size }),
        ...(maintainer !== undefined && { maintainer }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(metadata !== undefined && { metadata }),
        updatedAt: new Date(),
      })
      .where(eq(packages.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Package not found', 404);
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating package:', error);
    return errorResponse('Failed to update package', 500);
  }
}

// DELETE /api/packages/[id] - Delete package (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;

    await db.delete(packages).where(eq(packages.id, id));

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    return errorResponse('Failed to delete package', 500);
  }
}
