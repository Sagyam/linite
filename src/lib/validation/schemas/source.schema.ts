import { z } from 'zod';
import { slugSchema, optionalString, optionalUrl, createUpdateSchema } from '../common';

export const createSourceSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters'),
  slug: slugSchema.max(50, 'Slug must be less than 50 characters'),
  installCmd: z
    .string()
    .min(1, 'Install command is required')
    .max(200, 'Install command must be less than 200 characters'),
  requireSudo: z.boolean().default(false),
  setupCmd: optionalString(500, 'Setup command'),
  priority: z
    .number()
    .int()
    .min(0, 'Priority must be 0 or greater')
    .default(0),
  apiEndpoint: optionalUrl('API endpoint'),
});

export const updateSourceSchema = createUpdateSchema(createSourceSchema);

export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
