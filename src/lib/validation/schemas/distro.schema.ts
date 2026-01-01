import { z } from 'zod';

/**
 * Distribution Validation Schemas
 */

export const createDistroSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  family: z
    .string()
    .min(1, 'Family is required')
    .max(50, 'Family must be less than 50 characters'),
  iconUrl: z
    .string()
    .url('Icon URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  basedOn: z
    .string()
    .max(50, 'Based on must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  isPopular: z.boolean().default(false),
});

export const updateDistroSchema = createDistroSchema.partial().extend({
  id: z.string().min(1, 'Distro ID is required'),
});

export type CreateDistroInput = z.infer<typeof createDistroSchema>;
export type UpdateDistroInput = z.infer<typeof updateDistroSchema>;