import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { categoriesRepository } from './categories.repository';
import type { Category } from '@/types';

vi.mock('@/db', () => {
  const whereMock = vi.fn().mockResolvedValue([{ count: 0 }]);
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  const selectMock = vi.fn(() => ({ from: fromMock }));
  return {
    db: {
      query: {
        categories: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
        },
      },
      select: selectMock,
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  asc: vi.fn((column) => ({ column, type: 'asc' })),
  sql: Object.assign(
    vi.fn((template) => ({ template, type: 'sql' })),
    { raw: vi.fn((value) => ({ value, type: 'raw' })) }
  ),
  count: vi.fn(() => ({ fn: 'count' })),
  relations: vi.fn(() => ({})),
}));

import { db } from '@/db';
import { eq, asc, count, sql } from 'drizzle-orm';

describe('CategoriesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllOrdered', () => {
    it('should return all categories ordered by display order and name', async () => {
      const mockCategories: Category[] = [
        {
          id: 'cat-2',
          slug: 'second',
          name: 'Second Category',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-1',
          slug: 'first',
          name: 'First Category',
          displayOrder: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-3',
          slug: 'third',
          name: 'Third Category',
          displayOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.query.categories.findMany as Mock).mockResolvedValue(mockCategories);

      const result = await categoriesRepository.findAllOrdered();

      expect(result).toEqual(mockCategories);
      expect(db.query.categories.findMany).toHaveBeenCalledWith({
        orderBy: expect.any(Array),
      });
    });

    it('should return empty array when no categories exist', async () => {
      (db.query.categories.findMany as Mock).mockResolvedValue([]);

      const result = await categoriesRepository.findAllOrdered();

      expect(result).toEqual([]);
    });
  });

  describe('findBySlug', () => {
    it('should find category by slug', async () => {
      const mockCategory: Category = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);

      const result = await categoriesRepository.findBySlug('test-category');

      expect(result).toEqual(mockCategory);
      expect(db.query.categories.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'eq',
            value: 'test-category',
          }),
        })
      );
    });

    it('should return undefined when category not found', async () => {
      (db.query.categories.findFirst as Mock).mockResolvedValue(undefined);

      const result = await categoriesRepository.findBySlug('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('findByIdWithApps', () => {
    it('should find category with apps', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        apps: [
          {
            id: 'app-1',
            slug: 'app-1',
            displayName: 'App 1',
            isPopular: true,
            isFoss: true,
            categoryId: 'cat-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);

      const result = await categoriesRepository.findByIdWithApps('cat-1');

      expect(result).toEqual(mockCategory);
    });

    it('should return undefined when category not found', async () => {
      (db.query.categories.findFirst as Mock).mockResolvedValue(undefined);

      const result = await categoriesRepository.findByIdWithApps('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('hasApps', () => {
    it('should return true when category has apps', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        apps: [
          {
            id: 'app-1',
            slug: 'app-1',
            displayName: 'App 1',
            isPopular: true,
            isFoss: true,
            categoryId: 'cat-1',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);

      const result = await categoriesRepository.hasApps('cat-1');

      expect(result).toBe(true);
    });

    it('should return false when category has no apps', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        apps: [],
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);

      const result = await categoriesRepository.hasApps('cat-1');

      expect(result).toBe(false);
    });

    it('should return false when category not found', async () => {
      (db.query.categories.findFirst as Mock).mockResolvedValue(undefined);

      const result = await categoriesRepository.hasApps('non-existent');

      expect(result).toBe(false);
    });

    it('should handle category without apps property', async () => {
      const mockCategory = {
        id: 'cat-1',
        slug: 'test-category',
        name: 'Test Category',
        displayOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.categories.findFirst as Mock).mockResolvedValue(mockCategory);

      const result = await categoriesRepository.hasApps('cat-1');

      expect(result).toBe(false);
    });
  });
});
