import { describe, it, expect } from 'vitest';
import {
  createPackageSchema,
  updatePackageSchema,
  getPackagesQuerySchema,
} from './package.schema';
import { ZodError } from 'zod';

describe('package validation schemas', () => {
  describe('createPackageSchema', () => {
    const validPackage = {
      appId: 'app-123',
      sourceId: 'src-456',
      identifier: 'com.example.app',
      version: '1.0.0',
      size: 1024000,
      maintainer: 'John Doe',
      isAvailable: true,
      metadata: { description: 'Test app' },
    };

    it('should validate a complete valid package', () => {
      const result = createPackageSchema.parse(validPackage);
      expect(result).toEqual(validPackage);
    });

    it('should validate minimal required fields', () => {
      const minimalPackage = {
        appId: 'app-123',
        sourceId: 'src-456',
        identifier: 'com.example.app',
      };

      const result = createPackageSchema.parse(minimalPackage);
      expect(result.appId).toBe('app-123');
      expect(result.sourceId).toBe('src-456');
      expect(result.identifier).toBe('com.example.app');
      expect(result.isAvailable).toBe(true); // default
    });

    describe('appId validation', () => {
      it('should require appId', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).appId;
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });

      it('should reject empty appId', () => {
        const pkg = { ...validPackage, appId: '' };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
        expect(() => createPackageSchema.parse(pkg)).toThrow('App ID is required');
      });

      it('should accept valid appId', () => {
        const pkg = { ...validPackage, appId: 'valid-app-id-123' };
        const result = createPackageSchema.parse(pkg);
        expect(result.appId).toBe('valid-app-id-123');
      });
    });

    describe('sourceId validation', () => {
      it('should require sourceId', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).sourceId;
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });

      it('should reject empty sourceId', () => {
        const pkg = { ...validPackage, sourceId: '' };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
        expect(() => createPackageSchema.parse(pkg)).toThrow('Source ID is required');
      });

      it('should accept valid sourceId', () => {
        const pkg = { ...validPackage, sourceId: 'valid-source-id-456' };
        const result = createPackageSchema.parse(pkg);
        expect(result.sourceId).toBe('valid-source-id-456');
      });
    });

    describe('identifier validation', () => {
      it('should require identifier', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).identifier;
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });

      it('should reject empty identifier', () => {
        const pkg = { ...validPackage, identifier: '' };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
        expect(() => createPackageSchema.parse(pkg)).toThrow('Package identifier is required');
      });

      it('should reject identifier over 200 characters', () => {
        const longIdentifier = 'a'.repeat(201);
        const pkg = { ...validPackage, identifier: longIdentifier };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
        expect(() => createPackageSchema.parse(pkg)).toThrow(
          'Identifier must be less than 200 characters'
        );
      });

      it('should accept identifier with exactly 200 characters', () => {
        const maxIdentifier = 'a'.repeat(200);
        const pkg = { ...validPackage, identifier: maxIdentifier };
        const result = createPackageSchema.parse(pkg);
        expect(result.identifier).toBe(maxIdentifier);
      });

      it('should accept common package identifier formats', () => {
        const formats = [
          'firefox',
          'org.mozilla.firefox',
          'com.example.app',
          'app-name',
          'app_name',
          'app.name',
          'app/name',
        ];

        formats.forEach((identifier) => {
          const pkg = { ...validPackage, identifier };
          const result = createPackageSchema.parse(pkg);
          expect(result.identifier).toBe(identifier);
        });
      });
    });

    describe('version validation', () => {
      it('should accept valid version strings', () => {
        const versions = ['1.0.0', '2.3.4-beta', 'v1.2.3', '10.0', 'latest'];

        versions.forEach((version) => {
          const pkg = { ...validPackage, version };
          const result = createPackageSchema.parse(pkg);
          expect(result.version).toBe(version);
        });
      });

      it('should accept empty string for version', () => {
        const pkg = { ...validPackage, version: '' };
        const result = createPackageSchema.parse(pkg);
        expect(result.version).toBe('');
      });

      it('should accept undefined version', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).version;
        const result = createPackageSchema.parse(pkg);
        expect(result.version).toBeUndefined();
      });

      it('should reject version over 50 characters', () => {
        const longVersion = 'v'.repeat(51);
        const pkg = { ...validPackage, version: longVersion };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
        expect(() => createPackageSchema.parse(pkg)).toThrow(
          'Version must be less than 50 characters'
        );
      });

      it('should accept version with exactly 50 characters', () => {
        const maxVersion = 'v'.repeat(50);
        const pkg = { ...validPackage, version: maxVersion };
        const result = createPackageSchema.parse(pkg);
        expect(result.version).toBe(maxVersion);
      });
    });

    describe('size validation', () => {
      it('should accept valid size values', () => {
        const sizes = [0, 1, 100, 1024, 1048576, 1073741824];

        sizes.forEach((size) => {
          const pkg = { ...validPackage, size };
          const result = createPackageSchema.parse(pkg);
          expect(result.size).toBe(size);
        });
      });

      it('should accept undefined size', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).size;
        const result = createPackageSchema.parse(pkg);
        expect(result.size).toBeUndefined();
      });

      it('should reject negative size', () => {
        const pkg = { ...validPackage, size: -1 };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
        expect(() => createPackageSchema.parse(pkg)).toThrow('Size must be 0 or greater');
      });

      it('should reject non-integer size', () => {
        const pkg = { ...validPackage, size: 1024.5 };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });

      it('should reject non-numeric size', () => {
        const pkg = { ...validPackage, size: '1024' as any };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });
    });

    describe('maintainer validation', () => {
      it('should accept valid maintainer names', () => {
        const maintainers = [
          'John Doe',
          'jane@example.com',
          'Mozilla Foundation',
          'user123',
        ];

        maintainers.forEach((maintainer) => {
          const pkg = { ...validPackage, maintainer };
          const result = createPackageSchema.parse(pkg);
          expect(result.maintainer).toBe(maintainer);
        });
      });

      it('should accept empty string for maintainer', () => {
        const pkg = { ...validPackage, maintainer: '' };
        const result = createPackageSchema.parse(pkg);
        expect(result.maintainer).toBe('');
      });

      it('should accept undefined maintainer', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).maintainer;
        const result = createPackageSchema.parse(pkg);
        expect(result.maintainer).toBeUndefined();
      });

      it('should reject maintainer over 100 characters', () => {
        const longMaintainer = 'a'.repeat(101);
        const pkg = { ...validPackage, maintainer: longMaintainer };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
        expect(() => createPackageSchema.parse(pkg)).toThrow(
          'Maintainer must be less than 100 characters'
        );
      });

      it('should accept maintainer with exactly 100 characters', () => {
        const maxMaintainer = 'a'.repeat(100);
        const pkg = { ...validPackage, maintainer: maxMaintainer };
        const result = createPackageSchema.parse(pkg);
        expect(result.maintainer).toBe(maxMaintainer);
      });
    });

    describe('isAvailable validation', () => {
      it('should accept true for isAvailable', () => {
        const pkg = { ...validPackage, isAvailable: true };
        const result = createPackageSchema.parse(pkg);
        expect(result.isAvailable).toBe(true);
      });

      it('should accept false for isAvailable', () => {
        const pkg = { ...validPackage, isAvailable: false };
        const result = createPackageSchema.parse(pkg);
        expect(result.isAvailable).toBe(false);
      });

      it('should default to true when isAvailable is not provided', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).isAvailable;
        const result = createPackageSchema.parse(pkg);
        expect(result.isAvailable).toBe(true);
      });

      it('should reject non-boolean isAvailable', () => {
        const pkg = { ...validPackage, isAvailable: 'true' as any };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });
    });

    describe('metadata validation', () => {
      it('should accept valid metadata object', () => {
        const metadata = {
          description: 'Test app',
          license: 'MIT',
          homepage: 'https://example.com',
        };
        const pkg = { ...validPackage, metadata };
        const result = createPackageSchema.parse(pkg);
        expect(result.metadata).toEqual(metadata);
      });

      it('should accept empty metadata object', () => {
        const pkg = { ...validPackage, metadata: {} };
        const result = createPackageSchema.parse(pkg);
        expect(result.metadata).toEqual({});
      });

      it('should accept undefined metadata', () => {
        const pkg = { ...validPackage };
        delete (pkg as any).metadata;
        const result = createPackageSchema.parse(pkg);
        expect(result.metadata).toBeUndefined();
      });

      it('should accept metadata with various value types', () => {
        const metadata = {
          string: 'value',
          number: 42,
          boolean: true,
          null: null,
          array: [1, 2, 3],
          object: { nested: 'value' },
        };
        const pkg = { ...validPackage, metadata };
        const result = createPackageSchema.parse(pkg);
        expect(result.metadata).toEqual(metadata);
      });

      it('should reject non-object metadata', () => {
        const pkg = { ...validPackage, metadata: 'string' as any };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });

      it('should reject array as metadata', () => {
        const pkg = { ...validPackage, metadata: [] as any };
        expect(() => createPackageSchema.parse(pkg)).toThrow(ZodError);
      });
    });
  });

  describe('updatePackageSchema', () => {
    it('should validate complete update data', () => {
      const updateData = {
        id: 'pkg-123',
        appId: 'app-456',
        sourceId: 'src-789',
        identifier: 'updated.identifier',
        version: '2.0.0',
        size: 2048000,
        maintainer: 'Jane Doe',
        isAvailable: false,
        metadata: { updated: true },
      };

      const result = updatePackageSchema.parse(updateData);
      expect(result).toEqual(updateData);
    });

    it('should require id field', () => {
      const updateData = {
        appId: 'app-456',
        identifier: 'updated.identifier',
      };

      expect(() => updatePackageSchema.parse(updateData)).toThrow(ZodError);
    });

    it('should reject empty id', () => {
      const updateData = {
        id: '',
        appId: 'app-456',
      };

      expect(() => updatePackageSchema.parse(updateData)).toThrow(ZodError);
    });

    it('should allow partial updates with only id', () => {
      const updateData = {
        id: 'pkg-123',
      };

      const result = updatePackageSchema.parse(updateData);
      expect(result.id).toBe('pkg-123');
    });

    it('should allow updating individual fields', () => {
      const identifierUpdate = { id: 'pkg-123', identifier: 'new.identifier' };
      const identifierResult = updatePackageSchema.parse(identifierUpdate);
      expect(identifierResult.id).toBe('pkg-123');
      expect(identifierResult.identifier).toBe('new.identifier');

      const versionUpdate = { id: 'pkg-123', version: '3.0.0' };
      const versionResult = updatePackageSchema.parse(versionUpdate);
      expect(versionResult.id).toBe('pkg-123');
      expect(versionResult.version).toBe('3.0.0');

      const sizeUpdate = { id: 'pkg-123', size: 3072000 };
      const sizeResult = updatePackageSchema.parse(sizeUpdate);
      expect(sizeResult.id).toBe('pkg-123');
      expect(sizeResult.size).toBe(3072000);

      const maintainerUpdate = { id: 'pkg-123', maintainer: 'New Maintainer' };
      const maintainerResult = updatePackageSchema.parse(maintainerUpdate);
      expect(maintainerResult.id).toBe('pkg-123');
      expect(maintainerResult.maintainer).toBe('New Maintainer');

      const availableUpdate = { id: 'pkg-123', isAvailable: false };
      const availableResult = updatePackageSchema.parse(availableUpdate);
      expect(availableResult.id).toBe('pkg-123');
      expect(availableResult.isAvailable).toBe(false);

      const metadataUpdate = { id: 'pkg-123', metadata: { custom: 'value' } };
      const metadataResult = updatePackageSchema.parse(metadataUpdate);
      expect(metadataResult.id).toBe('pkg-123');
      expect(metadataResult.metadata).toEqual({ custom: 'value' });
    });

    it('should validate field constraints on updates', () => {
      const invalidUpdates = [
        { id: 'pkg-123', identifier: '' }, // empty
        { id: 'pkg-123', identifier: 'a'.repeat(201) }, // too long
        { id: 'pkg-123', version: 'v'.repeat(51) }, // too long
        { id: 'pkg-123', size: -1 }, // negative
        { id: 'pkg-123', maintainer: 'a'.repeat(101) }, // too long
      ];

      invalidUpdates.forEach((update) => {
        expect(() => updatePackageSchema.parse(update)).toThrow(ZodError);
      });
    });

    it('should make all fields except id optional', () => {
      const result = updatePackageSchema.parse({ id: 'pkg-123' });
      expect(result.id).toBe('pkg-123');
      // isAvailable has a default value of true
      expect(result.isAvailable).toBe(true);
    });
  });

  describe('getPackagesQuerySchema', () => {
    it('should validate query with all parameters', () => {
      const query = {
        appId: 'app-123',
        sourceId: 'src-456',
        available: 'true',
        limit: '20',
        offset: '40',
      };

      const result = getPackagesQuerySchema.parse(query);
      expect(result).toEqual({
        appId: 'app-123',
        sourceId: 'src-456',
        available: true,
        limit: 20,
        offset: 40,
      });
    });

    it('should validate query with no parameters', () => {
      const query = {};
      const result = getPackagesQuerySchema.parse(query);
      expect(result).toEqual({});
    });

    it('should accept appId parameter', () => {
      const query = { appId: 'app-123' };
      const result = getPackagesQuerySchema.parse(query);
      expect(result.appId).toBe('app-123');
    });

    it('should accept sourceId parameter', () => {
      const query = { sourceId: 'src-456' };
      const result = getPackagesQuerySchema.parse(query);
      expect(result.sourceId).toBe('src-456');
    });

    describe('available parameter transformation', () => {
      it('should transform "true" string to true boolean', () => {
        const query = { available: 'true' };
        const result = getPackagesQuerySchema.parse(query);
        expect(result.available).toBe(true);
      });

      it('should transform "false" string to false boolean', () => {
        const query = { available: 'false' };
        const result = getPackagesQuerySchema.parse(query);
        expect(result.available).toBe(false);
      });

      it('should transform other strings to false', () => {
        const values = ['True', 'TRUE', '1', 'yes', 'anything'];
        values.forEach((value) => {
          const query = { available: value };
          const result = getPackagesQuerySchema.parse(query);
          expect(result.available).toBe(false);
        });
      });

      it('should keep undefined when not provided', () => {
        const query = {};
        const result = getPackagesQuerySchema.parse(query);
        expect(result.available).toBeUndefined();
      });
    });

    describe('limit parameter transformation', () => {
      it('should transform string to number', () => {
        const query = { limit: '25' };
        const result = getPackagesQuerySchema.parse(query);
        expect(result.limit).toBe(25);
      });

      it('should accept valid limit values', () => {
        const limits = ['1', '10', '50', '100'];
        limits.forEach((limit) => {
          const query = { limit };
          const result = getPackagesQuerySchema.parse(query);
          expect(result.limit).toBe(parseInt(limit, 10));
        });
      });

      it('should reject limit less than 1', () => {
        const query = { limit: '0' };
        expect(() => getPackagesQuerySchema.parse(query)).toThrow(ZodError);
      });

      it('should reject limit greater than 100', () => {
        const query = { limit: '101' };
        expect(() => getPackagesQuerySchema.parse(query)).toThrow(ZodError);
      });

      it('should accept limit of exactly 100', () => {
        const query = { limit: '100' };
        const result = getPackagesQuerySchema.parse(query);
        expect(result.limit).toBe(100);
      });

      it('should accept limit of exactly 1', () => {
        const query = { limit: '1' };
        const result = getPackagesQuerySchema.parse(query);
        expect(result.limit).toBe(1);
      });

      it('should keep undefined when not provided', () => {
        const query = {};
        const result = getPackagesQuerySchema.parse(query);
        expect(result.limit).toBeUndefined();
      });

      it('should reject non-numeric limit', () => {
        const query = { limit: 'abc' };
        expect(() => getPackagesQuerySchema.parse(query)).toThrow(ZodError);
      });
    });

    describe('offset parameter transformation', () => {
      it('should transform string to number', () => {
        const query = { offset: '50' };
        const result = getPackagesQuerySchema.parse(query);
        expect(result.offset).toBe(50);
      });

      it('should accept valid offset values', () => {
        const offsets = ['0', '10', '100', '1000'];
        offsets.forEach((offset) => {
          const query = { offset };
          const result = getPackagesQuerySchema.parse(query);
          expect(result.offset).toBe(parseInt(offset, 10));
        });
      });

      it('should accept offset of 0', () => {
        const query = { offset: '0' };
        const result = getPackagesQuerySchema.parse(query);
        expect(result.offset).toBe(0);
      });

      it('should reject negative offset', () => {
        const query = { offset: '-1' };
        expect(() => getPackagesQuerySchema.parse(query)).toThrow(ZodError);
      });

      it('should keep undefined when not provided', () => {
        const query = {};
        const result = getPackagesQuerySchema.parse(query);
        expect(result.offset).toBeUndefined();
      });

      it('should reject non-numeric offset', () => {
        const query = { offset: 'xyz' };
        expect(() => getPackagesQuerySchema.parse(query)).toThrow(ZodError);
      });
    });

    it('should handle combination of parameters', () => {
      const query = {
        appId: 'app-123',
        available: 'true',
        limit: '25',
      };

      const result = getPackagesQuerySchema.parse(query);
      expect(result).toEqual({
        appId: 'app-123',
        available: true,
        limit: 25,
      });
    });

    it('should ignore unknown parameters', () => {
      const query = {
        appId: 'app-123',
        unknown: 'parameter',
      } as any;

      const result = getPackagesQuerySchema.parse(query);
      expect(result).toEqual({
        appId: 'app-123',
      });
      expect((result as any).unknown).toBeUndefined();
    });
  });
});
