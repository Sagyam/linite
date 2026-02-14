import { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';

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
      const errors = (error as z.ZodError<unknown>).issues;
      const firstError = errors[0];
      return {
        success: false,
        error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation failed',
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
      const errors = (error as z.ZodError<unknown>).issues;
      const firstError = errors[0];
      return {
        success: false,
        error: firstError ? `${firstError.path.join('.')}: ${firstError.message}` : 'Validation failed',
      };
    }
    return {
      success: false,
      error: 'Invalid query parameters',
    };
  }
}

