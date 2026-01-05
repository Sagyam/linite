import { describe, it, expect } from 'vitest';
import { createDistroSchema, updateDistroSchema } from './distro.schema';
import { ZodError } from 'zod';

describe('distro validation schemas', () => {
  describe('createDistroSchema', () => {
    const validDistro = {
      name: 'Ubuntu',
      slug: 'ubuntu',
      family: 'debian',
      iconUrl: 'https://example.com/ubuntu-icon.png',
      basedOn: 'debian',
      isPopular: true,
    };

    it('should validate a complete valid distro', () => {
      const result = createDistroSchema.parse(validDistro);
      expect(result).toEqual(validDistro);
    });

    it('should validate minimal required fields', () => {
      const minimal = {
        name: 'Arch Linux',
        slug: 'arch',
        family: 'arch',
      };

      const result = createDistroSchema.parse(minimal);
      expect(result.name).toBe('Arch Linux');
      expect(result.slug).toBe('arch');
      expect(result.family).toBe('arch');
      expect(result.isPopular).toBe(false); // default
    });

    it('should require name', () => {
      const distro = { ...validDistro };
      delete (distro as any).name;
      expect(() => createDistroSchema.parse(distro)).toThrow(ZodError);
    });

    it('should reject empty name', () => {
      expect(() =>
        createDistroSchema.parse({ ...validDistro, name: '' })
      ).toThrow('Name is required');
    });

    it('should reject name over 50 characters', () => {
      expect(() =>
        createDistroSchema.parse({ ...validDistro, name: 'A'.repeat(51) })
      ).toThrow('Name must be less than 50 characters');
    });

    it('should require slug', () => {
      const distro = { ...validDistro };
      delete (distro as any).slug;
      expect(() => createDistroSchema.parse(distro)).toThrow(ZodError);
    });

    it('should reject invalid slug format', () => {
      expect(() =>
        createDistroSchema.parse({ ...validDistro, slug: 'INVALID' })
      ).toThrow();
      expect(() =>
        createDistroSchema.parse({ ...validDistro, slug: 'invalid_slug' })
      ).toThrow();
    });

    it('should accept valid slug', () => {
      const result = createDistroSchema.parse({
        ...validDistro,
        slug: 'linux-mint',
      });
      expect(result.slug).toBe('linux-mint');
    });

    it('should require family', () => {
      const distro = { ...validDistro };
      delete (distro as any).family;
      expect(() => createDistroSchema.parse(distro)).toThrow(ZodError);
    });

    it('should reject empty family', () => {
      expect(() =>
        createDistroSchema.parse({ ...validDistro, family: '' })
      ).toThrow('Family is required');
    });

    it('should reject family over 50 characters', () => {
      expect(() =>
        createDistroSchema.parse({ ...validDistro, family: 'A'.repeat(51) })
      ).toThrow('Family must be less than 50 characters');
    });

    it('should make iconUrl optional', () => {
      const distro = { ...validDistro };
      delete (distro as any).iconUrl;
      const result = createDistroSchema.parse(distro);
      expect(result.iconUrl).toBeUndefined();
    });

    it('should validate iconUrl as URL', () => {
      expect(() =>
        createDistroSchema.parse({ ...validDistro, iconUrl: 'not-a-url' })
      ).toThrow('Icon URL must be a valid URL');
    });

    it('should accept valid iconUrl', () => {
      const result = createDistroSchema.parse({
        ...validDistro,
        iconUrl: 'https://cdn.example.com/icon.svg',
      });
      expect(result.iconUrl).toBe('https://cdn.example.com/icon.svg');
    });

    it('should accept empty string for iconUrl', () => {
      const result = createDistroSchema.parse({
        ...validDistro,
        iconUrl: '',
      });
      expect(result.iconUrl).toBe('');
    });

    it('should make basedOn optional', () => {
      const distro = { ...validDistro };
      delete (distro as any).basedOn;
      const result = createDistroSchema.parse(distro);
      expect(result.basedOn).toBeUndefined();
    });

    it('should reject basedOn over 50 characters', () => {
      expect(() =>
        createDistroSchema.parse({ ...validDistro, basedOn: 'A'.repeat(51) })
      ).toThrow('Based on must be less than 50 characters');
    });

    it('should accept empty string for basedOn', () => {
      const result = createDistroSchema.parse({
        ...validDistro,
        basedOn: '',
      });
      expect(result.basedOn).toBe('');
    });

    it('should default isPopular to false', () => {
      const distro = { ...validDistro };
      delete (distro as any).isPopular;
      const result = createDistroSchema.parse(distro);
      expect(result.isPopular).toBe(false);
    });

    it('should accept isPopular as boolean', () => {
      expect(
        createDistroSchema.parse({ ...validDistro, isPopular: true }).isPopular
      ).toBe(true);
      expect(
        createDistroSchema.parse({ ...validDistro, isPopular: false }).isPopular
      ).toBe(false);
    });
  });

  describe('updateDistroSchema', () => {
    it('should require id field', () => {
      expect(() =>
        updateDistroSchema.parse({ name: 'Updated' })
      ).toThrow(ZodError);
    });

    it('should make all fields optional except id', () => {
      const result = updateDistroSchema.parse({ id: 'distro-123' });
      expect(result.id).toBe('distro-123');
    });

    it('should allow partial updates', () => {
      const result = updateDistroSchema.parse({
        id: 'distro-123',
        isPopular: true,
      });
      expect(result.id).toBe('distro-123');
      expect(result.isPopular).toBe(true);
    });

    it('should validate provided fields', () => {
      expect(() =>
        updateDistroSchema.parse({
          id: 'distro-123',
          slug: 'INVALID_SLUG',
        })
      ).toThrow(ZodError);
    });
  });
});
