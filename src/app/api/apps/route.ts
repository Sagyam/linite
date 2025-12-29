import { NextRequest } from 'next/server';
import { db, apps } from '@/db';
import { requireAuth, errorResponse, successResponse, applyRateLimit } from '@/lib/api-utils';
import { desc, eq, like, and } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';

// GET /api/apps - Get all apps with optional filtering (public)
export async function GET(request: NextRequest) {
  // Apply rate limiting for public endpoints
  const rateLimitResult = await applyRateLimit(request, publicApiLimiter);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const popular = searchParams.get('popular');
    const search = searchParams.get('search');

    let query = db.query.apps.findMany({
      with: {
        category: true,
        packages: {
          with: {
            source: true,
          },
        },
      },
      orderBy: [desc(apps.isPopular), desc(apps.displayName)],
    });

    // Note: Drizzle doesn't support dynamic where clauses in findMany easily,
    // so we'll fetch all and filter in memory for now
    let allApps = await query;

    // Apply filters
    if (category) {
      allApps = allApps.filter(app => app.category.slug === category);
    }

    if (popular === 'true') {
      allApps = allApps.filter(app => app.isPopular);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      allApps = allApps.filter(app =>
        app.displayName.toLowerCase().includes(searchLower) ||
        app.description?.toLowerCase().includes(searchLower)
      );
    }

    return successResponse(allApps);
  } catch (error) {
    console.error('Error fetching apps:', error);
    return errorResponse('Failed to fetch apps', 500);
  }
}

// POST /api/apps - Create new app (admin)
export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const body = await request.json();
    const { slug, displayName, description, iconUrl, homepage, isPopular, isFoss, categoryId } = body;

    if (!slug || !displayName || !categoryId) {
      return errorResponse('Slug, display name, and category are required');
    }

    const [newApp] = await db.insert(apps).values({
      slug,
      displayName,
      description,
      iconUrl,
      homepage,
      isPopular: isPopular || false,
      isFoss: isFoss !== undefined ? isFoss : true,
      categoryId,
    }).returning();

    return successResponse(newApp, 201);
  } catch (error: any) {
    console.error('Error creating app:', error);
    if (error.message?.includes('UNIQUE')) {
      return errorResponse('App with this slug already exists', 409);
    }
    return errorResponse('Failed to create app', 500);
  }
}
