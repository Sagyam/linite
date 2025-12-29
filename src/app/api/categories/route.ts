import { NextRequest } from 'next/server';
import { db, categories } from '@/db';
import { requireAuth, errorResponse, successResponse, applyRateLimit } from '@/lib/api-utils';
import { desc } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';

// GET /api/categories - Get all categories (public)
export async function GET(request: NextRequest) {
  // Apply rate limiting for public endpoints
  const rateLimitResult = await applyRateLimit(request, publicApiLimiter);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const allCategories = await db.query.categories.findMany({
      orderBy: [desc(categories.displayOrder), desc(categories.name)],
    });

    return successResponse(allCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse('Failed to fetch categories', 500);
  }
}

// POST /api/categories - Create new category (admin)
export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const body = await request.json();
    const { name, slug, icon, description, displayOrder } = body;

    if (!name || !slug) {
      return errorResponse('Name and slug are required');
    }

    const [newCategory] = await db.insert(categories).values({
      name,
      slug,
      icon,
      description,
      displayOrder: displayOrder || 0,
    }).returning();

    return successResponse(newCategory, 201);
  } catch (error: any) {
    console.error('Error creating category:', error);
    if (error.message?.includes('UNIQUE')) {
      return errorResponse('Category with this slug already exists', 409);
    }
    return errorResponse('Failed to create category', 500);
  }
}
