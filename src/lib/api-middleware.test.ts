import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Mock dependencies BEFORE imports
vi.mock('./api-utils');
vi.mock('./validation/middleware');
vi.mock('@/db', () => ({
  db: {},
}));
vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import {
  createApiHandler,
  createPublicApiHandler,
  createAuthApiHandler,
  createValidatedApiHandler,
  createAuthValidatedApiHandler,
  createQueryValidatedApiHandler,
} from './api-middleware';
import * as apiUtils from './api-utils';
import * as validationMiddleware from './validation/middleware';

describe('api-middleware', () => {
  // Suppress console.error for tests that intentionally throw errors
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  // Mock functions
  const mockRequireAuth = vi.mocked(apiUtils.requireAuth);
  const mockErrorResponse = vi.mocked(apiUtils.errorResponse);
  const mockValidateBody = vi.mocked(validationMiddleware.validateBody);
  const mockValidateQuery = vi.mocked(validationMiddleware.validateQuery);

  // Test utilities
  const createMockRequest = (options: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}): NextRequest => {
    const url = options.url || 'http://localhost:3000/api/test';
    const method = options.method || 'GET';
    const headers = new Headers(options.headers || {});

    return new NextRequest(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  const createSuccessResponse = (data: unknown = { success: true }) =>
    NextResponse.json(data, { status: 200 });

  const createErrorResponse = (message: string, status: number = 400) =>
    NextResponse.json({ error: message }, { status });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockRequireAuth.mockResolvedValue({
      error: null,
      session: { id: 'session-1' },
      user: { id: 'user-1', role: 'admin' },
    } as any);
    mockErrorResponse.mockImplementation((message, status) =>
      createErrorResponse(message, status)
    );
    mockValidateBody.mockResolvedValue({
      success: true,
      data: { test: 'data' },
    } as any);
    mockValidateQuery.mockReturnValue({
      success: true,
      data: { query: 'param' },
    } as any);
  });

  describe('createApiHandler', () => {
    it('should execute handler when no middleware is configured', async () => {
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({}, handler);

      const request = createMockRequest();
      const response = await apiHandler(request);

      expect(response.status).toBe(200);
      expect(handler).toHaveBeenCalledWith(request, undefined);
    });

    it('should check authentication when requireAuth is true', async () => {
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ requireAuth: true }, handler);

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockRequireAuth).toHaveBeenCalledWith(request);
      expect(handler).toHaveBeenCalled();
    });

    it('should return auth error when authentication fails', async () => {
      const authError = createErrorResponse('Unauthorized', 401);
      mockRequireAuth.mockResolvedValue({
        error: authError,
        session: null,
        user: null,
      });

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ requireAuth: true }, handler);

      const request = createMockRequest();
      const response = await apiHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should validate query parameters when querySchema is provided', async () => {
      const querySchema = z.object({ id: z.string() });
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ querySchema }, handler);

      const request = createMockRequest({ url: 'http://localhost:3000/api/test?id=123' });
      await apiHandler(request);

      expect(mockValidateQuery).toHaveBeenCalledWith(request, querySchema);
      expect(handler).toHaveBeenCalled();
    });

    it('should return validation error when query validation fails', async () => {
      const querySchema = z.object({ id: z.string() });
      mockValidateQuery.mockReturnValue({
        success: false,
        error: 'Invalid query parameters',
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ querySchema }, handler);

      const request = createMockRequest();
      const response = await apiHandler(request);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should validate request body when bodySchema is provided', async () => {
      const bodySchema = z.object({ name: z.string() });
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ bodySchema }, handler);

      const request = createMockRequest({
        method: 'POST',
        body: { name: 'test' },
      });
      await apiHandler(request);

      expect(mockValidateBody).toHaveBeenCalledWith(request, bodySchema);
      expect(handler).toHaveBeenCalled();
    });

    it('should return validation error when body validation fails', async () => {
      const bodySchema = z.object({ name: z.string() });
      mockValidateBody.mockResolvedValue({
        success: false,
        error: 'Invalid request body',
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ bodySchema }, handler);

      const request = createMockRequest({ method: 'POST' });
      const response = await apiHandler(request);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should attach validated body to request', async () => {
      const bodySchema = z.object({ name: z.string() });
      const validatedData = { name: 'test' };
      mockValidateBody.mockResolvedValue({
        success: true,
        data: validatedData,
      } as any);

      const handler = vi.fn().mockImplementation((req: any) => {
        expect(req._validatedBody).toEqual(validatedData);
        return createSuccessResponse();
      });

      const apiHandler = createApiHandler({ bodySchema }, handler);
      const request = createMockRequest({ method: 'POST', body: { name: 'test' } });
      await apiHandler(request);

      expect(handler).toHaveBeenCalled();
    });

    describe('error handling', () => {
      it('should handle errors thrown by handler', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('Test error'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(500);
      });

      it('should return 404 for "not found" errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('Resource not found'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(404);
      });

      it('should return 401 for "Unauthorized" errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('Unauthorized'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(401);
      });

      it('should return 409 for "UNIQUE" constraint errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(409);
      });

      it('should return 409 for "already exists" errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('User already exists'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(409);
      });

      it('should return 500 for generic errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('Database error'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(500);
      });

      it('should return 500 for non-Error exceptions', async () => {
        const handler = vi.fn().mockRejectedValue('String error');
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(500);
      });

      it('should use custom error handler when provided', async () => {
        const customErrorHandler = vi.fn((error: unknown) => {
          return NextResponse.json({ custom: 'error' }, { status: 418 });
        });

        const handler = vi.fn().mockRejectedValue(new Error('Test'));
        const apiHandler = createApiHandler({ errorHandler: customErrorHandler }, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(418);
        expect(customErrorHandler).toHaveBeenCalled();
      });
    });
  });

  describe('createPublicApiHandler', () => {
    it('should create handler without auth requirement', async () => {
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createPublicApiHandler(handler);

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockRequireAuth).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('createAuthApiHandler', () => {
    it('should create handler with auth requirement', async () => {
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthApiHandler(handler);

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockRequireAuth).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should block unauthenticated requests', async () => {
      const authError = createErrorResponse('Unauthorized', 401);
      mockRequireAuth.mockResolvedValue({
        error: authError,
        session: null,
        user: null,
      });

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthApiHandler(handler);

      const request = createMockRequest();
      const response = await apiHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('createValidatedApiHandler', () => {
    const testSchema = z.object({ name: z.string() });

    it('should validate request body and pass validated data to handler', async () => {
      const validatedData = { name: 'test' };
      mockValidateBody.mockResolvedValue({
        success: true,
        data: validatedData,
      } as any);

      const handler = vi.fn(async (_req, validatedBody) => {
        expect(validatedBody).toEqual(validatedData);
        return createSuccessResponse();
      });

      const apiHandler = createValidatedApiHandler(testSchema, handler);
      const request = createMockRequest({ method: 'POST', body: { name: 'test' } });

      await apiHandler(request);

      expect(mockValidateBody).toHaveBeenCalledWith(request, testSchema);
      expect(handler).toHaveBeenCalled();
    });

    it('should reject invalid request body', async () => {
      mockValidateBody.mockResolvedValue({
        success: false,
        error: 'Invalid body',
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createValidatedApiHandler(testSchema, handler);

      const request = createMockRequest({ method: 'POST' });
      const response = await apiHandler(request);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support additional config options', async () => {
      mockValidateBody.mockResolvedValue({
        success: true,
        data: { name: 'test' },
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createValidatedApiHandler(
        testSchema,
        handler,
        { requireAuth: true }
      );

      const request = createMockRequest({ method: 'POST', body: { name: 'test' } });
      await apiHandler(request);

      expect(mockRequireAuth).toHaveBeenCalled();
    });

    it('should pass context to handler', async () => {
      mockValidateBody.mockResolvedValue({
        success: true,
        data: { name: 'test' },
      } as any);

      const handler = vi.fn(async (_req, _data, context) => {
        expect(context).toEqual({ params: { id: '123' } });
        return createSuccessResponse();
      });

      const apiHandler = createValidatedApiHandler(testSchema, handler);
      const request = createMockRequest({ method: 'POST', body: { name: 'test' } });
      const context = { params: { id: '123' } };

      await apiHandler(request, context);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('createAuthValidatedApiHandler', () => {
    const testSchema = z.object({ name: z.string() });

    it('should require auth and validate body', async () => {
      mockValidateBody.mockResolvedValue({
        success: true,
        data: { name: 'test' },
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthValidatedApiHandler(testSchema, handler);

      const request = createMockRequest({ method: 'POST', body: { name: 'test' } });
      await apiHandler(request);

      expect(mockRequireAuth).toHaveBeenCalled();
      expect(mockValidateBody).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should block unauthenticated requests', async () => {
      const authError = createErrorResponse('Unauthorized', 401);
      mockRequireAuth.mockResolvedValue({
        error: authError,
        session: null,
        user: null,
      });

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthValidatedApiHandler(testSchema, handler);

      const request = createMockRequest({ method: 'POST' });
      const response = await apiHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('createQueryValidatedApiHandler', () => {
    const querySchema = z.object({ id: z.string() });

    it('should validate query parameters and pass to handler', async () => {
      const validatedQuery = { id: '123' };
      mockValidateQuery.mockReturnValue({
        success: true,
        data: validatedQuery,
      } as any);

      const handler = vi.fn(async (_req, queryData) => {
        expect(queryData).toEqual(validatedQuery);
        return createSuccessResponse();
      });

      const apiHandler = createQueryValidatedApiHandler(querySchema, handler);
      const request = createMockRequest({ url: 'http://localhost:3000/api/test?id=123' });

      await apiHandler(request);

      expect(mockValidateQuery).toHaveBeenCalledWith(request, querySchema);
      expect(handler).toHaveBeenCalled();
    });

    it('should reject invalid query parameters', async () => {
      mockValidateQuery.mockReturnValue({
        success: false,
        error: 'Invalid query',
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createQueryValidatedApiHandler(querySchema, handler);

      const request = createMockRequest();
      const response = await apiHandler(request);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support additional config options', async () => {
      mockValidateQuery.mockReturnValue({
        success: true,
        data: { id: '123' },
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createQueryValidatedApiHandler(
        querySchema,
        handler,
        { requireAuth: true }
      );

      const request = createMockRequest({ url: 'http://localhost:3000/api/test?id=123' });
      await apiHandler(request);

      expect(mockRequireAuth).toHaveBeenCalled();
    });
  });
});
