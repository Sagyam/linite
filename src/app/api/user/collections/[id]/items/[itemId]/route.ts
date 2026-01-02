import { NextRequest } from 'next/server';
import { createAuthApiHandler } from '@/lib/api-middleware';
import { requireUser, requireCollectionOwnership, successResponse } from '@/lib/api-utils';
import * as collectionService from '@/services/collection.service';

interface RouteContext {
  params: Promise<{ id: string; itemId: string }>;
}

/**
 * DELETE /api/user/collections/[id]/items/[itemId]
 * Remove an app from the collection
 */
export const DELETE = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id, itemId } = await context.params;

    // Verify ownership
    await requireCollectionOwnership(id, user.id);

    await collectionService.removeItemFromCollection(itemId);

    // Return updated collection
    const updated = await collectionService.getCollectionById(id, user.id);

    return successResponse(updated);
  }
);
