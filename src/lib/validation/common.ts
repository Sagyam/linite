import { z } from 'zod';

/**
 * Common field validators
 */

// CUID2 field validator
export const cuid2Field = z.string().cuid2('Invalid ID format');

// Slug field validator
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens');

// URL field validator
export const urlField = z.string().url('Invalid URL format');

export const paginationQuerySchema = {
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(1).max(100).optional()),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .pipe(z.number().min(0).optional()),
};

export const optionalString = (maxLength: number, fieldName: string) =>
  z
    .string()
    .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
    .optional()
    .or(z.literal(''));

export const optionalUrl = (fieldName: string) =>
  z
    .string()
    .url(`${fieldName} must be a valid URL`)
    .optional()
    .or(z.literal(''));

export function createUpdateSchema<T extends Record<string, z.ZodTypeAny>>(createSchema: z.ZodObject<T>) {
  return createSchema.partial().extend({
    id: z.string().min(1, 'ID is required'),
  });
}

export function optionalArray(maxItems?: number, fieldName?: string) {
  const arraySchema = maxItems !== undefined
    ? z.array(z.string()).max(maxItems, fieldName ? `Maximum ${maxItems} ${fieldName} allowed` : `Maximum ${maxItems} items allowed`)
    : z.array(z.string());
  return arraySchema.optional();
}

export function withPagination<T extends z.ZodRawShape>(baseSchema: T) {
  return z.object({
    ...baseSchema,
    ...paginationQuerySchema,
  });
}

/**
 * Validation helper: Ensure ID in request body matches ID in URL
 * Throws an error if IDs don't match
 *
 * Usage in API routes:
 * ```typescript
 * requireIdMatch(data.id, urlId);
 * ```
 */
export function requireIdMatch(bodyId: string, urlId: string): void {
  if (bodyId !== urlId) {
    throw new Error('ID in body must match ID in URL');
  }
}
