import { z } from 'zod';

/**
 * Distro Source Mapping Validation Schemas
 */

export const createDistroSourceSchema = z.object({
  distroId: z.string().min(1, 'Distro ID is required'),
  sourceId: z.string().min(1, 'Source ID is required'),
  priority: z
    .number()
    .int()
    .min(0, 'Priority must be 0 or greater')
    .default(0),
  isDefault: z.boolean().default(false),
});

export const updateDistroSourceSchema = createDistroSourceSchema.partial().extend({
  id: z.string().min(1, 'Distro source mapping ID is required'),
});

export type CreateDistroSourceInput = z.infer<typeof createDistroSourceSchema>;
export type UpdateDistroSourceInput = z.infer<typeof updateDistroSourceSchema>;