import { NextRequest } from 'next/server';
import { createAuthValidatedApiHandler } from '@/lib/api-middleware';
import { requireUser, requireCollectionOwnership, successResponse } from '@/lib/api-utils';
import { addCollectionItemSchema } from '@/lib/validation';
import * as collectionService from '@/services/collection.service';
import type { AddCollectionItemInput } from '@/lib/validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/user/collections/[id]/items
 * Add an app to the collection
 */
export const POST = createAuthValidatedApiHandler<AddCollectionItemInput, RouteContext>(
  addCollectionItemSchema,
  async (request: NextRequest, data: AddCollectionItemInput, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;

    // Verify ownership
    await requireCollectionOwnership(id, user.id);

    await collectionService.addItemToCollection(id, data.appId, data.note);

    // Return updated collection
    const updated = await collectionService.getCollectionById(id, user.id);

    return successResponse(updated, 201);
  }
);
