import { z } from 'zod';
import { slugSchema, optionalString, createUpdateSchema } from '../common';

const hexColorSchema = z
  .string()
  .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color (e.g., #FF5733)')
  .optional()
  .or(z.literal(''));

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  slug: slugSchema.max(50, 'Slug must be less than 50 characters'),
  icon: optionalString(50, 'Icon name'),
  description: optionalString(200, 'Description'),
  displayOrder: z
    .number()
    .int()
    .min(0, 'Display order must be 0 or greater')
    .default(0),
  colorLight: hexColorSchema,
  colorDark: hexColorSchema,
});

export const updateCategorySchema = createUpdateSchema(createCategorySchema);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
