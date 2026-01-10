import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function requireAuth(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      session: null,
      user: null,
    };
  }

  return {
    error: null,
    session: session.session,
    user: session.user,
  };
}

/**
 * Require any authenticated user (user, admin, or superadmin)
 */
export async function requireUser(request: NextRequest) {
  const result = await requireAuth(request);
  if (result.error) {
    return result;
  }

  return {
    error: null,
    user: result.user!,
  };
}

/**
 * Require admin or superadmin role
 */
export async function requireAdmin(request: NextRequest) {
  const result = await requireAuth(request);
  if (result.error) {
    return result;
  }

  const user = result.user!;
  if (user.role !== 'admin' && user.role !== 'superadmin') {
    return {
      error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
      user: null,
    };
  }

  return {
    error: null,
    user,
  };
}

/**
 * Check if user owns a collection
 */
export async function requireCollectionOwnership(collectionId: string, userId: string) {
  const collection = await db.query.collections.findFirst({
    where: eq(schema.collections.id, collectionId),
  });

  if (!collection) {
    throw new Error('Collection not found');
  }

  if (collection.userId !== userId) {
    throw new Error('Forbidden: You do not own this collection');
  }

  return collection;
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Higher-order function that wraps API route handlers with automatic error handling
 * @param handler - The route handler function
 * @returns Wrapped handler with error handling
 */
export function withErrorHandling<T = unknown>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: T): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle known error types
      if (error instanceof Error) {
        // Check for specific error messages
        if (error.message.includes('not found')) {
          return errorResponse(error.message, 404);
        }
        if (error.message.includes('Unauthorized') || error.message.includes('unauthorized')) {
          return errorResponse('Unauthorized', 401);
        }
        if (error.message.includes('UNIQUE') || error.message.includes('already exists')) {
          return errorResponse(error.message, 409);
        }

        return errorResponse(error.message, 500);
      }

      return errorResponse('An unexpected error occurred', 500);
    }
  };
}

