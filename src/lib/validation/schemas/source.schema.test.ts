import { describe, it, expect } from 'vitest';
import { createSourceSchema, updateSourceSchema } from './source.schema';
import { ZodError } from 'zod';

describe('source validation schemas', () => {
  describe('createSourceSchema', () => {
    const validSource = {
      name: 'Flatpak',
      slug: 'flatpak',
      installCmd: 'flatpak install {package}',
      requireSudo: false,
      setupCmd: 'flatpak remote-add flathub https://flathub.org/repo/flathub.flatpakrepo',
      priority: 50,
      apiEndpoint: 'https://flathub.org/api/v2',
    };

    it('should validate a complete valid source', () => {
      const result = createSourceSchema.parse(validSource);
      expect(result).toEqual(validSource);
    });

    it('should validate minimal required fields', () => {
      const minimal = {
        name: 'APT',
        slug: 'apt',
        installCmd: 'apt install {package}',
      };

      const result = createSourceSchema.parse(minimal);
      expect(result.name).toBe('APT');
      expect(result.slug).toBe('apt');
      expect(result.installCmd).toBe('apt install {package}');
      expect(result.requireSudo).toBe(false); // default
      expect(result.priority).toBe(0); // default
    });

    it('should require name', () => {
      const source = { ...validSource };
      delete (source as any).name;
      expect(() => createSourceSchema.parse(source)).toThrow(ZodError);
    });

    it('should reject empty name', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, name: '' })
      ).toThrow('Name is required');
    });

    it('should reject name over 50 characters', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, name: 'A'.repeat(51) })
      ).toThrow('Name must be less than 50 characters');
    });

    it('should require slug', () => {
      const source = { ...validSource };
      delete (source as any).slug;
      expect(() => createSourceSchema.parse(source)).toThrow(ZodError);
    });

    it('should reject invalid slug format', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, slug: 'INVALID' })
      ).toThrow();
    });

    it('should require installCmd', () => {
      const source = { ...validSource };
      delete (source as any).installCmd;
      expect(() => createSourceSchema.parse(source)).toThrow(ZodError);
    });

    it('should reject empty installCmd', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, installCmd: '' })
      ).toThrow('Install command is required');
    });

    it('should reject installCmd over 200 characters', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, installCmd: 'A'.repeat(201) })
      ).toThrow('Install command must be less than 200 characters');
    });

    it('should default requireSudo to false', () => {
      const source = { ...validSource };
      delete (source as any).requireSudo;
      const result = createSourceSchema.parse(source);
      expect(result.requireSudo).toBe(false);
    });

    it('should accept requireSudo as boolean', () => {
      expect(
        createSourceSchema.parse({ ...validSource, requireSudo: true })
          .requireSudo
      ).toBe(true);
    });

    it('should make setupCmd optional', () => {
      const source = { ...validSource };
      delete (source as any).setupCmd;
      const result = createSourceSchema.parse(source);
      expect(result.setupCmd).toBeUndefined();
    });

    it('should reject setupCmd over 500 characters', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, setupCmd: 'A'.repeat(501) })
      ).toThrow('Setup command must be less than 500 characters');
    });

    it('should default priority to 0', () => {
      const source = { ...validSource };
      delete (source as any).priority;
      const result = createSourceSchema.parse(source);
      expect(result.priority).toBe(0);
    });

    it('should reject negative priority', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, priority: -1 })
      ).toThrow('Priority must be 0 or greater');
    });

    it('should require priority to be integer', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, priority: 1.5 })
      ).toThrow(ZodError);
    });

    it('should make apiEndpoint optional', () => {
      const source = { ...validSource };
      delete (source as any).apiEndpoint;
      const result = createSourceSchema.parse(source);
      expect(result.apiEndpoint).toBeUndefined();
    });

    it('should validate apiEndpoint as URL', () => {
      expect(() =>
        createSourceSchema.parse({ ...validSource, apiEndpoint: 'not-a-url' })
      ).toThrow('API endpoint must be a valid URL');
    });

    it('should accept valid apiEndpoint', () => {
      const result = createSourceSchema.parse({
        ...validSource,
        apiEndpoint: 'https://api.example.com',
      });
      expect(result.apiEndpoint).toBe('https://api.example.com');
    });

    it('should accept empty string for apiEndpoint', () => {
      const result = createSourceSchema.parse({
        ...validSource,
        apiEndpoint: '',
      });
      expect(result.apiEndpoint).toBe('');
    });
  });

  describe('updateSourceSchema', () => {
    it('should require id field', () => {
      expect(() =>
        updateSourceSchema.parse({ name: 'Updated' })
      ).toThrow(ZodError);
    });

    it('should make all fields optional except id', () => {
      const result = updateSourceSchema.parse({ id: 'src-123' });
      expect(result.id).toBe('src-123');
    });

    it('should allow partial updates', () => {
      const result = updateSourceSchema.parse({
        id: 'src-123',
        priority: 100,
      });
      expect(result.id).toBe('src-123');
      expect(result.priority).toBe(100);
    });
  });
});
