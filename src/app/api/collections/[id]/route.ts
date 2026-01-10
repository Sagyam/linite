import { NextRequest } from 'next/server';
import { createPublicApiHandler } from '@/lib/api-middleware';
import { successResponse, errorResponse } from '@/lib/api-utils';
import * as collectionService from '@/services/collection.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/collections/[id]
 * Get single public collection by ID
 * Public endpoint with rate limiting
 */
export const GET = createPublicApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;

    const collection = await collectionService.getCollectionById(id);

    if (!collection) {
      return errorResponse('Collection not found', 404);
    }

    // Increment view count
    await collectionService.incrementViewCount(id);

    return successResponse(collection);
  }
);
