import { NextRequest } from 'next/server';
import { createAuthApiHandler } from '@/lib/api-middleware';
import { requireUser, requireCollectionOwnership, successResponse } from '@/lib/api-utils';
import * as collectionService from '@/services/collection.service';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/user/collections/[id]/share
 * Generate or regenerate share token for collection
 */
export const POST = createAuthApiHandler(
  async (request: NextRequest, context?: RouteContext) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    if (!context) throw new Error('Missing route context');
    const { id } = await context.params;

    // Verify ownership
    await requireCollectionOwnership(id, user.id);

    const shareToken = await collectionService.generateShareToken(id);
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/collections/share/${shareToken}`;

    return successResponse({
      shareToken,
      shareUrl,
    });
  }
);
