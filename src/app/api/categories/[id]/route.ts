import { db, categories } from '@/db';
import { errorResponse, successResponse } from '@/lib/api-utils';
import { eq } from 'drizzle-orm';
import { createPublicApiHandler, createAuthValidatedApiHandler, createAuthApiHandler } from '@/lib/api-middleware';
import { updateCategorySchema } from '@/lib/validation';
import type { UpdateCategoryInput } from '@/lib/validation';
import type { Category, UpdateCategoryResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/categories/[id] - Get single category (public)
export const GET = createPublicApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

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
  }
);

// PUT /api/categories/[id] - Update category (admin)
export const PUT = createAuthValidatedApiHandler<UpdateCategoryInput, RouteContext>(
  updateCategorySchema,
  async (_request, data, context) => {
    const { id } = await context!.params;

    // Verify ID matches
    if (data.id !== id) {
      return errorResponse('ID in body must match ID in URL', 400);
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.icon !== undefined && { icon: data.icon || null }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    if (!updated) {
      return errorResponse('Category not found', 404);
    }

    return successResponse<UpdateCategoryResponse>(updated);
  }
);

// DELETE /api/categories/[id] - Delete category (admin)
export const DELETE = createAuthApiHandler<RouteContext>(
  async (_request, context) => {
    const { id } = await context!.params;

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

    const result = await db.delete(categories).where(eq(categories.id, id)).returning();

    if (result.length === 0) {
      return errorResponse('Category not found', 404);
    }

    return successResponse({ success: true });
  }
);
