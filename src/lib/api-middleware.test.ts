import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  // Mock functions
  const mockApplyRateLimit = vi.mocked(apiUtils.applyRateLimit);
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

  const createMockRateLimiter = () => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      reset: Date.now() + 60000,
      remaining: 9,
    }),
  });

  const createSuccessResponse = (data: unknown = { success: true }) =>
    NextResponse.json(data, { status: 200 });

  const createErrorResponse = (message: string, status: number) =>
    NextResponse.json({ error: message }, { status });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockApplyRateLimit.mockResolvedValue(null);
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

      expect(handler).toHaveBeenCalledWith(request, undefined);
      expect(response.status).toBe(200);
    });

    it('should apply rate limiting when configured', async () => {
      const rateLimiter = createMockRateLimiter() as any;
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ rateLimit: rateLimiter }, handler);

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, rateLimiter);
      expect(handler).toHaveBeenCalled();
    });

    it('should return rate limit error when rate limit exceeded', async () => {
      const rateLimiter = createMockRateLimiter() as any;
      const rateLimitError = createErrorResponse('Too many requests', 429);
      mockApplyRateLimit.mockResolvedValue(rateLimitError);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createApiHandler({ rateLimit: rateLimiter }, handler);

      const request = createMockRequest();
      const response = await apiHandler(request);

      expect(response.status).toBe(429);
      expect(handler).not.toHaveBeenCalled();
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

    it('should apply middleware in correct order: rate limit -> auth -> query -> body', async () => {
      const callOrder: string[] = [];
      const rateLimiter = createMockRateLimiter() as any;

      mockApplyRateLimit.mockImplementation(async () => {
        callOrder.push('rateLimit');
        return null;
      });

      mockRequireAuth.mockImplementation(async () => {
        callOrder.push('auth');
        return { error: null, session: {}, user: {} } as any;
      });

      mockValidateQuery.mockImplementation(() => {
        callOrder.push('query');
        return { success: true, data: {} } as any;
      });

      mockValidateBody.mockImplementation(async () => {
        callOrder.push('body');
        return { success: true, data: {} } as any;
      });

      const handler = vi.fn().mockImplementation(() => {
        callOrder.push('handler');
        return createSuccessResponse();
      });

      const apiHandler = createApiHandler(
        {
          rateLimit: rateLimiter,
          requireAuth: true,
          querySchema: z.object({}),
          bodySchema: z.object({}),
        },
        handler
      );

      const request = createMockRequest({ method: 'POST' });
      await apiHandler(request);

      expect(callOrder).toEqual(['rateLimit', 'auth', 'query', 'body', 'handler']);
    });

    describe('error handling', () => {
      // Suppress console.error during error handling tests
      let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

      beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      });

      afterEach(() => {
        consoleErrorSpy.mockRestore();
      });

      it('should return 404 for "not found" errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('Resource not found'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(404);
      });

      it('should return 401 for "Unauthorized" errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('Unauthorized access'));
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
        const handler = vi.fn().mockRejectedValue(new Error('Record already exists'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(409);
      });

      it('should return 500 for generic errors', async () => {
        const handler = vi.fn().mockRejectedValue(new Error('Something went wrong'));
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(500);
      });

      it('should return 500 for non-Error exceptions', async () => {
        const handler = vi.fn().mockRejectedValue('string error');
        const apiHandler = createApiHandler({}, handler);

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe('An unexpected error occurred');
      });

      it('should use custom error handler when provided', async () => {
        const customErrorHandler = vi.fn().mockReturnValue(
          createErrorResponse('Custom error', 418)
        );

        const handler = vi.fn().mockRejectedValue(new Error('Test error'));
        const apiHandler = createApiHandler(
          { errorHandler: customErrorHandler },
          handler
        );

        const request = createMockRequest();
        const response = await apiHandler(request);

        expect(customErrorHandler).toHaveBeenCalled();
        expect(response.status).toBe(418);
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

    it('should apply rate limiting when provided', async () => {
      const rateLimiter = createMockRateLimiter() as any;
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createPublicApiHandler(handler, rateLimiter);

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, rateLimiter);
      expect(handler).toHaveBeenCalled();
    });

    it('should work without rate limiter', async () => {
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createPublicApiHandler(handler, null);

      const request = createMockRequest();
      await apiHandler(request);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('createAuthApiHandler', () => {
    it('should create handler with auth requirement', async () => {
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthApiHandler(handler);

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockRequireAuth).toHaveBeenCalledWith(request);
      expect(handler).toHaveBeenCalled();
    });

    it('should apply rate limiting when provided', async () => {
      const rateLimiter = createMockRateLimiter() as any;
      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthApiHandler(handler, rateLimiter);

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, rateLimiter);
      expect(mockRequireAuth).toHaveBeenCalledWith(request);
      expect(handler).toHaveBeenCalled();
    });

    it('should block unauthenticated requests', async () => {
      mockRequireAuth.mockResolvedValue({
        error: createErrorResponse('Unauthorized', 401),
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
    const bodySchema = z.object({
      name: z.string(),
      age: z.number().optional(),
    });

    it('should validate request body and pass validated data to handler', async () => {
      const validatedData = { name: 'John', age: 30 };
      mockValidateBody.mockResolvedValue({
        success: true,
        data: validatedData,
      } as any);

      const handler = vi.fn().mockImplementation((req, data) => {
        expect(data).toEqual(validatedData);
        return createSuccessResponse({ received: data });
      });

      const apiHandler = createValidatedApiHandler(bodySchema, handler);
      const request = createMockRequest({
        method: 'POST',
        body: validatedData,
      });

      await apiHandler(request);

      expect(mockValidateBody).toHaveBeenCalledWith(request, bodySchema);
      expect(handler).toHaveBeenCalledWith(request, validatedData, undefined);
    });

    it('should reject invalid request body', async () => {
      mockValidateBody.mockResolvedValue({
        success: false,
        error: 'Name is required',
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createValidatedApiHandler(bodySchema, handler);

      const request = createMockRequest({ method: 'POST' });
      const response = await apiHandler(request);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support additional config options', async () => {
      const rateLimiter = createMockRateLimiter() as any;
      mockValidateBody.mockResolvedValue({
        success: true,
        data: { name: 'test' },
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createValidatedApiHandler(bodySchema, handler, {
        rateLimit: rateLimiter,
      });

      const request = createMockRequest({ method: 'POST' });
      await apiHandler(request);

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, rateLimiter);
      expect(handler).toHaveBeenCalled();
    });

    it('should pass context to handler', async () => {
      const context = { params: { id: '123' } };
      mockValidateBody.mockResolvedValue({
        success: true,
        data: { name: 'test' },
      } as any);

      const handler = vi.fn().mockImplementation((req, data, ctx) => {
        expect(ctx).toEqual(context);
        return createSuccessResponse();
      });

      const apiHandler = createValidatedApiHandler(bodySchema, handler);
      const request = createMockRequest({ method: 'POST' });

      await apiHandler(request, context);

      expect(handler).toHaveBeenCalledWith(request, { name: 'test' }, context);
    });
  });

  describe('createAuthValidatedApiHandler', () => {
    const bodySchema = z.object({ title: z.string() });

    it('should require auth and validate body', async () => {
      const validatedData = { title: 'Test' };
      mockValidateBody.mockResolvedValue({
        success: true,
        data: validatedData,
      } as any);

      const handler = vi.fn().mockImplementation((req, data) => {
        expect(data).toEqual(validatedData);
        return createSuccessResponse();
      });

      const apiHandler = createAuthValidatedApiHandler(bodySchema, handler);
      const request = createMockRequest({ method: 'POST', body: validatedData });

      await apiHandler(request);

      expect(mockRequireAuth).toHaveBeenCalledWith(request);
      expect(mockValidateBody).toHaveBeenCalledWith(request, bodySchema);
      expect(handler).toHaveBeenCalled();
    });

    it('should block unauthenticated requests', async () => {
      mockRequireAuth.mockResolvedValue({
        error: createErrorResponse('Unauthorized', 401),
        session: null,
        user: null,
      });

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthValidatedApiHandler(bodySchema, handler);

      const request = createMockRequest({ method: 'POST' });
      const response = await apiHandler(request);

      expect(response.status).toBe(401);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should apply rate limiting when provided', async () => {
      const rateLimiter = createMockRateLimiter() as any;
      mockValidateBody.mockResolvedValue({
        success: true,
        data: { title: 'Test' },
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createAuthValidatedApiHandler(bodySchema, handler, rateLimiter);

      const request = createMockRequest({ method: 'POST' });
      await apiHandler(request);

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, rateLimiter);
    });
  });

  describe('createQueryValidatedApiHandler', () => {
    const querySchema = z.object({
      page: z.string().transform(Number).optional(),
      limit: z.string().transform(Number).optional(),
    });

    it('should validate query parameters and pass to handler', async () => {
      mockValidateQuery.mockReturnValue({
        success: true,
        data: { page: '1', limit: '10' },
      } as any);

      const handler = vi.fn().mockImplementation((req, query) => {
        // Handler receives parsed query object
        expect(query).toBeDefined();
        return createSuccessResponse();
      });

      const apiHandler = createQueryValidatedApiHandler(querySchema, handler);
      const request = createMockRequest({
        url: 'http://localhost:3000/api/test?page=1&limit=10',
      });

      await apiHandler(request);

      expect(mockValidateQuery).toHaveBeenCalledWith(request, querySchema);
      expect(handler).toHaveBeenCalled();
    });

    it('should reject invalid query parameters', async () => {
      mockValidateQuery.mockReturnValue({
        success: false,
        error: 'Invalid page number',
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createQueryValidatedApiHandler(querySchema, handler);

      const request = createMockRequest();
      const response = await apiHandler(request);

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should support additional config options', async () => {
      const rateLimiter = createMockRateLimiter() as any;
      mockValidateQuery.mockReturnValue({
        success: true,
        data: {},
      } as any);

      const handler = vi.fn().mockResolvedValue(createSuccessResponse());
      const apiHandler = createQueryValidatedApiHandler(querySchema, handler, {
        requireAuth: true,
        rateLimit: rateLimiter,
      });

      const request = createMockRequest();
      await apiHandler(request);

      expect(mockApplyRateLimit).toHaveBeenCalledWith(request, rateLimiter);
      expect(mockRequireAuth).toHaveBeenCalledWith(request);
      expect(handler).toHaveBeenCalled();
    });
  });
});
