import { NextRequest } from 'next/server';
import { db, sources } from '@/db';
import { requireAuth, errorResponse, successResponse, applyRateLimit } from '@/lib/api-utils';
import { desc } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';

// GET /api/sources - Get all sources (public)
export async function GET(request: NextRequest) {
  // Apply rate limiting for public endpoints
  const rateLimitResult = await applyRateLimit(request, publicApiLimiter);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const allSources = await db.query.sources.findMany({
      orderBy: [desc(sources.priority), desc(sources.name)],
    });

    return successResponse(allSources);
  } catch (error) {
    console.error('Error fetching sources:', error);
    return errorResponse('Failed to fetch sources', 500);
  }
}

// POST /api/sources - Create new source (admin)
export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const body = await request.json();
    const { name, slug, installCmd, requireSudo, setupCmd, priority, apiEndpoint } = body;

    if (!name || !slug || !installCmd) {
      return errorResponse('Name, slug, and install command are required');
    }

    const [newSource] = await db.insert(sources).values({
      name,
      slug,
      installCmd,
      requireSudo: requireSudo || false,
      setupCmd,
      priority: priority || 0,
      apiEndpoint,
    }).returning();

    return successResponse(newSource, 201);
  } catch (error: any) {
    console.error('Error creating source:', error);
    if (error.message?.includes('UNIQUE')) {
      return errorResponse('Source with this slug already exists', 409);
    }
    return errorResponse('Failed to create source', 500);
  }
}
