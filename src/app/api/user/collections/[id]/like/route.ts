import { NextRequest } from 'next/server';
import { createAuthApiHandler } from '@/lib/api-middleware';
import { requireUser, successResponse } from '@/lib/api-utils';
import * as collectionService from '@/services/collection.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/user/collections/[id]/like
 * Toggle like on a collection (like/unlike)
 */
export const POST = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;

    // Verify collection exists (will throw if not public and not owned)
    const collection = await collectionService.getCollectionById(id, user.id);
    if (!collection) {
      throw new Error('Collection not found');
    }

    const result = await collectionService.toggleLike(id, user.id);

    return successResponse(result);
  }
);
