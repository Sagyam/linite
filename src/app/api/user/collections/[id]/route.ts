import { NextRequest } from 'next/server';
import { createAuthValidatedApiHandler, createAuthApiHandler } from '@/lib/api-middleware';
import { requireUser, requireCollectionOwnership, successResponse, errorResponse } from '@/lib/api-utils';
import { updateCollectionSchema } from '@/lib/validation';
import * as collectionService from '@/services/collection.service';
import type { UpdateCollectionInput } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/user/collections/[id]
 * Get single collection owned by user
 */
export const GET = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;
    const collection = await collectionService.getCollectionById(id, user.id);

    if (!collection) {
      return errorResponse('Collection not found', 404);
    }

    // Verify ownership
    if (collection.userId !== user.id) {
      return errorResponse('Forbidden: You do not own this collection', 403);
    }

    return successResponse(collection);
  }
);

/**
 * PUT /api/user/collections/[id]
 * Update collection
 */
export const PUT = createAuthValidatedApiHandler<UpdateCollectionInput, RouteContext>(
  updateCollectionSchema,
  async (request: NextRequest, data: UpdateCollectionInput, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;

    // Verify ownership
    await requireCollectionOwnership(id, user.id);

    const updated = await collectionService.updateCollection(id, data);

    // Fetch full collection
    const fullCollection = await collectionService.getCollectionById(updated.id, user.id);

    return successResponse(fullCollection);
  }
);

/**
 * DELETE /api/user/collections/[id]
 * Delete collection
 */
export const DELETE = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;

    // Verify ownership
    await requireCollectionOwnership(id, user.id);

    await collectionService.deleteCollection(id);

    return successResponse({ message: 'Collection deleted successfully' });
  }
);
