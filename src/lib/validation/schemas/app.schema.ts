import { z } from 'zod';

/**
 * App Validation Schemas
 * Reusable validation for API routes and forms
 */

export const appSlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .describe('URL-friendly identifier for the app');

export const createAppSchema = z.object({
  slug: appSlugSchema,
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  iconUrl: z
    .string()
    .url('Icon URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  homepage: z
    .string()
    .url('Homepage must be a valid URL')
    .optional()
    .or(z.literal('')),
  isPopular: z.boolean().default(false),
  isFoss: z.boolean().default(true),
  categoryId: z.string().min(1, 'Category is required'),
});

export const updateAppSchema = createAppSchema.partial().extend({
  id: z.string().min(1, 'App ID is required'),
});

export const getAppsQuerySchema = z.object({
  category: z.string().optional(),
  popular: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  search: z.string().optional(),
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
});

// Type exports for TypeScript
export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export type GetAppsQuery = z.infer<typeof getAppsQuerySchema>;