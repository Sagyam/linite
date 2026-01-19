import { z } from 'zod';
import { slugSchema, optionalUrl, optionalString, createUpdateSchema } from '../common';

const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g., #FF5733)')
  .optional()
  .or(z.literal(''));

export const createDistroSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  slug: slugSchema.max(50, 'Slug must be less than 50 characters'),
  family: z
    .string()
    .min(1, 'Family is required')
    .max(50, 'Family must be less than 50 characters'),
  iconUrl: optionalUrl('Icon URL'),
  basedOn: optionalString(50, 'Based on'),
  isPopular: z.boolean().default(false),
  themeColorLight: hexColorSchema,
  themeColorDark: hexColorSchema,
});

export const updateDistroSchema = createUpdateSchema(createDistroSchema);

export type CreateDistroInput = z.infer<typeof createDistroSchema>;
export type UpdateDistroInput = z.infer<typeof updateDistroSchema>;
