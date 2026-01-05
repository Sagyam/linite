import { describe, it, expect } from 'vitest';
import {
  appSlugSchema,
  createAppSchema,
  updateAppSchema,
  getAppsQuerySchema,
} from './app.schema';
import { ZodError } from 'zod';

describe('app validation schemas', () => {
  describe('appSlugSchema', () => {
    it('should validate valid slugs', () => {
      expect(appSlugSchema.parse('firefox')).toBe('firefox');
      expect(appSlugSchema.parse('visual-studio-code')).toBe('visual-studio-code');
      expect(appSlugSchema.parse('app123')).toBe('app123');
      expect(appSlugSchema.parse('my-app-2024')).toBe('my-app-2024');
    });

    it('should reject empty strings', () => {
      expect(() => appSlugSchema.parse('')).toThrow(ZodError);
      expect(() => appSlugSchema.parse('')).toThrow('Slug is required');
    });

    it('should reject slugs over 100 characters', () => {
      const longSlug = 'a'.repeat(101);
      expect(() => appSlugSchema.parse(longSlug)).toThrow(ZodError);
      expect(() => appSlugSchema.parse(longSlug)).toThrow('Slug must be less than 100 characters');
    });

    it('should accept slugs with exactly 100 characters', () => {
      const maxSlug = 'a'.repeat(100);
      expect(appSlugSchema.parse(maxSlug)).toBe(maxSlug);
    });

    it('should reject uppercase letters', () => {
      expect(() => appSlugSchema.parse('Firefox')).toThrow(ZodError);
      expect(() => appSlugSchema.parse('FIREFOX')).toThrow(ZodError);
      expect(() => appSlugSchema.parse('FireFox')).toThrow(ZodError);
    });

    it('should reject special characters', () => {
      expect(() => appSlugSchema.parse('fire_fox')).toThrow(ZodError);
      expect(() => appSlugSchema.parse('fire fox')).toThrow(ZodError);
      expect(() => appSlugSchema.parse('fire.fox')).toThrow(ZodError);
      expect(() => appSlugSchema.parse('fire/fox')).toThrow(ZodError);
      expect(() => appSlugSchema.parse('fire@fox')).toThrow(ZodError);
    });

    it('should accept hyphens', () => {
      expect(appSlugSchema.parse('my-app')).toBe('my-app');
      expect(appSlugSchema.parse('my-super-long-app-name')).toBe('my-super-long-app-name');
    });

    it('should accept numbers', () => {
      expect(appSlugSchema.parse('app123')).toBe('app123');
      expect(appSlugSchema.parse('123app')).toBe('123app');
      expect(appSlugSchema.parse('12345')).toBe('12345');
    });
  });

  describe('createAppSchema', () => {
    const validApp = {
      slug: 'test-app',
      displayName: 'Test App',
      description: 'A test application',
      iconUrl: 'https://example.com/icon.png',
      homepage: 'https://example.com',
      isPopular: false,
      isFoss: true,
      categoryId: 'cat-123',
    };

    it('should validate a complete valid app', () => {
      const result = createAppSchema.parse(validApp);
      expect(result).toEqual(validApp);
    });

    it('should validate minimal required fields', () => {
      const minimalApp = {
        slug: 'app',
        displayName: 'App',
        categoryId: 'cat-1',
      };

      const result = createAppSchema.parse(minimalApp);
      expect(result.slug).toBe('app');
      expect(result.displayName).toBe('App');
      expect(result.categoryId).toBe('cat-1');
      expect(result.isPopular).toBe(false); // default
      expect(result.isFoss).toBe(true); // default
    });

    it('should require slug', () => {
      const app = { ...validApp };
      delete (app as any).slug;
      expect(() => createAppSchema.parse(app)).toThrow(ZodError);
    });

    it('should require displayName', () => {
      const app = { ...validApp };
      delete (app as any).displayName;
      expect(() => createAppSchema.parse(app)).toThrow(ZodError);
    });

    it('should require categoryId', () => {
      const app = { ...validApp };
      delete (app as any).categoryId;
      expect(() => createAppSchema.parse(app)).toThrow(ZodError);
    });

    it('should reject empty displayName', () => {
      const app = { ...validApp, displayName: '' };
      expect(() => createAppSchema.parse(app)).toThrow(ZodError);
      expect(() => createAppSchema.parse(app)).toThrow('Display name is required');
    });

    it('should reject displayName over 100 characters', () => {
      const app = { ...validApp, displayName: 'A'.repeat(101) };
      expect(() => createAppSchema.parse(app)).toThrow(ZodError);
      expect(() => createAppSchema.parse(app)).toThrow('Display name must be less than 100 characters');
    });

    it('should accept displayName with exactly 100 characters', () => {
      const app = { ...validApp, displayName: 'A'.repeat(100) };
      const result = createAppSchema.parse(app);
      expect(result.displayName).toBe('A'.repeat(100));
    });

    it('should make description optional', () => {
      const app = { ...validApp };
      delete (app as any).description;
      const result = createAppSchema.parse(app);
      expect(result.description).toBeUndefined();
    });

    it('should reject description over 500 characters', () => {
      const app = { ...validApp, description: 'A'.repeat(501) };
      expect(() => createAppSchema.parse(app)).toThrow(ZodError);
      expect(() => createAppSchema.parse(app)).toThrow('Description must be less than 500 characters');
    });

    it('should accept description with exactly 500 characters', () => {
      const app = { ...validApp, description: 'A'.repeat(500) };
      const result = createAppSchema.parse(app);
      expect(result.description).toBe('A'.repeat(500));
    });

    it('should accept empty string for description', () => {
      const app = { ...validApp, description: '' };
      const result = createAppSchema.parse(app);
      expect(result.description).toBe('');
    });

    it('should make iconUrl optional', () => {
      const app = { ...validApp };
      delete (app as any).iconUrl;
      const result = createAppSchema.parse(app);
      expect(result.iconUrl).toBeUndefined();
    });

    it('should validate iconUrl as URL', () => {
      expect(() => createAppSchema.parse({ ...validApp, iconUrl: 'not-a-url' })).toThrow(ZodError);
      expect(() => createAppSchema.parse({ ...validApp, iconUrl: 'not-a-url' })).toThrow('Icon URL must be a valid URL');
    });

    it('should accept valid iconUrl formats', () => {
      const urls = [
        'https://example.com/icon.png',
        'http://example.com/icon.svg',
        'https://cdn.example.com/path/to/icon.jpg',
      ];

      urls.forEach((url) => {
        const result = createAppSchema.parse({ ...validApp, iconUrl: url });
        expect(result.iconUrl).toBe(url);
      });
    });

    it('should accept empty string for iconUrl', () => {
      const app = { ...validApp, iconUrl: '' };
      const result = createAppSchema.parse(app);
      expect(result.iconUrl).toBe('');
    });

    it('should make homepage optional', () => {
      const app = { ...validApp };
      delete (app as any).homepage;
      const result = createAppSchema.parse(app);
      expect(result.homepage).toBeUndefined();
    });

    it('should validate homepage as URL', () => {
      expect(() => createAppSchema.parse({ ...validApp, homepage: 'not-a-url' })).toThrow(ZodError);
      expect(() => createAppSchema.parse({ ...validApp, homepage: 'not-a-url' })).toThrow('Homepage must be a valid URL');
    });

    it('should accept valid homepage formats', () => {
      const urls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
        'https://subdomain.example.com',
      ];

      urls.forEach((url) => {
        const result = createAppSchema.parse({ ...validApp, homepage: url });
        expect(result.homepage).toBe(url);
      });
    });

    it('should accept empty string for homepage', () => {
      const app = { ...validApp, homepage: '' };
      const result = createAppSchema.parse(app);
      expect(result.homepage).toBe('');
    });

    it('should default isPopular to false', () => {
      const app = { ...validApp };
      delete (app as any).isPopular;
      const result = createAppSchema.parse(app);
      expect(result.isPopular).toBe(false);
    });

    it('should accept isPopular as boolean', () => {
      expect(createAppSchema.parse({ ...validApp, isPopular: true }).isPopular).toBe(true);
      expect(createAppSchema.parse({ ...validApp, isPopular: false }).isPopular).toBe(false);
    });

    it('should default isFoss to true', () => {
      const app = { ...validApp };
      delete (app as any).isFoss;
      const result = createAppSchema.parse(app);
      expect(result.isFoss).toBe(true);
    });

    it('should accept isFoss as boolean', () => {
      expect(createAppSchema.parse({ ...validApp, isFoss: true }).isFoss).toBe(true);
      expect(createAppSchema.parse({ ...validApp, isFoss: false }).isFoss).toBe(false);
    });

    it('should reject empty categoryId', () => {
      const app = { ...validApp, categoryId: '' };
      expect(() => createAppSchema.parse(app)).toThrow(ZodError);
      expect(() => createAppSchema.parse(app)).toThrow('Category is required');
    });
  });

  describe('updateAppSchema', () => {
    it('should require id field', () => {
      const update = {
        slug: 'updated-app',
      };

      expect(() => updateAppSchema.parse(update)).toThrow(ZodError);
      // Zod error message format varies, just check it throws
    });

    it('should reject empty id', () => {
      const update = {
        id: '',
        slug: 'updated-app',
      };

      expect(() => updateAppSchema.parse(update)).toThrow(ZodError);
    });

    it('should make all fields except id optional', () => {
      const update = {
        id: 'app-123',
      };

      const result = updateAppSchema.parse(update);
      expect(result.id).toBe('app-123');
    });

    it('should allow partial updates', () => {
      const update = {
        id: 'app-123',
        displayName: 'New Name',
      };

      const result = updateAppSchema.parse(update);
      expect(result.id).toBe('app-123');
      expect(result.displayName).toBe('New Name');
      expect(result.slug).toBeUndefined();
    });

    it('should validate provided fields', () => {
      const update = {
        id: 'app-123',
        slug: 'INVALID_SLUG',
      };

      expect(() => updateAppSchema.parse(update)).toThrow(ZodError);
    });

    it('should allow updating all fields', () => {
      const update = {
        id: 'app-123',
        slug: 'new-slug',
        displayName: 'New Name',
        description: 'New description',
        iconUrl: 'https://new.com/icon.png',
        homepage: 'https://new.com',
        isPopular: true,
        isFoss: false,
        categoryId: 'new-cat',
      };

      const result = updateAppSchema.parse(update);
      expect(result).toEqual(update);
    });
  });

  describe('getAppsQuerySchema', () => {
    it('should accept empty query', () => {
      const result = getAppsQuerySchema.parse({});
      // Transform converts undefined popular to false
      expect(result.popular).toBe(false);
      expect(result.category).toBeUndefined();
      expect(result.search).toBeUndefined();
      expect(result.limit).toBeUndefined();
      expect(result.offset).toBeUndefined();
    });

    it('should accept category filter', () => {
      const result = getAppsQuerySchema.parse({ category: 'development' });
      expect(result.category).toBe('development');
    });

    it('should transform popular string to boolean', () => {
      const resultTrue = getAppsQuerySchema.parse({ popular: 'true' });
      expect(resultTrue.popular).toBe(true);

      const resultFalse = getAppsQuerySchema.parse({ popular: 'false' });
      expect(resultFalse.popular).toBe(false);

      const resultOther = getAppsQuerySchema.parse({ popular: 'anything' });
      expect(resultOther.popular).toBe(false);
    });

    it('should accept search query', () => {
      const result = getAppsQuerySchema.parse({ search: 'firefox' });
      expect(result.search).toBe('firefox');
    });

    it('should transform and validate limit', () => {
      const result = getAppsQuerySchema.parse({ limit: '50' });
      expect(result.limit).toBe(50);
    });

    it('should reject limit less than 1', () => {
      expect(() => getAppsQuerySchema.parse({ limit: '0' })).toThrow(ZodError);
      expect(() => getAppsQuerySchema.parse({ limit: '-1' })).toThrow(ZodError);
    });

    it('should reject limit greater than 100', () => {
      expect(() => getAppsQuerySchema.parse({ limit: '101' })).toThrow(ZodError);
      expect(() => getAppsQuerySchema.parse({ limit: '1000' })).toThrow(ZodError);
    });

    it('should accept limit of 1', () => {
      const result = getAppsQuerySchema.parse({ limit: '1' });
      expect(result.limit).toBe(1);
    });

    it('should accept limit of 100', () => {
      const result = getAppsQuerySchema.parse({ limit: '100' });
      expect(result.limit).toBe(100);
    });

    it('should transform and validate offset', () => {
      const result = getAppsQuerySchema.parse({ offset: '20' });
      expect(result.offset).toBe(20);
    });

    it('should accept offset of 0', () => {
      const result = getAppsQuerySchema.parse({ offset: '0' });
      expect(result.offset).toBe(0);
    });

    it('should reject negative offset', () => {
      expect(() => getAppsQuerySchema.parse({ offset: '-1' })).toThrow(ZodError);
    });

    it('should accept large offset', () => {
      const result = getAppsQuerySchema.parse({ offset: '1000' });
      expect(result.offset).toBe(1000);
    });

    it('should handle complete query', () => {
      const result = getAppsQuerySchema.parse({
        category: 'development',
        popular: 'true',
        search: 'code',
        limit: '20',
        offset: '40',
      });

      expect(result).toEqual({
        category: 'development',
        popular: true,
        search: 'code',
        limit: 20,
        offset: 40,
      });
    });

    it('should handle invalid number strings for limit', () => {
      expect(() => getAppsQuerySchema.parse({ limit: 'not-a-number' })).toThrow();
    });

    it('should handle invalid number strings for offset', () => {
      expect(() => getAppsQuerySchema.parse({ offset: 'not-a-number' })).toThrow();
    });
  });
});
