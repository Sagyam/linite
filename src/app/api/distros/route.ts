import { NextRequest } from 'next/server';
import { db, distros } from '@/db';
import { requireAuth, errorResponse, successResponse, applyRateLimit } from '@/lib/api-utils';
import { desc } from 'drizzle-orm';
import { publicApiLimiter } from '@/lib/redis';

// GET /api/distros - Get all distros (public)
export async function GET(request: NextRequest) {
  // Apply rate limiting for public endpoints
  const rateLimitResult = await applyRateLimit(request, publicApiLimiter);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const allDistros = await db.query.distros.findMany({
      orderBy: [desc(distros.isPopular), desc(distros.name)],
      with: {
        distroSources: {
          with: {
            source: true,
          },
          orderBy: (ds, { desc }) => [desc(ds.priority)],
        },
      },
    });

    return successResponse(allDistros);
  } catch (error) {
    console.error('Error fetching distros:', error);
    return errorResponse('Failed to fetch distros', 500);
  }
}

// POST /api/distros - Create new distro (admin)
export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request);
  if (authCheck.error) return authCheck.error;

  try {
    const body = await request.json();
    const { name, slug, family, iconUrl, basedOn, isPopular } = body;

    if (!name || !slug || !family) {
      return errorResponse('Name, slug, and family are required');
    }

    const [newDistro] = await db.insert(distros).values({
      name,
      slug,
      family,
      iconUrl,
      basedOn,
      isPopular: isPopular || false,
    }).returning();

    return successResponse(newDistro, 201);
  } catch (error: any) {
    console.error('Error creating distro:', error);
    if (error.message?.includes('UNIQUE')) {
      return errorResponse('Distro with this slug already exists', 409);
    }
    return errorResponse('Failed to create distro', 500);
  }
}
