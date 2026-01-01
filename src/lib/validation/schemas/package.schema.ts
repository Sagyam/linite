import { z } from 'zod';

/**
 * Package Validation Schemas
 */

export const createPackageSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  sourceId: z.string().min(1, 'Source ID is required'),
  identifier: z
    .string()
    .min(1, 'Package identifier is required')
    .max(200, 'Identifier must be less than 200 characters'),
  version: z
    .string()
    .max(50, 'Version must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  size: z
    .number()
    .int()
    .min(0, 'Size must be 0 or greater')
    .optional(),
  maintainer: z
    .string()
    .max(100, 'Maintainer must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  isAvailable: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updatePackageSchema = createPackageSchema.partial().extend({
  id: z.string().min(1, 'Package ID is required'),
});

export const getPackagesQuerySchema = z.object({
  appId: z.string().optional(),
  sourceId: z.string().optional(),
  available: z
    .string()
    .optional()
    .transform((val) => (val ? val === 'true' : undefined)),
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

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type GetPackagesQuery = z.infer<typeof getPackagesQuerySchema>;