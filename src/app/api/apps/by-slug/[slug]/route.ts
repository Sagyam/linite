import { NextRequest } from 'next/server';
import { db } from '@/db';
import { apps } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { errorResponse, successResponse } from '@/lib/api-utils';

// GET /api/apps/by-slug/[slug] - Get app by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const app = await db.query.apps.findFirst({
      where: eq(apps.slug, slug),
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
    console.error('Error fetching app by slug:', error);
    return errorResponse('Failed to fetch app', 500);
  }
}
