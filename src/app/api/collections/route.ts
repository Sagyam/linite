import { NextRequest } from 'next/server';
import { createPublicApiHandler } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-utils';
import * as collectionService from '@/services/collection.service';

/**
 * GET /api/collections
 * List public and featured collections
 * Public endpoint with rate limiting
 */
export const GET = createPublicApiHandler(
  async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;

    const featured = searchParams.get('featured') === 'true';
    const search = searchParams.get('search') || undefined;
    const tagsParam = searchParams.get('tags');
    const tags = tagsParam ? tagsParam.split(',') : undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { collections, total } = await collectionService.listCollections({
      isPublic: true,
      featured: featured || undefined,
      search,
      tags,
      limit,
      offset,
    });

    return successResponse({
      collections,
      total,
      limit,
      offset,
    });
  }
);
