import { z } from 'zod';
import { slugSchema, optionalUrl, optionalString } from '../common';

/**
 * Collection Validation Schemas
 * Reusable validation for collection API routes and forms
 */

export const collectionSlugSchema = slugSchema
  .max(100, 'Slug must be less than 100 characters')
  .describe('URL-friendly identifier for collection');

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name must be less than 100 characters'),
  description: optionalString(500, 'Description'),
  isPublic: z.boolean().default(false),
  tags: z
    .array(z.string())
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
  iconUrl: optionalUrl('Icon URL'),
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
  description: optionalString(500, 'Description'),
  isPublic: z.boolean().optional(),
  iconUrl: optionalUrl('Icon URL'),
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
  note: optionalString(200, 'Note'),
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
  tags: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 20)
    .pipe(z.number().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 0)
    .pipe(z.number().min(0)),
});

export const featureCollectionSchema = z.object({
  isFeatured: z.boolean(),
});

export const templateCollectionSchema = z.object({
  isTemplate: z.boolean(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type AddCollectionItemInput = z.infer<typeof addCollectionItemSchema>;
export type ReorderCollectionItemsInput = z.infer<typeof reorderCollectionItemsSchema>;
export type GetCollectionsQuery = z.infer<typeof getCollectionsQuerySchema>;
export type FeatureCollectionInput = z.infer<typeof featureCollectionSchema>;
export type TemplateCollectionInput = z.infer<typeof templateCollectionSchema>;
