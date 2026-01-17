import { z } from 'zod';
import { slugSchema, optionalUrl, optionalString, createUpdateSchema, paginationQuerySchema } from '../common';

/**
 * App Validation Schemas
 * Reusable validation for API routes and forms
 */

export const appSlugSchema = slugSchema.describe('URL-friendly identifier for app');

export const createAppSchema = z.object({
  slug: appSlugSchema,
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),
  description: optionalString(500, 'Description'),
  iconUrl: optionalUrl('Icon URL'),
  homepage: optionalUrl('Homepage'),
  isPopular: z.boolean().default(false),
  isFoss: z.boolean().default(true),
  categoryId: z.string().min(1, 'Category is required'),
});

export const updateAppSchema = createUpdateSchema(createAppSchema);

export const getAppsQuerySchema = z.object({
  category: z.string().optional(),
  popular: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  search: z.string().optional(),
  ...paginationQuerySchema,
});

export type CreateAppInput = z.infer<typeof createAppSchema>;
export type UpdateAppInput = z.infer<typeof updateAppSchema>;
export type GetAppsQuery = z.infer<typeof getAppsQuerySchema>;
