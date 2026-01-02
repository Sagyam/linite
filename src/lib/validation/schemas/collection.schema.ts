import { z } from 'zod';

/**
 * Collection Validation Schemas
 * Reusable validation for collection API routes and forms
 */

export const collectionSlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be less than 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .describe('URL-friendly identifier for the collection');

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPublic: z.boolean().default(false),
  tags: z
    .array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  iconUrl: z
    .string()
    .url('Icon URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  appIds: z
    .array(z.string())
    .min(1, 'At least one app is required')
    .max(100, 'Maximum 100 apps per collection'),
});

export const updateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  isPublic: z.boolean().optional(),
  iconUrl: z
    .string()
    .url('Icon URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  tags: z
    .array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  appIds: z
    .array(z.string())
    .min(1, 'At least one app is required')
    .max(100, 'Maximum 100 apps per collection')
    .optional(),
});

export const addCollectionItemSchema = z.object({
  appId: z.string().min(1, 'App ID is required'),
  note: z
    .string()
    .max(200, 'Note must be less than 200 characters')
    .optional(),
});

export const reorderCollectionItemsSchema = z.object({
  itemOrders: z
    .array(
      z.object({
        itemId: z.string().min(1, 'Item ID is required'),
        displayOrder: z.number().int().min(0, 'Display order must be a positive integer'),
      })
    )
    .min(1, 'At least one item order is required'),
});

export const getCollectionsQuerySchema = z.object({
  featured: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  userId: z.string().optional(),
  search: z.string().optional(),
  tags: z.string().optional(), // comma-separated tags
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(0)),
});

export const featureCollectionSchema = z.object({
  isFeatured: z.boolean(),
});

export const templateCollectionSchema = z.object({
  isTemplate: z.boolean(),
});

// Type exports for TypeScript
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type AddCollectionItemInput = z.infer<typeof addCollectionItemSchema>;
export type ReorderCollectionItemsInput = z.infer<typeof reorderCollectionItemsSchema>;
export type GetCollectionsQuery = z.infer<typeof getCollectionsQuerySchema>;
export type FeatureCollectionInput = z.infer<typeof featureCollectionSchema>;
export type TemplateCollectionInput = z.infer<typeof templateCollectionSchema>;
