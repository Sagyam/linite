import { NextRequest } from 'next/server';
import { createAuthApiHandler } from '@/lib/api-middleware';
import { requireUser, successResponse } from '@/lib/api-utils';
import * as collectionService from '@/services/collection.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/user/collections/[id]/clone
 * Clone a collection to current user's account
 */
export const POST = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;

    // Verify collection exists and is accessible
    const original = await collectionService.getCollectionById(id, user.id);
    if (!original) {
      throw new Error('Collection not found or not accessible');
    }

    // Don't allow cloning your own collection
    if (original.userId === user.id) {
      throw new Error('Cannot clone your own collection');
    }

    const cloned = await collectionService.cloneCollection(id, user.id);

    // Fetch full collection
    const fullCollection = await collectionService.getCollectionById(cloned.id, user.id);

    return successResponse(fullCollection, 201);
  }
);
