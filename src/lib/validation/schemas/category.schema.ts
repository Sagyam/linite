import { z } from 'zod';
import { slugSchema, optionalString, createUpdateSchema } from '../common';

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
});

export const updateCategorySchema = createUpdateSchema(createCategorySchema);

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
