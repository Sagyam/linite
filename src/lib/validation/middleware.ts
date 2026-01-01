import { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';
import { errorResponse } from '@/lib/api-utils';

/**
 * Validation Middleware
 * Utilities for validating request data
 */

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate request body against a schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return {
      success: false,
      error: 'Invalid request body',
    };
  }
}

/**
 * Validate query parameters against a schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryObject = Object.fromEntries(searchParams.entries());
    const data = schema.parse(queryObject);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return {
      success: false,
      error: 'Invalid query parameters',
    };
  }
}

/**
 * Validate path parameters against a schema
 */
export function validateParams<T>(
  params: unknown,
  schema: ZodSchema<T>
): ValidationResult<T> {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return {
        success: false,
        error: `${firstError.path.join('.')}: ${firstError.message}`,
      };
    }
    return {
      success: false,
      error: 'Invalid parameters',
    };
  }
}

/**
 * Higher-order function to wrap handlers with automatic body validation
 */
export function withBodyValidation<T, Context = unknown>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, data: T, context?: Context) => Promise<Response>
) {
  return async (request: NextRequest, context?: Context): Promise<Response> => {
    const validation = await validateBody(request, schema);
    if (!validation.success) {
      return errorResponse(validation.error || 'Validation failed', 400);
    }
    return handler(request, validation.data!, context);
  };
}

/**
 * Higher-order function to wrap handlers with automatic query validation
 */
export function withQueryValidation<T, Context = unknown>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, query: T, context?: Context) => Promise<Response>
) {
  return async (request: NextRequest, context?: Context): Promise<Response> => {
    const validation = validateQuery(request, schema);
    if (!validation.success) {
      return errorResponse(validation.error || 'Validation failed', 400);
    }
    return handler(request, validation.data!, context);
  };
}