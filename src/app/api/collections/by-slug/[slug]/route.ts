import { NextRequest } from 'next/server';
import { createPublicApiHandler } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { publicApiLimiter } from '@/lib/redis';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import * as collectionService from '@/services/collection.service';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/collections/by-slug/[slug]
 * Get single collection by slug (public or owner's private)
 * Public endpoint with rate limiting
 */
export const GET = createPublicApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    if (!context) throw new Error('Missing route context');
    const { slug } = await context.params;

    // Try to get current user (optional - endpoint is public)
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const collection = await collectionService.getCollectionBySlug(slug, userId);

    if (!collection) {
      return errorResponse('Collection not found', 404);
    }

    // Increment view count
    await collectionService.incrementViewCount(collection.id);

    return successResponse(collection);
  },
  publicApiLimiter
);
