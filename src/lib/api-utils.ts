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

/**
 * Combines rate limiting and error handling
 * @param handler - The route handler function
 * @param limiter - Optional rate limiter
 * @returns Wrapped handler with rate limiting and error handling
 */
export function withRateLimitAndErrorHandling<T = unknown>(
  handler: (request: NextRequest, context?: T) => Promise<NextResponse>,
  limiter: Ratelimit | null = null
) {
  return withErrorHandling(async (request: NextRequest, context?: T) => {
    // Apply rate limiting first
    if (limiter) {
      const rateLimitResult = await applyRateLimit(request, limiter);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }

    return await handler(request, context);
  });
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
