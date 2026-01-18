import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { appsRepository } from './apps.repository';
import type { AppWithRelations } from '../types';

vi.mock('@/db', () => {
  let mockCountResult = [{ count: 0 }];

  const whereMock = vi.fn().mockImplementation(() => Promise.resolve(mockCountResult));
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  const selectMock = vi.fn(() => ({ from: fromMock }));

  return {
    db: {
      query: {
        apps: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
        categories: {
          findFirst: vi.fn(),
        },
      },
      select: selectMock,
      __setMockCountResult: (result: typeof mockCountResult) => {
        mockCountResult = result;
      },
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  and: vi.fn((...args) => ({ args, type: 'and' })),
  or: vi.fn((...args) => ({ args, type: 'or' })),
  like: vi.fn((column, value) => ({ column, value, type: 'like' })),
  ne: vi.fn((column, value) => ({ column, value, type: 'ne' })),
  sql: Object.assign(
    vi.fn((template) => ({ template, type: 'sql' })),
    { raw: vi.fn((value) => ({ value, type: 'raw' })) }
  ),
  count: vi.fn(),
  desc: vi.fn((column) => ({ column, type: 'desc' })),
  asc: vi.fn((column) => ({ column, type: 'asc' })),
  relations: vi.fn(() => ({})),
}));

import { db } from '@/db';

describe('AppsRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findWithFilters', () => {
    const mockApp: AppWithRelations = {
      id: 'app-1',
      slug: 'test-app',
      displayName: 'Test App',
      description: 'A test application',
      iconUrl: 'https://example.com/icon.png',
      isPopular: true,
      isFoss: true,
      categoryId: 'cat-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      packages: [],
    };

    it('should find apps with category filter by slug', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);
      (db.query.apps.findMany as Mock).mockResolvedValue([mockApp]);

      const result = await appsRepository.findWithFilters({ category: 'test-category' });

      expect(result).toEqual([mockApp]);
      expect(db.query.categories.findFirst).toHaveBeenCalled();
      expect(db.query.apps.findMany).toHaveBeenCalled();
    });

    it('should find apps with category filter by ID', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);
      (db.query.apps.findMany as Mock).mockResolvedValue([mockApp]);

      const result = await appsRepository.findWithFilters({ category: 'cat-1' });

      expect(result).toEqual([mockApp]);
      expect(db.query.categories.findFirst).toHaveBeenCalled();
      expect(db.query.apps.findMany).toHaveBeenCalled();
    });

    it('should find apps with popular filter', async () => {
      (db.query.apps.findMany as Mock).mockResolvedValue([mockApp]);

      const result = await appsRepository.findWithFilters({ popular: true });

      expect(result).toEqual([mockApp]);
    });

    it('should find apps with search filter', async () => {
      (db.query.apps.findMany as Mock).mockResolvedValue([mockApp]);

      const result = await appsRepository.findWithFilters({ search: 'test' });

      expect(result).toEqual([mockApp]);
    });

    it('should find apps with limit and offset', async () => {
      (db.query.apps.findMany as Mock).mockResolvedValue([mockApp]);

      const result = await appsRepository.findWithFilters({ limit: 10, offset: 5 });

      expect(result).toEqual([mockApp]);
    });

    it('should find apps with all filters', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);
      (db.query.apps.findMany as Mock).mockResolvedValue([mockApp]);

      const result = await appsRepository.findWithFilters({
        category: 'test-category',
        popular: true,
        search: 'test',
        limit: 20,
        offset: 0,
      });

      expect(result).toEqual([mockApp]);
    });

    it('should return empty array when category not found', async () => {
      (db.query.categories.findFirst as Mock).mockResolvedValue(null);
      (db.query.apps.findMany as Mock).mockResolvedValue([]);

      const result = await appsRepository.findWithFilters({ category: 'non-existent' });

      expect(result).toEqual([]);
    });

    it('should use default limit and offset when not provided', async () => {
      (db.query.apps.findMany as Mock).mockResolvedValue([]);

      await appsRepository.findWithFilters({});

      expect(db.query.apps.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
          offset: 0,
        })
      );
    });
  });

  describe('findBySlug', () => {
    it('should find app by slug with relations', async () => {
      const mockApp: AppWithRelations = {
        id: 'app-1',
        slug: 'test-app',
        displayName: 'Test App',
        description: 'A test application',
        iconUrl: 'https://example.com/icon.png',
        isPopular: true,
        isFoss: true,
        categoryId: 'cat-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'cat-1',
          slug: 'test-category',
          name: 'Test Category',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        packages: [],
      };

      (db.query.apps.findFirst as Mock).mockResolvedValue(mockApp);

      const result = await appsRepository.findBySlug('test-app');

      expect(result).toEqual(mockApp);
      expect(db.query.apps.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          with: expect.objectContaining({
            category: true,
            packages: expect.objectContaining({
              with: expect.objectContaining({
                source: true,
              }),
            }),
          }),
        })
      );
    });

    it('should return undefined when app not found', async () => {
      (db.query.apps.findFirst as Mock).mockResolvedValue(undefined);

      const result = await appsRepository.findBySlug('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('findByIdWithRelations', () => {
    it('should find app by ID with relations', async () => {
      const mockApp: AppWithRelations = {
        id: 'app-1',
        slug: 'test-app',
        displayName: 'Test App',
        description: 'A test application',
        iconUrl: 'https://example.com/icon.png',
        isPopular: true,
        isFoss: true,
        categoryId: 'cat-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        category: {
          id: 'cat-1',
          slug: 'test-category',
          name: 'Test Category',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        packages: [],
      };

      (db.query.apps.findFirst as Mock).mockResolvedValue(mockApp);

      const result = await appsRepository.findByIdWithRelations('app-1');

      expect(result).toEqual(mockApp);
    });

    it('should return undefined when ID not found', async () => {
      (db.query.apps.findFirst as Mock).mockResolvedValue(undefined);

      const result = await appsRepository.findByIdWithRelations('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('isSlugAvailable', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return true when slug is available', async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 0 }]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      (db.select as Mock).mockReturnValue({ from: fromMock });

      const result = await appsRepository.isSlugAvailable('new-app');

      expect(result).toBe(true);
    });

    it('should return false when slug is taken', async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 1 }]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      (db.select as Mock).mockReturnValue({ from: fromMock });

      const result = await appsRepository.isSlugAvailable('existing-app');

      expect(result).toBe(false);
    });

    it('should exclude specific ID when checking availability', async () => {
      const whereMock = vi.fn().mockResolvedValue([{ count: 0 }]);
      const fromMock = vi.fn().mockReturnValue({ where: whereMock });
      (db.select as Mock).mockReturnValue({ from: fromMock });

      const result = await appsRepository.isSlugAvailable('test-app', 'app-1');

      expect(result).toBe(true);
    });
  });
});
