import { db, categories } from '@/db';
import { successResponse } from '@/lib/api-utils';
import { asc } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';
import { createPublicApiHandler, createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { createCategorySchema } from '@/lib/validation';
import type { GetCategoriesResponse, CreateCategoryResponse } from '@/types';

// GET /api/categories - Get all categories (public)
export const GET = createPublicApiHandler(
  async () => {
    const allCategories = await db.query.categories.findMany({
      orderBy: [asc(categories.displayOrder), asc(categories.name)],
    });

    return successResponse<GetCategoriesResponse>(allCategories);
  },
  publicApiLimiter
);

// POST /api/categories - Create new category (admin)
export const POST = createAuthValidatedApiHandler(
  createCategorySchema,
  async (_request, data) => {
    const newCategory = await db
      .insert(categories)
      .values({
        name: data.name,
        slug: data.slug,
        icon: data.icon || null,
        description: data.description || null,
        displayOrder: data.displayOrder,
      })
      .returning()
      .then((rows) => rows[0]);

    return successResponse<CreateCategoryResponse>(newCategory, 201);
  }
);
