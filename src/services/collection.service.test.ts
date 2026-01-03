import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionById,
  getCollectionBySlug,
  getCollectionByShareToken,
  listCollections,
  generateShareToken,
  addItemToCollection,
  removeItemFromCollection,
  toggleLike,
  cloneCollection,
  incrementViewCount,
  incrementInstallCount,
  type CreateCollectionData,
  type UpdateCollectionData,
  type ListCollectionsOptions,
} from './collection.service';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
    query: {
      collections: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      collectionLikes: {
        findFirst: vi.fn(),
      },
    },
  },
}));

// Mock schema
vi.mock('@/db/schema', () => ({
  collections: {
    id: 'id',
    userId: 'userId',
    name: 'name',
    slug: 'slug',
    isPublic: 'isPublic',
    isFeatured: 'isFeatured',
    shareToken: 'shareToken',
    viewCount: 'viewCount',
    installCount: 'installCount',
    description: 'description',
  },
  collectionItems: {
    id: 'id',
    collectionId: 'collectionId',
    appId: 'appId',
    displayOrder: 'displayOrder',
  },
  collectionLikes: {
    id: 'id',
    collectionId: 'collectionId',
    userId: 'userId',
  },
}));

// Mock createId from cuid2
vi.mock('@paralleldrive/cuid2', () => ({
  createId: vi.fn(() => 'test-id-' + Math.random().toString(36).substring(7)),
}));

import { db } from '@/db';
import { createId } from '@paralleldrive/cuid2';

describe('Collection Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCollection', () => {
    it('should create a collection with apps', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'Web Dev Tools',
        description: 'Essential tools for web development',
        slug: 'web-dev-tools-user-1',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: ['development', 'web'],
        iconUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertMock = vi.fn().mockResolvedValue([mockCollection]);
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: insertMock,
        }),
      });

      const data: CreateCollectionData = {
        userId: 'user-1',
        name: 'Web Dev Tools',
        description: 'Essential tools for web development',
        isPublic: false,
        tags: ['development', 'web'],
        appIds: ['app-1', 'app-2'],
      };

      const result = await createCollection(data);

      expect(result).toBeDefined();
      expect(result.name).toBe('Web Dev Tools');
      expect(db.insert).toHaveBeenCalledTimes(2); // Once for collection, once for items
    });

    it('should create a public collection', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'Popular Apps',
        slug: 'popular-apps-user-1',
        isPublic: true,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertMock = vi.fn().mockResolvedValue([mockCollection]);
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: insertMock,
        }),
      });

      const data: CreateCollectionData = {
        userId: 'user-1',
        name: 'Popular Apps',
        isPublic: true,
        appIds: ['app-1'],
      };

      const result = await createCollection(data);

      expect(result.isPublic).toBe(true);
    });

    it('should handle collections with no description', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'My Collection',
        slug: 'my-collection-user-1',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertMock = vi.fn().mockResolvedValue([mockCollection]);
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: insertMock,
        }),
      });

      const data: CreateCollectionData = {
        userId: 'user-1',
        name: 'My Collection',
        appIds: ['app-1'],
      };

      const result = await createCollection(data);

      expect(result.description).toBeNull();
    });
  });

  describe('updateCollection', () => {
    it('should update collection metadata', async () => {
      const mockUpdated = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'Updated Name',
        description: 'Updated description',
        slug: 'web-dev-tools-user-1',
        isPublic: true,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: ['updated'],
        iconUrl: 'https://example.com/icon.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateMock = vi.fn().mockResolvedValue([mockUpdated]);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: updateMock,
          }),
        }),
      });

      const data: UpdateCollectionData = {
        name: 'Updated Name',
        description: 'Updated description',
        isPublic: true,
        tags: ['updated'],
        iconUrl: 'https://example.com/icon.png',
      };

      const result = await updateCollection('coll-123', data);

      expect(result).toBeDefined();
      expect(result.name).toBe('Updated Name');
      expect(result.isPublic).toBe(true);
    });

    it('should update collection apps when appIds provided', async () => {
      const mockUpdated = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'My Collection',
        slug: 'my-collection-user-1',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateMock = vi.fn().mockResolvedValue([mockUpdated]);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: updateMock,
          }),
        }),
      });

      const deleteMock = vi.fn().mockResolvedValue(undefined);
      (db.delete as Mock).mockReturnValue({
        where: deleteMock,
      });

      const insertMock = vi.fn().mockResolvedValue(undefined);
      (db.insert as Mock).mockReturnValue({
        values: insertMock,
      });

      const data: UpdateCollectionData = {
        appIds: ['app-1', 'app-2', 'app-3'],
      };

      const result = await updateCollection('coll-123', data);

      expect(result).toBeDefined();
      expect(db.delete).toHaveBeenCalled(); // Delete old items
      expect(db.insert).toHaveBeenCalled(); // Insert new items
    });

    it('should throw error if collection not found', async () => {
      const updateMock = vi.fn().mockResolvedValue([]);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: updateMock,
          }),
        }),
      });

      await expect(
        updateCollection('non-existent', { name: 'Test' })
      ).rejects.toThrow('Collection not found');
    });
  });

  describe('deleteCollection', () => {
    it('should delete a collection', async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      (db.delete as Mock).mockReturnValue({
        where: deleteMock,
      });

      await deleteCollection('coll-123');

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('getCollectionById', () => {
    it('should return collection for authenticated owner', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'My Collection',
        description: 'Test description',
        slug: 'my-collection',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 5,
        installCount: 2,
        tags: ['test'],
        iconUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'Test User',
          image: null,
        },
        items: [],
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockCollection);

      const selectMock = vi.fn().mockResolvedValue([{ count: 3 }]);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const result = await getCollectionById('coll-123', 'user-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('coll-123');
      expect(result?._count?.likes).toBe(3);
    });

    it('should return public collection for unauthenticated user', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'Public Collection',
        slug: 'public-collection',
        isPublic: true,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 10,
        installCount: 5,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'Test User',
          image: null,
        },
        items: [],
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockCollection);

      const selectMock = vi.fn().mockResolvedValue([{ count: 0 }]);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const result = await getCollectionById('coll-123');

      expect(result).toBeDefined();
      expect(result?.isPublic).toBe(true);
    });

    it('should return null if collection not found', async () => {
      (db.query.collections.findFirst as Mock).mockResolvedValue(null);

      const result = await getCollectionById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCollectionBySlug', () => {
    it('should return collection by slug', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'My Collection',
        slug: 'my-collection',
        isPublic: true,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'Test User',
          image: null,
        },
        items: [],
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockCollection);

      const selectMock = vi.fn().mockResolvedValue([{ count: 0 }]);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const result = await getCollectionBySlug('my-collection');

      expect(result).toBeDefined();
      expect(result?.slug).toBe('my-collection');
    });

    it('should return null if not found', async () => {
      (db.query.collections.findFirst as Mock).mockResolvedValue(null);

      const result = await getCollectionBySlug('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getCollectionByShareToken', () => {
    it('should return collection and increment view count', async () => {
      const mockCollection = {
        id: 'coll-123',
        userId: 'user-1',
        name: 'Shared Collection',
        slug: 'shared-collection',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: 'abc123',
        viewCount: 5,
        installCount: 0,
        tags: null,
        iconUrl: null,
        description: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'Test User',
          image: null,
        },
        items: [],
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockCollection);

      const selectMock = vi.fn().mockResolvedValue([{ count: 2 }]);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const updateMock = vi.fn().mockResolvedValue(undefined);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: updateMock,
        }),
      });

      const result = await getCollectionByShareToken('abc123');

      expect(result).toBeDefined();
      expect(result?.shareToken).toBe('abc123');
      expect(db.update).toHaveBeenCalled(); // View count incremented
    });

    it('should return null if token not found', async () => {
      (db.query.collections.findFirst as Mock).mockResolvedValue(null);

      const result = await getCollectionByShareToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('listCollections', () => {
    it('should list collections with filters', async () => {
      const mockCollections = [
        {
          id: 'coll-1',
          userId: 'user-1',
          name: 'Collection 1',
          slug: 'collection-1',
          isPublic: true,
          isFeatured: false,
          isTemplate: false,
          shareToken: null,
          viewCount: 10,
          installCount: 5,
          tags: null,
          iconUrl: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            name: 'User 1',
            image: null,
          },
          items: [],
        },
        {
          id: 'coll-2',
          userId: 'user-1',
          name: 'Collection 2',
          slug: 'collection-2',
          isPublic: true,
          isFeatured: true,
          isTemplate: false,
          shareToken: null,
          viewCount: 20,
          installCount: 10,
          tags: null,
          iconUrl: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            name: 'User 1',
            image: null,
          },
          items: [],
        },
      ];

      (db.query.collections.findMany as Mock).mockResolvedValue(mockCollections);

      const selectMock = vi.fn()
        .mockResolvedValueOnce([{ count: 2 }]) // Total count
        .mockResolvedValueOnce([{ count: 5 }]) // Like count for coll-1
        .mockResolvedValueOnce([{ count: 10 }]); // Like count for coll-2

      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const options: ListCollectionsOptions = {
        isPublic: true,
        limit: 10,
        offset: 0,
      };

      const result = await listCollections(options);

      expect(result.collections).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by featured flag', async () => {
      const mockCollections = [
        {
          id: 'coll-1',
          userId: 'user-1',
          name: 'Featured Collection',
          slug: 'featured-collection',
          isPublic: true,
          isFeatured: true,
          isTemplate: false,
          shareToken: null,
          viewCount: 100,
          installCount: 50,
          tags: null,
          iconUrl: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            name: 'User 1',
            image: null,
          },
          items: [],
        },
      ];

      (db.query.collections.findMany as Mock).mockResolvedValue(mockCollections);

      const selectMock = vi.fn()
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 15 }]);

      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const options: ListCollectionsOptions = {
        featured: true,
        limit: 10,
        offset: 0,
      };

      const result = await listCollections(options);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].isFeatured).toBe(true);
    });

    it('should filter by user ID', async () => {
      const mockCollections = [
        {
          id: 'coll-1',
          userId: 'user-1',
          name: 'User Collection',
          slug: 'user-collection',
          isPublic: false,
          isFeatured: false,
          isTemplate: false,
          shareToken: null,
          viewCount: 0,
          installCount: 0,
          tags: null,
          iconUrl: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 'user-1',
            name: 'User 1',
            image: null,
          },
          items: [],
        },
      ];

      (db.query.collections.findMany as Mock).mockResolvedValue(mockCollections);

      const selectMock = vi.fn()
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([{ count: 0 }]);

      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const options: ListCollectionsOptions = {
        userId: 'user-1',
        limit: 10,
        offset: 0,
      };

      const result = await listCollections(options);

      expect(result.collections).toHaveLength(1);
      expect(result.collections[0].userId).toBe('user-1');
    });
  });

  describe('generateShareToken', () => {
    it('should generate and save a share token', async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: updateMock,
        }),
      });

      const token = await generateShareToken('coll-123');

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('addItemToCollection', () => {
    it('should add item to collection', async () => {
      const selectMock = vi.fn().mockResolvedValue([{ max: 2 }]);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const insertMock = vi.fn().mockResolvedValue(undefined);
      (db.insert as Mock).mockReturnValue({
        values: insertMock,
      });

      await addItemToCollection('coll-123', 'app-1', 'Great app');

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle first item in collection', async () => {
      const selectMock = vi.fn().mockResolvedValue([{ max: null }]);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const insertMock = vi.fn().mockResolvedValue(undefined);
      (db.insert as Mock).mockReturnValue({
        values: insertMock,
      });

      await addItemToCollection('coll-123', 'app-1');

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('removeItemFromCollection', () => {
    it('should remove item from collection', async () => {
      const deleteMock = vi.fn().mockResolvedValue(undefined);
      (db.delete as Mock).mockReturnValue({
        where: deleteMock,
      });

      await removeItemFromCollection('item-1');

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('toggleLike', () => {
    it('should like a collection when not already liked', async () => {
      (db.query.collectionLikes.findFirst as Mock).mockResolvedValue(null);

      const insertMock = vi.fn().mockResolvedValue(undefined);
      (db.insert as Mock).mockReturnValue({
        values: insertMock,
      });

      const result = await toggleLike('coll-123', 'user-1');

      expect(result.liked).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should unlike a collection when already liked', async () => {
      (db.query.collectionLikes.findFirst as Mock).mockResolvedValue({
        id: 'like-1',
        collectionId: 'coll-123',
        userId: 'user-1',
        createdAt: new Date(),
      });

      const deleteMock = vi.fn().mockResolvedValue(undefined);
      (db.delete as Mock).mockReturnValue({
        where: deleteMock,
      });

      const result = await toggleLike('coll-123', 'user-1');

      expect(result.liked).toBe(false);
      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('cloneCollection', () => {
    it('should clone a collection', async () => {
      const mockOriginal = {
        id: 'coll-original',
        userId: 'user-1',
        name: 'Original Collection',
        description: 'Original description',
        slug: 'original-collection',
        isPublic: true,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 10,
        installCount: 5,
        tags: ['test'],
        iconUrl: 'https://example.com/icon.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          id: 'user-1',
          name: 'User 1',
          image: null,
        },
        items: [
          { appId: 'app-1', id: 'item-1', collectionId: 'coll-original', displayOrder: 0, note: null, createdAt: new Date() },
          { appId: 'app-2', id: 'item-2', collectionId: 'coll-original', displayOrder: 1, note: null, createdAt: new Date() },
        ],
        _count: { likes: 5 },
      };

      (db.query.collections.findFirst as Mock).mockResolvedValue(mockOriginal);

      const selectMock = vi.fn().mockResolvedValue([{ count: 5 }]);
      (db.select as Mock).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: selectMock,
        }),
      });

      const mockCloned = {
        id: 'coll-cloned',
        userId: 'user-2',
        name: 'Original Collection (Copy)',
        description: 'Original description',
        slug: 'original-collection-copy-user-2',
        isPublic: false,
        isFeatured: false,
        isTemplate: false,
        shareToken: null,
        viewCount: 0,
        installCount: 0,
        tags: ['test'],
        iconUrl: 'https://example.com/icon.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const insertMock = vi.fn().mockResolvedValue([mockCloned]);
      (db.insert as Mock).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: insertMock,
        }),
      });

      const result = await cloneCollection('coll-original', 'user-2');

      expect(result).toBeDefined();
      expect(result.name).toContain('(Copy)');
      expect(result.isPublic).toBe(false); // Clones are private by default
    });

    it('should throw error if original collection not found', async () => {
      (db.query.collections.findFirst as Mock).mockResolvedValue(null);

      await expect(cloneCollection('non-existent', 'user-2')).rejects.toThrow(
        'Collection not found'
      );
    });
  });

  describe('incrementViewCount', () => {
    it('should increment view count', async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: updateMock,
        }),
      });

      await incrementViewCount('coll-123');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('incrementInstallCount', () => {
    it('should increment install count', async () => {
      const updateMock = vi.fn().mockResolvedValue(undefined);
      (db.update as Mock).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: updateMock,
        }),
      });

      await incrementInstallCount('coll-123');

      expect(db.update).toHaveBeenCalled();
    });
  });
});