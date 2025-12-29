import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { Ratelimit } from '@upstash/ratelimit';

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

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Apply rate limiting to an API endpoint
 * @param request - The incoming request
 * @param limiter - The rate limiter to use
 * @returns null if rate limit not exceeded, error response otherwise
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: Ratelimit | null
): Promise<NextResponse | null> {
  // Skip rate limiting if limiter is not configured
  if (!limiter) {
    return null;
  }

  // Get identifier (IP address or user ID)
  const ip = request.headers.get('x-forwarded-for') ??
             request.headers.get('x-real-ip') ??
             'anonymous';

  const identifier = `ip:${ip}`;

  try {
    const { success, limit, reset, remaining } = await limiter.limit(identifier);

    // Add rate limit headers
    const headers = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': new Date(reset).toISOString(),
    };

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    // Rate limit passed - headers will be added by the caller if needed
    return null;
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If rate limiting fails, allow the request to proceed
    return null;
  }
}
