import { z } from 'zod';

/**
 * Source Validation Schemas
 */

export const createSourceSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  installCmd: z
    .string()
    .min(1, 'Install command is required')
    .max(200, 'Install command must be less than 200 characters'),
  requireSudo: z.boolean().default(false),
  setupCmd: z
    .string()
    .max(500, 'Setup command must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  priority: z
    .number()
    .int()
    .min(0, 'Priority must be 0 or greater')
    .default(0),
  apiEndpoint: z
    .string()
    .url('API endpoint must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export const updateSourceSchema = createSourceSchema.partial().extend({
  id: z.string().min(1, 'Source ID is required'),
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;