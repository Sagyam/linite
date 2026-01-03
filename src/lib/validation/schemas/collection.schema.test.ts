import { describe, it, expect } from 'vitest';
import {
  createCollectionSchema,
  updateCollectionSchema,
  addCollectionItemSchema,
  reorderCollectionItemsSchema,
  getCollectionsQuerySchema,
  featureCollectionSchema,
  templateCollectionSchema,
  collectionSlugSchema,
} from './collection.schema';

describe('Collection Validation Schemas', () => {
  describe('collectionSlugSchema', () => {
    it('should validate valid slugs', () => {
      const validSlugs = [
        'my-collection',
        'web-dev-tools',
        'collection-123',
        'a',
        'test-slug-with-numbers-123',
      ];

      validSlugs.forEach((slug) => {
        const result = collectionSlugSchema.safeParse(slug);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid slugs', () => {
      const invalidSlugs = [
        '',
        'My Collection', // Has spaces and uppercase
        'test_slug', // Has underscore
        'test@slug', // Has special char
        'Test-Slug', // Has uppercase
        'a'.repeat(101), // Too long
      ];

      invalidSlugs.forEach((slug) => {
        const result = collectionSlugSchema.safeParse(slug);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('createCollectionSchema', () => {
    it('should validate valid collection creation data', () => {
      const validData = {
        name: 'Web Development Tools',
        description: 'Essential tools for web developers',
        isPublic: true,
        tags: ['development', 'web', 'tools'],
        iconUrl: 'https://example.com/icon.png',
        appIds: ['app-1', 'app-2', 'app-3'],
      };

      const result = createCollectionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate minimal collection data', () => {
      const minimalData = {
        name: 'My Collection',
        appIds: ['app-1'],
      };

      const result = createCollectionSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isPublic).toBe(false); // Default value
      }
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
        appIds: ['app-1'],
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const data = {
        name: 'a'.repeat(101),
        appIds: ['app-1'],
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject description longer than 500 characters', () => {
      const data = {
        name: 'Test',
        description: 'a'.repeat(501),
        appIds: ['app-1'],
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject more than 10 tags', () => {
      const data = {
        name: 'Test',
        tags: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
        appIds: ['app-1'],
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid icon URL', () => {
      const data = {
        name: 'Test',
        iconUrl: 'not-a-url',
        appIds: ['app-1'],
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept empty string for icon URL', () => {
      const data = {
        name: 'Test',
        iconUrl: '',
        appIds: ['app-1'],
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty appIds array', () => {
      const data = {
        name: 'Test',
        appIds: [],
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject more than 100 apps', () => {
      const data = {
        name: 'Test',
        appIds: Array.from({ length: 101 }, (_, i) => `app-${i}`),
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate exactly 100 apps', () => {
      const data = {
        name: 'Test',
        appIds: Array.from({ length: 100 }, (_, i) => `app-${i}`),
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing appIds', () => {
      const data = {
        name: 'Test',
      };

      const result = createCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('updateCollectionSchema', () => {
    it('should validate partial updates', () => {
      const data = {
        name: 'Updated Name',
      };

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate all fields', () => {
      const data = {
        name: 'Updated Collection',
        description: 'Updated description',
        isPublic: true,
        iconUrl: 'https://example.com/new-icon.png',
        tags: ['updated', 'test'],
        appIds: ['app-1', 'app-2'],
      };

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const data = {};

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid name', () => {
      const data = {
        name: '', // Empty string
      };

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid description length', () => {
      const data = {
        description: 'a'.repeat(501),
      };

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject too many tags', () => {
      const data = {
        tags: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
      };

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty appIds array when provided', () => {
      const data = {
        appIds: [],
      };

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow valid appIds update', () => {
      const data = {
        appIds: ['app-1', 'app-2', 'app-3'],
      };

      const result = updateCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('addCollectionItemSchema', () => {
    it('should validate adding item without note', () => {
      const data = {
        appId: 'app-123',
      };

      const result = addCollectionItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate adding item with note', () => {
      const data = {
        appId: 'app-123',
        note: 'This is a great app for productivity',
      };

      const result = addCollectionItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty appId', () => {
      const data = {
        appId: '',
      };

      const result = addCollectionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject note longer than 200 characters', () => {
      const data = {
        appId: 'app-123',
        note: 'a'.repeat(201),
      };

      const result = addCollectionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept note exactly 200 characters', () => {
      const data = {
        appId: 'app-123',
        note: 'a'.repeat(200),
      };

      const result = addCollectionItemSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing appId', () => {
      const data = {
        note: 'Some note',
      };

      const result = addCollectionItemSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('reorderCollectionItemsSchema', () => {
    it('should validate valid reordering data', () => {
      const data = {
        itemOrders: [
          { itemId: 'item-1', displayOrder: 0 },
          { itemId: 'item-2', displayOrder: 1 },
          { itemId: 'item-3', displayOrder: 2 },
        ],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate single item', () => {
      const data = {
        itemOrders: [{ itemId: 'item-1', displayOrder: 0 }],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const data = {
        itemOrders: [],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative displayOrder', () => {
      const data = {
        itemOrders: [{ itemId: 'item-1', displayOrder: -1 }],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer displayOrder', () => {
      const data = {
        itemOrders: [{ itemId: 'item-1', displayOrder: 1.5 }],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty itemId', () => {
      const data = {
        itemOrders: [{ itemId: '', displayOrder: 0 }],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing itemId', () => {
      const data = {
        itemOrders: [{ displayOrder: 0 }],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing displayOrder', () => {
      const data = {
        itemOrders: [{ itemId: 'item-1' }],
      };

      const result = reorderCollectionItemsSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('getCollectionsQuerySchema', () => {
    it('should validate and transform featured query', () => {
      const data = {
        featured: 'true',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured).toBe(true);
      }
    });

    it('should transform featured false', () => {
      const data = {
        featured: 'false',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.featured).toBe(false);
      }
    });

    it('should validate with all query parameters', () => {
      const data = {
        featured: 'true',
        userId: 'user-123',
        search: 'web development',
        tags: 'dev,web,tools',
        limit: '50',
        offset: '10',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(10);
        expect(result.data.featured).toBe(true);
        expect(result.data.userId).toBe('user-123');
        expect(result.data.search).toBe('web development');
        expect(result.data.tags).toBe('dev,web,tools');
      }
    });

    it('should use default values', () => {
      const data = {};

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should enforce maximum limit of 100', () => {
      const data = {
        limit: '150',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should enforce minimum limit of 1', () => {
      const data = {
        limit: '0',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should enforce minimum offset of 0', () => {
      const data = {
        offset: '-1',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept limit at boundary (100)', () => {
      const data = {
        limit: '100',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(100);
      }
    });

    it('should accept limit at boundary (1)', () => {
      const data = {
        limit: '1',
      };

      const result = getCollectionsQuerySchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(1);
      }
    });
  });

  describe('featureCollectionSchema', () => {
    it('should validate featuring a collection', () => {
      const data = {
        isFeatured: true,
      };

      const result = featureCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate unfeaturing a collection', () => {
      const data = {
        isFeatured: false,
      };

      const result = featureCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean value', () => {
      const data = {
        isFeatured: 'true',
      };

      const result = featureCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing isFeatured', () => {
      const data = {};

      const result = featureCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('templateCollectionSchema', () => {
    it('should validate making collection a template', () => {
      const data = {
        isTemplate: true,
      };

      const result = templateCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate removing template status', () => {
      const data = {
        isTemplate: false,
      };

      const result = templateCollectionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject non-boolean value', () => {
      const data = {
        isTemplate: 'false',
      };

      const result = templateCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing isTemplate', () => {
      const data = {};

      const result = templateCollectionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});