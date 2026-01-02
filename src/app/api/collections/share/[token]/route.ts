import { NextRequest } from 'next/server';
import { createPublicApiHandler } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';
import { publicApiLimiter } from '@/lib/redis';
import * as collectionService from '@/services/collection.service';

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/collections/share/[token]
 * Get collection via share token (works for private collections)
 * Public endpoint with rate limiting
 */
export const GET = createPublicApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    if (!context) throw new Error('Missing route context');
    const { token } = await context.params;

    const collection = await collectionService.getCollectionByShareToken(token);

    if (!collection) {
      return errorResponse('Collection not found or share link is invalid', 404);
    }

    return successResponse(collection);
  },
  publicApiLimiter
);
