import { describe, it, expect } from 'vitest';
import {
  idParamSchema,
  slugParamSchema,
  paginationSchema,
  sortSchema,
  searchSchema,
} from './common.schema';
import { ZodError } from 'zod';

describe('common validation schemas', () => {
  describe('idParamSchema', () => {
    it('should validate valid id', () => {
      const result = idParamSchema.parse({ id: 'test-123' });
      expect(result).toEqual({ id: 'test-123' });
    });

    it('should accept various id formats', () => {
      const ids = [
        'abc-123',
        'cuid-123456789',
        'uuid-format',
        '12345',
        'test_id',
        'mixed-ID_123',
      ];

      ids.forEach((id) => {
        const result = idParamSchema.parse({ id });
        expect(result.id).toBe(id);
      });
    });

    it('should require id field', () => {
      expect(() => idParamSchema.parse({})).toThrow(ZodError);
    });

    it('should reject empty id', () => {
      expect(() => idParamSchema.parse({ id: '' })).toThrow(ZodError);
    });

    it('should reject non-string id', () => {
      expect(() => idParamSchema.parse({ id: 123 as any })).toThrow(ZodError);
      expect(() => idParamSchema.parse({ id: null as any })).toThrow(ZodError);
      expect(() => idParamSchema.parse({ id: undefined as any })).toThrow(ZodError);
    });

    it('should accept long ids', () => {
      const longId = 'a'.repeat(200);
      const result = idParamSchema.parse({ id: longId });
      expect(result.id).toBe(longId);
    });
  });

  describe('slugParamSchema', () => {
    it('should validate valid slug', () => {
      const result = slugParamSchema.parse({ slug: 'my-app' });
      expect(result).toEqual({ slug: 'my-app' });
    });

    it('should accept various slug formats', () => {
      const slugs = [
        'firefox',
        'visual-studio-code',
        'app123',
        'my-app-2024',
        'simple',
        'multi-word-slug',
      ];

      slugs.forEach((slug) => {
        const result = slugParamSchema.parse({ slug });
        expect(result.slug).toBe(slug);
      });
    });

    it('should require slug field', () => {
      expect(() => slugParamSchema.parse({})).toThrow(ZodError);
    });

    it('should reject empty slug', () => {
      expect(() => slugParamSchema.parse({ slug: '' })).toThrow(ZodError);
    });

    it('should reject non-string slug', () => {
      expect(() => slugParamSchema.parse({ slug: 123 as any })).toThrow(ZodError);
      expect(() => slugParamSchema.parse({ slug: null as any })).toThrow(ZodError);
      expect(() => slugParamSchema.parse({ slug: undefined as any })).toThrow(ZodError);
    });

    it('should accept slugs with uppercase (no validation on format)', () => {
      // Note: This schema doesn't enforce lowercase like appSlugSchema
      const result = slugParamSchema.parse({ slug: 'Firefox' });
      expect(result.slug).toBe('Firefox');
    });
  });

  describe('paginationSchema', () => {
    it('should use default values when not provided', () => {
      const result = paginationSchema.parse({});
      expect(result).toEqual({
        limit: 50,
        offset: 0,
      });
    });

    it('should validate with custom limit and offset', () => {
      const result = paginationSchema.parse({ limit: '25', offset: '100' });
      expect(result).toEqual({
        limit: 25,
        offset: 100,
      });
    });

    describe('limit validation', () => {
      it('should transform string limit to number', () => {
        const result = paginationSchema.parse({ limit: '10' });
        expect(result.limit).toBe(10);
        expect(typeof result.limit).toBe('number');
      });

      it('should accept valid limit values', () => {
        const limits = ['1', '10', '50', '100'];
        limits.forEach((limit) => {
          const result = paginationSchema.parse({ limit });
          expect(result.limit).toBe(parseInt(limit, 10));
        });
      });

      it('should default to 50 when limit is not provided', () => {
        const result = paginationSchema.parse({});
        expect(result.limit).toBe(50);
      });

      it('should reject limit less than 1', () => {
        expect(() => paginationSchema.parse({ limit: '0' })).toThrow(ZodError);
        expect(() => paginationSchema.parse({ limit: '-1' })).toThrow(ZodError);
      });

      it('should reject limit greater than 100', () => {
        expect(() => paginationSchema.parse({ limit: '101' })).toThrow(ZodError);
        expect(() => paginationSchema.parse({ limit: '1000' })).toThrow(ZodError);
      });

      it('should accept limit of exactly 1', () => {
        const result = paginationSchema.parse({ limit: '1' });
        expect(result.limit).toBe(1);
      });

      it('should accept limit of exactly 100', () => {
        const result = paginationSchema.parse({ limit: '100' });
        expect(result.limit).toBe(100);
      });

      it('should reject non-numeric limit', () => {
        expect(() => paginationSchema.parse({ limit: 'abc' })).toThrow(ZodError);
        expect(() => paginationSchema.parse({ limit: 'ten' })).toThrow(ZodError);
      });
    });

    describe('offset validation', () => {
      it('should transform string offset to number', () => {
        const result = paginationSchema.parse({ offset: '50' });
        expect(result.offset).toBe(50);
        expect(typeof result.offset).toBe('number');
      });

      it('should accept valid offset values', () => {
        const offsets = ['0', '10', '100', '1000'];
        offsets.forEach((offset) => {
          const result = paginationSchema.parse({ offset });
          expect(result.offset).toBe(parseInt(offset, 10));
        });
      });

      it('should default to 0 when offset is not provided', () => {
        const result = paginationSchema.parse({});
        expect(result.offset).toBe(0);
      });

      it('should reject negative offset', () => {
        expect(() => paginationSchema.parse({ offset: '-1' })).toThrow(ZodError);
        expect(() => paginationSchema.parse({ offset: '-100' })).toThrow(ZodError);
      });

      it('should accept offset of 0', () => {
        const result = paginationSchema.parse({ offset: '0' });
        expect(result.offset).toBe(0);
      });

      it('should accept large offset values', () => {
        const result = paginationSchema.parse({ offset: '999999' });
        expect(result.offset).toBe(999999);
      });

      it('should reject non-numeric offset', () => {
        expect(() => paginationSchema.parse({ offset: 'abc' })).toThrow(ZodError);
        expect(() => paginationSchema.parse({ offset: 'zero' })).toThrow(ZodError);
      });
    });

    it('should validate both limit and offset together', () => {
      const result = paginationSchema.parse({ limit: '20', offset: '40' });
      expect(result).toEqual({
        limit: 20,
        offset: 40,
      });
    });

    it('should handle pagination for page 1', () => {
      const result = paginationSchema.parse({ limit: '10', offset: '0' });
      expect(result).toEqual({
        limit: 10,
        offset: 0,
      });
    });

    it('should handle pagination for page 2', () => {
      const result = paginationSchema.parse({ limit: '10', offset: '10' });
      expect(result).toEqual({
        limit: 10,
        offset: 10,
      });
    });
  });

  describe('sortSchema', () => {
    it('should use default sortOrder when not provided', () => {
      const result = sortSchema.parse({});
      expect(result).toEqual({
        sortOrder: 'asc',
      });
    });

    it('should validate with sortBy and sortOrder', () => {
      const result = sortSchema.parse({ sortBy: 'name', sortOrder: 'desc' });
      expect(result).toEqual({
        sortBy: 'name',
        sortOrder: 'desc',
      });
    });

    describe('sortBy validation', () => {
      it('should accept valid sortBy field names', () => {
        const fields = ['name', 'createdAt', 'updatedAt', 'priority', 'displayOrder'];
        fields.forEach((sortBy) => {
          const result = sortSchema.parse({ sortBy });
          expect(result.sortBy).toBe(sortBy);
        });
      });

      it('should be optional', () => {
        const result = sortSchema.parse({});
        expect(result.sortBy).toBeUndefined();
      });

      it('should accept camelCase field names', () => {
        const result = sortSchema.parse({ sortBy: 'displayName' });
        expect(result.sortBy).toBe('displayName');
      });

      it('should accept snake_case field names', () => {
        const result = sortSchema.parse({ sortBy: 'created_at' });
        expect(result.sortBy).toBe('created_at');
      });
    });

    describe('sortOrder validation', () => {
      it('should accept "asc"', () => {
        const result = sortSchema.parse({ sortOrder: 'asc' });
        expect(result.sortOrder).toBe('asc');
      });

      it('should accept "desc"', () => {
        const result = sortSchema.parse({ sortOrder: 'desc' });
        expect(result.sortOrder).toBe('desc');
      });

      it('should default to "asc" when not provided', () => {
        const result = sortSchema.parse({});
        expect(result.sortOrder).toBe('asc');
      });

      it('should reject invalid sortOrder values', () => {
        expect(() => sortSchema.parse({ sortOrder: 'ascending' as any })).toThrow(ZodError);
        expect(() => sortSchema.parse({ sortOrder: 'descending' as any })).toThrow(ZodError);
        expect(() => sortSchema.parse({ sortOrder: 'ASC' as any })).toThrow(ZodError);
        expect(() => sortSchema.parse({ sortOrder: 'DESC' as any })).toThrow(ZodError);
        expect(() => sortSchema.parse({ sortOrder: '1' as any })).toThrow(ZodError);
      });
    });

    it('should validate complete sort configuration', () => {
      const configs = [
        { sortBy: 'name', sortOrder: 'asc' as const },
        { sortBy: 'createdAt', sortOrder: 'desc' as const },
        { sortBy: 'priority', sortOrder: 'asc' as const },
      ];

      configs.forEach((config) => {
        const result = sortSchema.parse(config);
        expect(result).toEqual(config);
      });
    });

    it('should allow sortBy without sortOrder (using default)', () => {
      const result = sortSchema.parse({ sortBy: 'name' });
      expect(result).toEqual({
        sortBy: 'name',
        sortOrder: 'asc',
      });
    });
  });

  describe('searchSchema', () => {
    it('should validate with search query', () => {
      const result = searchSchema.parse({ search: 'firefox' });
      expect(result).toEqual({ search: 'firefox' });
    });

    it('should accept search as optional', () => {
      const result = searchSchema.parse({});
      expect(result).toEqual({});
      expect(result.search).toBeUndefined();
    });

    it('should accept various search queries', () => {
      const queries = [
        'firefox',
        'visual studio code',
        'app-name',
        'search with numbers 123',
        'special!@#characters',
        '',
      ];

      queries.forEach((search) => {
        const result = searchSchema.parse({ search });
        expect(result.search).toBe(search);
      });
    });

    it('should accept empty string search', () => {
      const result = searchSchema.parse({ search: '' });
      expect(result.search).toBe('');
    });

    it('should accept multi-word search', () => {
      const result = searchSchema.parse({ search: 'video editing software' });
      expect(result.search).toBe('video editing software');
    });

    it('should accept search with special characters', () => {
      const result = searchSchema.parse({ search: 'C++ compiler' });
      expect(result.search).toBe('C++ compiler');
    });

    it('should accept long search queries', () => {
      const longSearch = 'a'.repeat(500);
      const result = searchSchema.parse({ search: longSearch });
      expect(result.search).toBe(longSearch);
    });

    it('should reject non-string search', () => {
      expect(() => searchSchema.parse({ search: 123 as any })).toThrow(ZodError);
      expect(() => searchSchema.parse({ search: null as any })).toThrow(ZodError);
      expect(() => searchSchema.parse({ search: {} as any })).toThrow(ZodError);
    });
  });

  describe('combined schemas', () => {
    it('should combine pagination and search', () => {
      const combined = paginationSchema.merge(searchSchema);
      const result = combined.parse({
        limit: '20',
        offset: '40',
        search: 'test',
      });

      expect(result).toEqual({
        limit: 20,
        offset: 40,
        search: 'test',
      });
    });

    it('should combine pagination and sort', () => {
      const combined = paginationSchema.merge(sortSchema);
      const result = combined.parse({
        limit: '15',
        offset: '30',
        sortBy: 'name',
        sortOrder: 'desc',
      });

      expect(result).toEqual({
        limit: 15,
        offset: 30,
        sortBy: 'name',
        sortOrder: 'desc',
      });
    });

    it('should combine all query schemas', () => {
      const combined = paginationSchema.merge(sortSchema).merge(searchSchema);
      const result = combined.parse({
        limit: '25',
        offset: '50',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: 'firefox',
      });

      expect(result).toEqual({
        limit: 25,
        offset: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        search: 'firefox',
      });
    });
  });
});
