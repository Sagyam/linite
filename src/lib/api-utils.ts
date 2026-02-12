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

