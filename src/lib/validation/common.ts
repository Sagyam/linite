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

