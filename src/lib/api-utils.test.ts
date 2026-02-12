import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  requireCollectionOwnership,
  errorResponse,
  successResponse,
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
  // Suppress console.error for tests that intentionally throw errors
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

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
