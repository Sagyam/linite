import { NextRequest } from 'next/server';
import { createAuthValidatedApiHandler, createAuthApiHandler } from '@/lib/api-middleware';
import { requireUser, successResponse } from '@/lib/api-utils';
import { createCollectionSchema } from '@/lib/validation';
import * as collectionService from '@/services/collection.service';
import type { CreateCollectionInput } from '@/lib/validation';

/**
 * GET /api/user/collections
 * List current user's collections
 */
export const GET = createAuthApiHandler(async (request: NextRequest) => {
  const { user } = await requireUser(request);
  if (!user) {
    throw new Error('Unauthorized');
  }

  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search') || undefined;

  const { collections, total } = await collectionService.listCollections({
    userId: user.id,
    limit,
    offset,
    search,
  });

  return successResponse({
    collections,
    total,
    limit,
    offset,
  });
});

/**
 * POST /api/user/collections
 * Create a new collection
 */
export const POST = createAuthValidatedApiHandler<CreateCollectionInput>(
  createCollectionSchema,
  async (request: NextRequest, data: CreateCollectionInput) => {
    const { user } = await requireUser(request);
    if (!user) {
      throw new Error('Unauthorized');
    }

    const collection = await collectionService.createCollection({
      userId: user.id,
      ...data,
    });

    // Fetch full collection with relations
    const fullCollection = await collectionService.getCollectionById(collection.id, user.id);

    return successResponse(fullCollection, 201);
  }
);
