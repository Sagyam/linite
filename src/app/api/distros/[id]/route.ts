import { NextRequest } from 'next/server';
import { db, distros } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

// GET /api/distros/[id] - Get single distro (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const distro = await db.query.distros.findFirst({
      where: eq(distros.id, id),
      with: {
        distroSources: {
          with: {
            source: true,
          },
        },
      },
    });

    if (!distro) {
      return errorResponse('Distro not found', 404);
    }

    return successResponse(distro);
  } catch (error) {
    console.error('Error fetching distro:', error);
    return errorResponse('Failed to fetch distro', 500);
  }
}

// PUT /api/distros/[id] - Update distro (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, family, iconUrl, basedOn, isPopular } = body;

    const [updated] = await db.update(distros)
      .set({
        ...(name && { name }),
        ...(slug && { slug }),
        ...(family && { family }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(basedOn !== undefined && { basedOn }),
        ...(isPopular !== undefined && { isPopular }),
        updatedAt: new Date(),
      })
      .where(eq(distros.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Distro not found', 404);
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating distro:', error);
    if (error instanceof Error && error.message?.includes('UNIQUE')) {
      return errorResponse('Distro with this slug already exists', 409);
    }
    return errorResponse('Failed to update distro', 500);
  }
}

// DELETE /api/distros/[id] - Delete distro (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;

    await db.delete(distros).where(eq(distros.id, id));

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error deleting distro:', error);
    return errorResponse('Failed to delete distro', 500);
  }
}
