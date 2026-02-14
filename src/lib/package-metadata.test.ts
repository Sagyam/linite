import { describe, it, expect } from 'vitest';
import { parsePackageMetadata, type StoredPackageMetadata } from './package-metadata';

describe('package-metadata utilities', () => {
  describe('parsePackageMetadata', () => {
    it('should parse valid JSON string', () => {
      const jsonString = JSON.stringify({
        license: 'MIT',
        categories: ['Development'],
      });

      const result = parsePackageMetadata(jsonString);

      expect(result).toEqual({
        license: 'MIT',
        categories: ['Development'],
      });
    });

    it('should handle object input', () => {
      const metadata: StoredPackageMetadata = {
        license: 'GPL-3.0',
        screenshots: ['https://example.com/shot1.png'],
      };

      const result = parsePackageMetadata(metadata);

      expect(result).toEqual(metadata);
    });

    it('should return empty object for null', () => {
      expect(parsePackageMetadata(null)).toEqual({});
    });

    it('should return empty object for undefined', () => {
      expect(parsePackageMetadata(undefined)).toEqual({});
    });

    it('should return empty object for invalid JSON string', () => {
      const invalidJson = '{ invalid json }';
      expect(parsePackageMetadata(invalidJson)).toEqual({});
    });

    it('should return empty object for non-string, non-object types', () => {
      expect(parsePackageMetadata(42)).toEqual({});
      expect(parsePackageMetadata(true)).toEqual({});
      // Arrays are objects in JS, so they get returned as-is
      expect(parsePackageMetadata([])).toEqual([]);
    });

    it('should handle complex nested metadata', () => {
      const metadata = {
        license: 'Apache-2.0',
        screenshots: ['url1', 'url2', 'url3'],
        categories: ['Utilities', 'Productivity'],
        scriptUrl: {
          linux: 'https://linux-script.sh',
          windows: 'https://windows-script.ps1',
          macos: 'https://macos-script.sh',
        },
        customField: 'custom value',
      };

      const result = parsePackageMetadata(metadata);

      expect(result).toEqual(metadata);
    });

    it('should handle empty JSON string', () => {
      expect(parsePackageMetadata('{}')).toEqual({});
    });

    it('should handle JSON array', () => {
      const jsonArray = '[1, 2, 3]';
      const result = parsePackageMetadata(jsonArray);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should preserve all metadata fields', () => {
      const metadata: StoredPackageMetadata = {
        license: 'BSD-3-Clause',
        screenshots: ['shot1.png', 'shot2.png'],
        categories: ['Games'],
        releaseDate: '2024-01-15',
        description: 'A cool app',
        summary: 'Short summary',
        homepage: 'https://example.com',
        iconUrl: 'https://example.com/icon.png',
        scriptUrl: {
          linux: 'script.sh',
        },
      };

      const result = parsePackageMetadata(JSON.stringify(metadata));

      expect(result).toEqual(metadata);
    });
  });
});
