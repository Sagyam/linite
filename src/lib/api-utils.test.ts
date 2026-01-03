import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  requireCollectionOwnership,
  errorResponse,
  successResponse,
  withErrorHandling,
  withRateLimitAndErrorHandling,
  applyRateLimit,
} from './api-utils';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      collections: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { auth } from '@/lib/auth';
import { db } from '@/db';

describe('API Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return user and session when authenticated', async () => {
      const mockSession = {
        session: { id: 'session-1', userId: 'user-1', expiresAt: new Date() },
        user: { id: 'user-1', email: 'test@example.com', name: 'Test User' },
      };

      (auth.api.getSession as Mock).mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost/api/test');
      const result = await requireAuth(request);

      expect(result.error).toBeNull();
      expect(result.session).toEqual(mockSession.session);
      expect(result.user).toEqual(mockSession.user);
    });

    it('should return 401 error when not authenticated', async () => {
      (auth.api.getSession as Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/test');
      const result = await requireAuth(request);

      expect(result.error).toBeDefined();
      expect(result.session).toBeNull();
      expect(result.user).toBeNull();

      // Check error response
      const errorJson = await result.error!.json();
      expect(errorJson).toEqual({ error: 'Unauthorized' });
      expect(result.error!.status).toBe(401);
    });

    it('should pass headers to getSession', async () => {
      (auth.api.getSession as Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost/api/test', {
        headers: { authorization: 'Bearer token123' },
      });

      await requireAuth(request);

      expect(auth.api.getSession).toHaveBeenCalledWith({
        headers: expect.any(Headers),
      });
    });
  });

  describe('errorResponse', () => {
    it('should return error response with default 400 status', () => {
      const response = errorResponse('Something went wrong');

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);
    });

    it('should return error response with custom status', () => {
      const response = errorResponse('Not found', 404);

      expect(response.status).toBe(404);
    });

    it('should return JSON with error message', async () => {
      const response = errorResponse('Validation error', 422);

      const json = await response.json();
      expect(json).toEqual({ error: 'Validation error' });
    });
  });

  describe('successResponse', () => {
    it('should return success response with default 200 status', () => {
      const data = { message: 'Success', id: 123 };
      const response = successResponse(data);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(200);
    });

    it('should return success response with custom status', () => {
      const data = { created: true };
      const response = successResponse(data, 201);

      expect(response.status).toBe(201);
    });

    it('should return JSON with data', async () => {
      const data = { users: ['alice', 'bob'], count: 2 };
      const response = successResponse(data);

      const json = await response.json();
      expect(json).toEqual(data);
    });

    it('should handle null data', async () => {
      const response = successResponse(null);

      const json = await response.json();
      expect(json).toBeNull();
    });

    it('should handle array data', async () => {
      const data = [1, 2, 3, 4, 5];
      const response = successResponse(data);

      const json = await response.json();
      expect(json).toEqual(data);
    });
  });

  describe('withErrorHandling', () => {
    it('should execute handler successfully', async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);
      const json = await response.json();

      expect(handler).toHaveBeenCalledWith(request, undefined);
      expect(json).toEqual({ success: true });
    });

    it('should handle "not found" errors with 404', async () => {
      const handler = vi.fn(async () => {
        throw new Error('Resource not found');
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toBe('Resource not found');
    });

    it('should handle "Unauthorized" errors with 401', async () => {
      const handler = vi.fn(async () => {
        throw new Error('Unauthorized access');
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toBe('Unauthorized');
    });

    it('should handle "UNIQUE" constraint errors with 409', async () => {
      const handler = vi.fn(async () => {
        throw new Error('UNIQUE constraint failed');
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(409);
      const json = await response.json();
      expect(json.error).toBe('UNIQUE constraint failed');
    });

    it('should handle "already exists" errors with 409', async () => {
      const handler = vi.fn(async () => {
        throw new Error('User already exists');
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(409);
    });

    it('should handle generic errors with 500', async () => {
      const handler = vi.fn(async () => {
        throw new Error('Database connection failed');
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Database connection failed');
    });

    it('should handle non-Error throws with generic message', async () => {
      const handler = vi.fn(async () => {
        throw 'String error';
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('An unexpected error occurred');
    });

    it('should pass context to handler', async () => {
      const handler = vi.fn(async (_req, context) => {
        return NextResponse.json({ context });
      });

      const wrappedHandler = withErrorHandling(handler);
      const request = new NextRequest('http://localhost/api/test');
      const context = { params: { id: '123' } };

      await wrappedHandler(request, context);

      expect(handler).toHaveBeenCalledWith(request, context);
    });
  });

  describe('applyRateLimit', () => {
    it('should return null when limiter is not configured', async () => {
      const request = new NextRequest('http://localhost/api/test');
      const result = await applyRateLimit(request, null);

      expect(result).toBeNull();
    });

    it('should allow request when rate limit not exceeded', async () => {
      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: true,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 9,
        }),
      };

      const request = new NextRequest('http://localhost/api/test');
      const result = await applyRateLimit(request, mockLimiter as Mock);

      expect(result).toBeNull();
      expect(mockLimiter.limit).toHaveBeenCalledWith('ip:anonymous');
    });

    it('should return 429 when rate limit exceeded', async () => {
      const resetTime = Date.now() + 60000;
      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: false,
          limit: 10,
          reset: resetTime,
          remaining: 0,
        }),
      };

      const request = new NextRequest('http://localhost/api/test');
      const result = await applyRateLimit(request, mockLimiter as Mock);

      expect(result).not.toBeNull();
      expect(result!.status).toBe(429);

      const json = await result!.json();
      expect(json.error).toBe('Too many requests. Please try again later.');
      expect(json.retryAfter).toBe(new Date(resetTime).toISOString());
    });

    it('should include rate limit headers in response', async () => {
      const resetTime = Date.now() + 60000;
      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: false,
          limit: 10,
          reset: resetTime,
          remaining: 0,
        }),
      };

      const request = new NextRequest('http://localhost/api/test');
      const result = await applyRateLimit(request, mockLimiter as Mock);

      expect(result!.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(result!.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result!.headers.get('X-RateLimit-Reset')).toBe(new Date(resetTime).toISOString());
    });

    it('should use x-forwarded-for header for identifier', async () => {
      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: true,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 9,
        }),
      };

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await applyRateLimit(request, mockLimiter as Mock);

      expect(mockLimiter.limit).toHaveBeenCalledWith('ip:192.168.1.1');
    });

    it('should use x-real-ip header as fallback', async () => {
      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: true,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 9,
        }),
      };

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });

      await applyRateLimit(request, mockLimiter as Mock);

      expect(mockLimiter.limit).toHaveBeenCalledWith('ip:10.0.0.1');
    });

    it('should use "anonymous" when no IP headers present', async () => {
      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: true,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 9,
        }),
      };

      const request = new NextRequest('http://localhost/api/test');

      await applyRateLimit(request, mockLimiter as Mock);

      expect(mockLimiter.limit).toHaveBeenCalledWith('ip:anonymous');
    });

    it('should return null on rate limiting error', async () => {
      const mockLimiter = {
        limit: vi.fn().mockRejectedValueOnce(new Error('Redis connection failed')),
      };

      const request = new NextRequest('http://localhost/api/test');
      const result = await applyRateLimit(request, mockLimiter as Mock);

      expect(result).toBeNull();
    });
  });

  describe('withRateLimitAndErrorHandling', () => {
    it('should execute handler without rate limiting when limiter is null', async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const wrappedHandler = withRateLimitAndErrorHandling(handler, null);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);
      const json = await response.json();

      expect(json).toEqual({ success: true });
      expect(handler).toHaveBeenCalled();
    });

    it('should apply rate limiting before executing handler', async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: true,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 9,
        }),
      };

      const wrappedHandler = withRateLimitAndErrorHandling(handler, mockLimiter as Mock);
      const request = new NextRequest('http://localhost/api/test');

      await wrappedHandler(request);

      expect(mockLimiter.limit).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should return rate limit error without executing handler when limit exceeded', async () => {
      const handler = vi.fn(async () => {
        return NextResponse.json({ success: true });
      });

      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: false,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 0,
        }),
      };

      const wrappedHandler = withRateLimitAndErrorHandling(handler, mockLimiter as Mock);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(429);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors from handler', async () => {
      const handler = vi.fn(async () => {
        throw new Error('Handler error');
      });

      const mockLimiter = {
        limit: vi.fn().mockResolvedValueOnce({
          success: true,
          limit: 10,
          reset: Date.now() + 60000,
          remaining: 9,
        }),
      };

      const wrappedHandler = withRateLimitAndErrorHandling(handler, mockLimiter as Mock);
      const request = new NextRequest('http://localhost/api/test');

      const response = await wrappedHandler(request);

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error).toBe('Handler error');
    });

    it('should pass context to handler', async () => {
      const handler = vi.fn(async (_req, ctx) => {
        return NextResponse.json({ context: ctx });
      });

      const wrappedHandler = withRateLimitAndErrorHandling(handler, null);
      const request = new NextRequest('http://localhost/api/test');
      const context = { params: { id: '456' } };

      await wrappedHandler(request, context);

      expect(handler).toHaveBeenCalledWith(request, context);
    });
  });

  describe('requireCollectionOwnership', () => {
    it('should return collection when user owns it', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'My Collection',
        slug: 'my-collection',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockCollection);

      const result = await requireCollectionOwnership('coll-123', 'user-1');

      expect(result).toEqual(mockCollection);
      expect(db.query.collections.findFirst).toHaveBeenCalled();
    });

    it('should throw error when collection not found', async () => {
      (db.query.collections.findFirst as Mock).mockResolvedValue(null);

      await expect(
        requireCollectionOwnership('non-existent', 'user-1')
      ).rejects.toThrow('Collection not found');
    });

    it('should throw error when user does not own collection', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'Collection',
        slug: 'collection',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockCollection);

      await expect(
        requireCollectionOwnership('coll-123', 'user-2')
      ).rejects.toThrow('Forbidden: You do not own this collection');
    });

    it('should verify collection ownership correctly', async () => {
      const mockCollection = {
        id: 'coll-456',
        userId: 'owner-123',
        name: 'Owner Collection',
        slug: 'owner-collection',
        isPublic: true,
        isFeatured: false,
        isTemplate: false,
        shareToken: 'abc123',
        viewCount: 10,
        installCount: 5,
        tags: ['test'],
        iconUrl: 'https://example.com/icon.png',
        description: 'Test description',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockCollection);

      const result = await requireCollectionOwnership('coll-456', 'owner-123');

      expect(result.userId).toBe('owner-123');
      expect(result.id).toBe('coll-456');
    });
  });
});
