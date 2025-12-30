import { NextRequest } from 'next/server';
import { db, categories } from '@/db';
import { requireAuth, errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';

// GET /api/categories/[id] - Get single category (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        apps: true,
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return errorResponse('Failed to fetch category', 500);
  }
}

// PUT /api/categories/[id] - Update category (admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, icon, description, displayOrder } = body;

    const [updated] = await db.update(categories)
      .set({
        ...(name && { name }),
        ...(slug && { slug }),
        ...(icon !== undefined && { icon }),
        ...(description !== undefined && { description }),
        ...(displayOrder !== undefined && { displayOrder }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    if (error instanceof Error && error.message?.includes('UNIQUE')) {
      return errorResponse('Category with this slug already exists', 409);
    }
    return errorResponse('Failed to update category', 500);
  }
}

// DELETE /api/categories/[id] - Delete category (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const { id } = await params;

    // Check if category has apps
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        apps: true,
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    if (category.apps.length > 0) {
      return errorResponse('Cannot delete category with apps. Move or delete apps first.', 400);
    }

    await db.delete(categories).where(eq(categories.id, id));

    return successResponse({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return errorResponse('Failed to delete category', 500);
  }
}
