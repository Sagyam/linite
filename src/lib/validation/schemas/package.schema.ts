import { z } from 'zod';
import { optionalString, createUpdateSchema, paginationQuerySchema } from '../common';

export const createPackageSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  sourceId: z.string().min(1, 'Source ID is required'),
  identifier: z
    .string()
    .min(1, 'Package identifier is required')
    .max(200, 'Identifier must be less than 200 characters'),
  version: optionalString(50, 'Version'),
  size: z
    .number()
    .int()
    .min(0, 'Size must be 0 or greater')
    .optional(),
  maintainer: optionalString(100, 'Maintainer'),
  isAvailable: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
  packageSetupCmd: z
    .union([
      z.string(),
      z.record(z.string(), z.string().nullable()),
    ])
    .nullable()
    .optional(),
  packageCleanupCmd: z
    .union([
      z.string(),
      z.record(z.string(), z.string().nullable()),
    ])
    .nullable()
    .optional(),
  uninstallMetadata: z.object({
    linux: z.string().optional(),
    windows: z.string().optional(),
    manualInstructions: z.string().optional(),
  }).nullable().optional(),
});

export const updatePackageSchema = createUpdateSchema(createPackageSchema);

export const getPackagesQuerySchema = z.object({
  appId: z.string().optional(),
  sourceId: z.string().optional(),
  available: z
    .string()
    .optional()
    .transform((val) => (val ? val === 'true' : undefined)),
  ...paginationQuerySchema,
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type GetPackagesQuery = z.infer<typeof getPackagesQuerySchema>;
