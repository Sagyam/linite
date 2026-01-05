import { describe, it, expect } from 'vitest';
import {
  createCategorySchema,
  updateCategorySchema,
} from './category.schema';
import { ZodError } from 'zod';

describe('category validation schemas', () => {
  describe('createCategorySchema', () => {
    const validCategory = {
      name: 'Development',
      slug: 'development',
      icon: '💻',
      description: 'Development tools and IDEs',
      displayOrder: 1,
    };

    it('should validate a complete valid category', () => {
      const result = createCategorySchema.parse(validCategory);
      expect(result).toEqual(validCategory);
    });

    it('should validate minimal required fields', () => {
      const minimal = {
        name: 'Games',
        slug: 'games',
      };

      const result = createCategorySchema.parse(minimal);
      expect(result.name).toBe('Games');
      expect(result.slug).toBe('games');
      expect(result.displayOrder).toBe(0); // default
    });

    it('should require name', () => {
      const cat = { ...validCategory };
      delete (cat as any).name;
      expect(() => createCategorySchema.parse(cat)).toThrow(ZodError);
    });

    it('should reject empty name', () => {
      expect(() =>
        createCategorySchema.parse({ ...validCategory, name: '' })
      ).toThrow('Name is required');
    });

    it('should reject name over 50 characters', () => {
      expect(() =>
        createCategorySchema.parse({ ...validCategory, name: 'A'.repeat(51) })
      ).toThrow('Name must be less than 50 characters');
    });

    it('should require slug', () => {
      const cat = { ...validCategory };
      delete (cat as any).slug;
      expect(() => createCategorySchema.parse(cat)).toThrow(ZodError);
    });

    it('should reject invalid slug format', () => {
      expect(() =>
        createCategorySchema.parse({ ...validCategory, slug: 'INVALID' })
      ).toThrow();
      expect(() =>
        createCategorySchema.parse({ ...validCategory, slug: 'invalid_slug' })
      ).toThrow();
    });

    it('should accept valid slug', () => {
      const result = createCategorySchema.parse({
        ...validCategory,
        slug: 'my-category-123',
      });
      expect(result.slug).toBe('my-category-123');
    });

    it('should make icon optional', () => {
      const cat = { ...validCategory };
      delete (cat as any).icon;
      const result = createCategorySchema.parse(cat);
      expect(result.icon).toBeUndefined();
    });

    it('should accept empty string for icon', () => {
      const result = createCategorySchema.parse({
        ...validCategory,
        icon: '',
      });
      expect(result.icon).toBe('');
    });

    it('should make description optional', () => {
      const cat = { ...validCategory };
      delete (cat as any).description;
      const result = createCategorySchema.parse(cat);
      expect(result.description).toBeUndefined();
    });

    it('should reject description over 200 characters', () => {
      expect(() =>
        createCategorySchema.parse({
          ...validCategory,
          description: 'A'.repeat(201),
        })
      ).toThrow('Description must be less than 200 characters');
    });

    it('should default displayOrder to 0', () => {
      const cat = { ...validCategory };
      delete (cat as any).displayOrder;
      const result = createCategorySchema.parse(cat);
      expect(result.displayOrder).toBe(0);
    });

    it('should reject negative displayOrder', () => {
      expect(() =>
        createCategorySchema.parse({ ...validCategory, displayOrder: -1 })
      ).toThrow('Display order must be 0 or greater');
    });

    it('should accept displayOrder of 0', () => {
      const result = createCategorySchema.parse({
        ...validCategory,
        displayOrder: 0,
      });
      expect(result.displayOrder).toBe(0);
    });

    it('should require displayOrder to be integer', () => {
      expect(() =>
        createCategorySchema.parse({ ...validCategory, displayOrder: 1.5 })
      ).toThrow(ZodError);
    });
  });

  describe('updateCategorySchema', () => {
    it('should require id field', () => {
      expect(() =>
        updateCategorySchema.parse({ name: 'Updated' })
      ).toThrow(ZodError);
    });

    it('should make all fields optional except id', () => {
      const result = updateCategorySchema.parse({ id: 'cat-123' });
      expect(result.id).toBe('cat-123');
    });

    it('should allow partial updates', () => {
      const result = updateCategorySchema.parse({
        id: 'cat-123',
        name: 'New Name',
      });
      expect(result.id).toBe('cat-123');
      expect(result.name).toBe('New Name');
    });

    it('should validate provided fields', () => {
      expect(() =>
        updateCategorySchema.parse({
          id: 'cat-123',
          slug: 'INVALID_SLUG',
        })
      ).toThrow(ZodError);
    });
  });
});
