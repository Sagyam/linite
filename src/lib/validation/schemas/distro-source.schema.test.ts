import { describe, it, expect } from 'vitest';
import {
  createDistroSourceSchema,
  updateDistroSourceSchema,
} from './distro-source.schema';
import { ZodError } from 'zod';

describe('distro-source validation schemas', () => {
  describe('createDistroSourceSchema', () => {
    const validDistroSource = {
      distroId: 'distro-123',
      sourceId: 'src-456',
      priority: 10,
      isDefault: true,
    };

    it('should validate a complete valid distro source', () => {
      const result = createDistroSourceSchema.parse(validDistroSource);
      expect(result).toEqual(validDistroSource);
    });

    it('should validate minimal required fields', () => {
      const minimalDistroSource = {
        distroId: 'distro-123',
        sourceId: 'src-456',
      };

      const result = createDistroSourceSchema.parse(minimalDistroSource);
      expect(result.distroId).toBe('distro-123');
      expect(result.sourceId).toBe('src-456');
      expect(result.priority).toBe(0); // default
      expect(result.isDefault).toBe(false); // default
    });

    describe('distroId validation', () => {
      it('should require distroId', () => {
        const ds = { ...validDistroSource };
        delete (ds as any).distroId;
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should reject empty distroId', () => {
        const ds = { ...validDistroSource, distroId: '' };
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should accept valid distroId', () => {
        const ids = ['distro-1', 'ubuntu', 'fedora-123', 'dist-abc-def'];
        ids.forEach((distroId) => {
          const ds = { ...validDistroSource, distroId };
          const result = createDistroSourceSchema.parse(ds);
          expect(result.distroId).toBe(distroId);
        });
      });
    });

    describe('sourceId validation', () => {
      it('should require sourceId', () => {
        const ds = { ...validDistroSource };
        delete (ds as any).sourceId;
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should reject empty sourceId', () => {
        const ds = { ...validDistroSource, sourceId: '' };
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should accept valid sourceId', () => {
        const ids = ['src-1', 'flatpak', 'snap-123', 'source-abc-def'];
        ids.forEach((sourceId) => {
          const ds = { ...validDistroSource, sourceId };
          const result = createDistroSourceSchema.parse(ds);
          expect(result.sourceId).toBe(sourceId);
        });
      });
    });

    describe('priority validation', () => {
      it('should accept valid priority values', () => {
        const priorities = [0, 1, 5, 10, 100, 1000];
        priorities.forEach((priority) => {
          const ds = { ...validDistroSource, priority };
          const result = createDistroSourceSchema.parse(ds);
          expect(result.priority).toBe(priority);
        });
      });

      it('should default to 0 when priority is not provided', () => {
        const ds = { ...validDistroSource };
        delete (ds as any).priority;
        const result = createDistroSourceSchema.parse(ds);
        expect(result.priority).toBe(0);
      });

      it('should reject negative priority', () => {
        const ds = { ...validDistroSource, priority: -1 };
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should reject non-integer priority', () => {
        const ds = { ...validDistroSource, priority: 5.5 };
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should reject non-numeric priority', () => {
        const ds = { ...validDistroSource, priority: '10' as any };
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should accept priority of 0', () => {
        const ds = { ...validDistroSource, priority: 0 };
        const result = createDistroSourceSchema.parse(ds);
        expect(result.priority).toBe(0);
      });

      it('should accept large priority values', () => {
        const ds = { ...validDistroSource, priority: 999999 };
        const result = createDistroSourceSchema.parse(ds);
        expect(result.priority).toBe(999999);
      });
    });

    describe('isDefault validation', () => {
      it('should accept true for isDefault', () => {
        const ds = { ...validDistroSource, isDefault: true };
        const result = createDistroSourceSchema.parse(ds);
        expect(result.isDefault).toBe(true);
      });

      it('should accept false for isDefault', () => {
        const ds = { ...validDistroSource, isDefault: false };
        const result = createDistroSourceSchema.parse(ds);
        expect(result.isDefault).toBe(false);
      });

      it('should default to false when isDefault is not provided', () => {
        const ds = { ...validDistroSource };
        delete (ds as any).isDefault;
        const result = createDistroSourceSchema.parse(ds);
        expect(result.isDefault).toBe(false);
      });

      it('should reject non-boolean isDefault', () => {
        const ds = { ...validDistroSource, isDefault: 'true' as any };
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });

      it('should reject numeric isDefault', () => {
        const ds = { ...validDistroSource, isDefault: 1 as any };
        expect(() => createDistroSourceSchema.parse(ds)).toThrow(ZodError);
      });
    });

    it('should validate distro source with all defaults', () => {
      const minimalDs = {
        distroId: 'distro-1',
        sourceId: 'src-1',
      };

      const result = createDistroSourceSchema.parse(minimalDs);
      expect(result).toEqual({
        distroId: 'distro-1',
        sourceId: 'src-1',
        priority: 0,
        isDefault: false,
      });
    });

    it('should validate distro source with custom values', () => {
      const customDs = {
        distroId: 'ubuntu',
        sourceId: 'flatpak',
        priority: 50,
        isDefault: true,
      };

      const result = createDistroSourceSchema.parse(customDs);
      expect(result).toEqual(customDs);
    });

    it('should reject completely empty object', () => {
      expect(() => createDistroSourceSchema.parse({})).toThrow(ZodError);
    });

    it('should reject object with only distroId', () => {
      expect(() => createDistroSourceSchema.parse({ distroId: 'test' })).toThrow(ZodError);
    });

    it('should reject object with only sourceId', () => {
      expect(() => createDistroSourceSchema.parse({ sourceId: 'test' })).toThrow(ZodError);
    });
  });

  describe('updateDistroSourceSchema', () => {
    it('should validate complete update data', () => {
      const updateData = {
        id: 'ds-123',
        distroId: 'distro-456',
        sourceId: 'src-789',
        priority: 20,
        isDefault: true,
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result).toEqual(updateData);
    });

    it('should require id field', () => {
      const updateData = {
        distroId: 'distro-456',
        sourceId: 'src-789',
      };

      expect(() => updateDistroSourceSchema.parse(updateData)).toThrow(ZodError);
    });

    it('should reject empty id', () => {
      const updateData = {
        id: '',
        distroId: 'distro-456',
      };

      expect(() => updateDistroSourceSchema.parse(updateData)).toThrow(ZodError);
    });

    it('should allow partial updates with only id', () => {
      const updateData = {
        id: 'ds-123',
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result.id).toBe('ds-123');
      // Default values still apply
      expect(result.priority).toBe(0);
      expect(result.isDefault).toBe(false);
    });

    it('should allow updating distroId only', () => {
      const updateData = {
        id: 'ds-123',
        distroId: 'new-distro',
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result.id).toBe('ds-123');
      expect(result.distroId).toBe('new-distro');
    });

    it('should allow updating sourceId only', () => {
      const updateData = {
        id: 'ds-123',
        sourceId: 'new-source',
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result.id).toBe('ds-123');
      expect(result.sourceId).toBe('new-source');
    });

    it('should allow updating priority only', () => {
      const updateData = {
        id: 'ds-123',
        priority: 15,
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result.id).toBe('ds-123');
      expect(result.priority).toBe(15);
    });

    it('should allow updating isDefault only', () => {
      const updateData = {
        id: 'ds-123',
        isDefault: true,
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result.id).toBe('ds-123');
      expect(result.isDefault).toBe(true);
    });

    it('should validate field constraints on updates', () => {
      const invalidUpdates = [
        { id: 'ds-123', distroId: '' }, // empty distroId
        { id: 'ds-123', sourceId: '' }, // empty sourceId
        { id: 'ds-123', priority: -1 }, // negative priority
        { id: 'ds-123', priority: 5.5 }, // non-integer priority
      ];

      invalidUpdates.forEach((update) => {
        expect(() => updateDistroSourceSchema.parse(update)).toThrow(ZodError);
      });
    });

    it('should allow updating multiple fields at once', () => {
      const updateData = {
        id: 'ds-123',
        distroId: 'ubuntu',
        priority: 25,
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result.id).toBe('ds-123');
      expect(result.distroId).toBe('ubuntu');
      expect(result.priority).toBe(25);
    });

    it('should reject invalid id type', () => {
      const updateData = {
        id: 123 as any,
        distroId: 'test',
      };

      expect(() => updateDistroSourceSchema.parse(updateData)).toThrow(ZodError);
    });

    it('should make all fields except id optional', () => {
      const result = updateDistroSourceSchema.parse({ id: 'ds-123' });
      expect(result.id).toBe('ds-123');
      // Fields are optional but defaults still apply
      expect(result.priority).toBe(0);
      expect(result.isDefault).toBe(false);
    });

    it('should validate complex update scenario', () => {
      const updateData = {
        id: 'ds-123',
        distroId: 'fedora',
        sourceId: 'flatpak',
        priority: 100,
        isDefault: true,
      };

      const result = updateDistroSourceSchema.parse(updateData);
      expect(result).toEqual(updateData);
    });
  });
});
