import { NextRequest } from 'next/server';
import { db, apps } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

// GET /api/apps/[id] - Get single app (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const app = await db.query.apps.findFirst({
      where: eq(apps.id, id),
      with: {
        category: true,
        packages: {
          with: {
            source: true,
          },
        },
      },
    });

    if (!app) {
      return errorResponse('App not found', 404);
    }

    return successResponse(app);
  } catch (error) {
    console.error('Error fetching app:', error);
    return errorResponse('Failed to fetch app', 500);
  }
}

// PUT /api/apps/[id] - Update app (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { slug, displayName, description, iconUrl, homepage, isPopular, isFoss, categoryId } = body;

    const [updated] = await db.update(apps)
      .set({
        ...(slug && { slug }),
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(iconUrl !== undefined && { iconUrl }),
        ...(homepage !== undefined && { homepage }),
        ...(isPopular !== undefined && { isPopular }),
        ...(isFoss !== undefined && { isFoss }),
        ...(categoryId && { categoryId }),
        updatedAt: new Date(),
      })
      .where(eq(apps.id, id))
      .returning();

    if (!updated) {
      return errorResponse('App not found', 404);
    }

    return successResponse(updated);
  } catch (error: any) {
    console.error('Error updating app:', error);
    if (error.message?.includes('UNIQUE')) {
      return errorResponse('App with this slug already exists', 409);
    }
    return errorResponse('Failed to update app', 500);
  }
}

// DELETE /api/apps/[id] - Delete app (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;

    // Packages will be cascade deleted due to onDelete: 'cascade' in schema
    await db.delete(apps).where(eq(apps.id, id));

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error deleting app:', error);
    return errorResponse('Failed to delete app', 500);
  }
}
