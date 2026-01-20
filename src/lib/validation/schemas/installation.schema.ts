import { z } from 'zod';
import { createUpdateSchema, paginationQuerySchema } from '../common';

export const createInstallationSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  packageId: z.string().min(1, 'Package ID is required'),
  distroId: z.string().min(1, 'Distro ID is required'),
  deviceIdentifier: z
    .string()
    .min(1, 'Device identifier is required')
    .max(100, 'Device identifier must be less than 100 characters'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export const updateInstallationSchema = createUpdateSchema(
  createInstallationSchema.pick({
    deviceIdentifier: true,
    notes: true,
  })
);

export const getInstallationsQuerySchema = z.object({
  deviceIdentifier: z.string().optional(),
  appId: z.string().optional(),
  distroId: z.string().optional(),
  ...paginationQuerySchema,
});

export type CreateInstallationInput = z.infer<typeof createInstallationSchema>;
export type UpdateInstallationInput = z.infer<typeof updateInstallationSchema>;
export type GetInstallationsQuery = z.infer<typeof getInstallationsQuerySchema>;
