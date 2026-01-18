import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { sourcesRepository } from './sources.repository';
import type { Source } from '@/types';

vi.mock('@/db', () => {
  const whereMock = vi.fn().mockResolvedValue([{ count: 0 }]);
  const fromMock = vi.fn().mockReturnValue({ where: whereMock });
  const selectMock = vi.fn(() => ({ from: fromMock }));
  return {
    db: {
      query: {
        sources: {
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
  desc: vi.fn((column) => ({ column, type: 'desc' })),
  isNotNull: vi.fn((column) => ({ column, type: 'isNotNull' })),
  sql: Object.assign(
    vi.fn((template) => ({ template, type: 'sql' })),
    { raw: vi.fn((value) => ({ value, type: 'raw' })) }
  ),
  count: vi.fn(() => ({ fn: 'count' })),
  relations: vi.fn(() => ({})),
}));

import { db } from '@/db';
import { eq, desc, isNotNull, count, sql } from 'drizzle-orm';

describe('SourcesRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findAllOrdered', () => {
    it('should return all sources ordered by priority and name', async () => {
      const mockSources: Source[] = [
        {
          id: 'src-2',
          slug: 'second',
          name: 'Second Source',
          iconUrl: 'https://example.com/icon2.png',
          apiEndpoint: 'https://api.example.com',
          priority: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'src-1',
          slug: 'first',
          name: 'First Source',
          iconUrl: 'https://example.com/icon1.png',
          apiEndpoint: 'https://api.example.com',
          priority: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.query.sources.findMany as Mock).mockResolvedValue(mockSources);

      const result = await sourcesRepository.findAllOrdered();

      expect(result).toEqual(mockSources);
      expect(db.query.sources.findMany).toHaveBeenCalledWith({
        orderBy: expect.any(Array),
      });
    });

    it('should return empty array when no sources exist', async () => {
      (db.query.sources.findMany as Mock).mockResolvedValue([]);

      const result = await sourcesRepository.findAllOrdered();

      expect(result).toEqual([]);
    });
  });

  describe('findBySlug', () => {
    it('should find source by slug', async () => {
      const mockSource: Source = {
        id: 'src-1',
        slug: 'test-source',
        name: 'Test Source',
        iconUrl: 'https://example.com/icon.png',
        apiEndpoint: 'https://api.example.com',
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.sources.findFirst as Mock).mockResolvedValue(mockSource);

      const result = await sourcesRepository.findBySlug('test-source');

      expect(result).toEqual(mockSource);
      expect(db.query.sources.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'eq',
            value: 'test-source',
          }),
        })
      );
    });

    it('should return undefined when source not found', async () => {
      (db.query.sources.findFirst as Mock).mockResolvedValue(undefined);

      const result = await sourcesRepository.findBySlug('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('findByIdWithPackages', () => {
    it('should find source with packages', async () => {
      const mockSource = {
        id: 'src-1',
        slug: 'test-source',
        name: 'Test Source',
        iconUrl: 'https://example.com/icon.png',
        apiEndpoint: 'https://api.example.com',
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        packages: [
          {
            id: 'pkg-1',
            appId: 'app-1',
            sourceId: 'src-1',
            identifier: 'test-pkg',
            version: '1.0.0',
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (db.query.sources.findFirst as Mock).mockResolvedValue(mockSource);

      const result = await sourcesRepository.findByIdWithPackages('src-1');

      expect(result).toEqual(mockSource);
    });

    it('should return undefined when source not found', async () => {
      (db.query.sources.findFirst as Mock).mockResolvedValue(undefined);

      const result = await sourcesRepository.findByIdWithPackages('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('hasPackages', () => {
    it('should return true when source has packages', async () => {
      const mockSource = {
        id: 'src-1',
        slug: 'test-source',
        name: 'Test Source',
        iconUrl: 'https://example.com/icon.png',
        apiEndpoint: 'https://api.example.com',
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        packages: [
          {
            id: 'pkg-1',
            appId: 'app-1',
            sourceId: 'src-1',
            identifier: 'test-pkg',
            version: '1.0.0',
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      (db.query.sources.findFirst as Mock).mockResolvedValue(mockSource);

      const result = await sourcesRepository.hasPackages('src-1');

      expect(result).toBe(true);
    });

    it('should return false when source has no packages', async () => {
      const mockSource = {
        id: 'src-1',
        slug: 'test-source',
        name: 'Test Source',
        iconUrl: 'https://example.com/icon.png',
        apiEndpoint: 'https://api.example.com',
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        packages: [],
      };

      (db.query.sources.findFirst as Mock).mockResolvedValue(mockSource);

      const result = await sourcesRepository.hasPackages('src-1');

      expect(result).toBe(false);
    });

    it('should return false when source not found', async () => {
      (db.query.sources.findFirst as Mock).mockResolvedValue(undefined);

      const result = await sourcesRepository.hasPackages('non-existent');

      expect(result).toBe(false);
    });

    it('should handle source without packages property', async () => {
      const mockSource = {
        id: 'src-1',
        slug: 'test-source',
        name: 'Test Source',
        iconUrl: 'https://example.com/icon.png',
        apiEndpoint: 'https://api.example.com',
        priority: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.query.sources.findFirst as Mock).mockResolvedValue(mockSource);

      const result = await sourcesRepository.hasPackages('src-1');

      expect(result).toBe(false);
    });
  });

  describe('findWithApiEndpoints', () => {
    it('should return sources with API endpoints', async () => {
      const mockSources: Source[] = [
        {
          id: 'src-1',
          slug: 'test-source-1',
          name: 'Test Source 1',
          iconUrl: 'https://example.com/icon1.png',
          apiEndpoint: 'https://api.example.com',
          priority: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'src-2',
          slug: 'test-source-2',
          name: 'Test Source 2',
          iconUrl: 'https://example.com/icon2.png',
          apiEndpoint: 'https://api2.example.com',
          priority: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (db.query.sources.findMany as Mock).mockResolvedValue(mockSources);

      const result = await sourcesRepository.findWithApiEndpoints();

      expect(result).toEqual(mockSources);
      expect(db.query.sources.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'isNotNull',
          }),
        })
      );
    });

    it('should return empty array when no sources have API endpoints', async () => {
      (db.query.sources.findMany as Mock).mockResolvedValue([]);

      const result = await sourcesRepository.findWithApiEndpoints();

      expect(result).toEqual([]);
    });
  });
});
