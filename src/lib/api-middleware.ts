import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { requireAuth, errorResponse } from './api-utils';
import { validateBody, validateQuery } from './validation/middleware';

/**
 * API Middleware Composition
 * Standardized patterns for API route handlers
 */

export type ApiHandler<Context = unknown> = (
  request: NextRequest,
  context?: Context
) => Promise<NextResponse>;

export type ValidatedApiHandler<T, Context = unknown> = (
  request: NextRequest,
  data: T,
  context?: Context
) => Promise<NextResponse>;

export interface ApiMiddlewareConfig<BodySchema = unknown, QuerySchema = unknown> {
  /**
   * Require authentication for this endpoint
   */
  requireAuth?: boolean;

  /**
   * Zod schema for request body validation
   */
  bodySchema?: ZodSchema<BodySchema>;

  /**
   * Zod schema for query parameters validation
   */
  querySchema?: ZodSchema<QuerySchema>;

  /**
   * Custom error handler
   */
  errorHandler?: (error: unknown) => NextResponse;
}

/**
 * Compose middleware with a handler
 * Provides automatic auth, validation, and error handling
 */
export function createApiHandler<BodySchema = unknown, QuerySchema = unknown, Context = unknown>(
  config: ApiMiddlewareConfig<BodySchema, QuerySchema>,
  handler: ApiHandler<Context>
): ApiHandler<Context> {
  return async (request: NextRequest, context?: Context): Promise<NextResponse> => {
    try {
      // 1. Check authentication if required
      if (config.requireAuth) {
        const authCheck = await requireAuth(request);
        if (authCheck.error) {
          return authCheck.error;
        }
      }

      // 2. Validate query parameters if schema provided
      if (config.querySchema) {
        const queryValidation = validateQuery(request, config.querySchema);
        if (!queryValidation.success) {
          return errorResponse(queryValidation.error || 'Invalid query parameters', 400);
        }
      }

      // 3. Validate request body if schema provided and store validated data
      let validatedBody: BodySchema | undefined;
      if (config.bodySchema) {
        const bodyValidation = await validateBody(request, config.bodySchema);
        if (!bodyValidation.success) {
          return errorResponse(bodyValidation.error || 'Invalid request body', 400);
        }
        validatedBody = bodyValidation.data;
      }

      // 4. Execute the handler (attach validated body to request for handlers to access)
      if (validatedBody !== undefined) {
        (request as NextRequest & { _validatedBody?: unknown })._validatedBody = validatedBody;
      }
      return await handler(request, context);
    } catch (error) {
      // Use custom error handler if provided
      if (config.errorHandler) {
        return config.errorHandler(error);
      }

      // Default error handling
      console.error('API Error:', error);

      if (error instanceof Error) {
        // Handle known error types
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
 * Create a public API handler
 */
export function createPublicApiHandler<Context = unknown>(
  handler: ApiHandler<Context>
): ApiHandler<Context> {
  return createApiHandler(
    {
      requireAuth: false,
    },
    handler
  );
}

/**
 * Create an authenticated API handler
 */
export function createAuthApiHandler<Context = unknown>(
  handler: ApiHandler<Context>
): ApiHandler<Context> {
  return createApiHandler(
    {
      requireAuth: true,
    },
    handler
  );
}

/**
 * Create a handler with body validation
 */
export function createValidatedApiHandler<BodySchema, Context = unknown>(
  bodySchema: ZodSchema<BodySchema>,
  handler: ValidatedApiHandler<BodySchema, Context>,
  config?: Omit<ApiMiddlewareConfig<BodySchema, unknown>, 'bodySchema'>
): ApiHandler<Context> {
  return createApiHandler<BodySchema, unknown, Context>(
    {
      ...config,
      bodySchema,
    },
    async (request, context) => {
      // Body is already validated and stored by middleware
      const body = (request as NextRequest & { _validatedBody?: BodySchema })._validatedBody as BodySchema;
      return handler(request, body, context);
    }
  );
}

/**
 * Create an authenticated handler with body validation
 */
export function createAuthValidatedApiHandler<BodySchema, Context = unknown>(
  bodySchema: ZodSchema<BodySchema>,
  handler: ValidatedApiHandler<BodySchema, Context>
): ApiHandler<Context> {
  return createValidatedApiHandler(bodySchema, handler, {
    requireAuth: true,
  });
}

/**
 * Create a handler with query validation
 */
export function createQueryValidatedApiHandler<QuerySchema, Context = unknown>(
  querySchema: ZodSchema<QuerySchema>,
  handler: ValidatedApiHandler<QuerySchema, Context>,
  config?: Omit<ApiMiddlewareConfig<unknown, QuerySchema>, 'querySchema'>
): ApiHandler<Context> {
  return createApiHandler<unknown, QuerySchema, Context>(
    {
      ...config,
      querySchema,
    },
    async (request, context) => {
      // Query is already validated by middleware, parse it again for handler
      const searchParams = request.nextUrl.searchParams;
      const queryObject = Object.fromEntries(searchParams.entries());
      return handler(request, queryObject as QuerySchema, context);
    }
  );
}

