import { describe, it, expect } from 'vitest';
import {
  parsePackageMetadata,
  getLicense,
  getScreenshots,
  getCategories,
  getHomepage,
  getIconUrl,
  type StoredPackageMetadata,
} from './package-metadata';

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

  describe('getLicense', () => {
    it('should extract license from object', () => {
      const metadata = { license: 'MIT' };
      expect(getLicense(metadata)).toBe('MIT');
    });

    it('should extract license from JSON string', () => {
      const metadata = JSON.stringify({ license: 'GPL-3.0' });
      expect(getLicense(metadata)).toBe('GPL-3.0');
    });

    it('should return null when license is not present', () => {
      expect(getLicense({})).toBeNull();
      expect(getLicense({ categories: ['Dev'] })).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(getLicense(null)).toBeNull();
      expect(getLicense(undefined)).toBeNull();
    });

    it('should return null for invalid metadata', () => {
      expect(getLicense('invalid json')).toBeNull();
      expect(getLicense(42)).toBeNull();
    });

    it('should handle different license types', () => {
      expect(getLicense({ license: 'MIT' })).toBe('MIT');
      expect(getLicense({ license: 'Apache-2.0' })).toBe('Apache-2.0');
      expect(getLicense({ license: 'GPL-3.0-or-later' })).toBe(
        'GPL-3.0-or-later'
      );
      expect(getLicense({ license: 'Proprietary' })).toBe('Proprietary');
    });

    it('should handle empty string license', () => {
      expect(getLicense({ license: '' })).toBeNull();
    });
  });

  describe('getScreenshots', () => {
    it('should extract screenshots array', () => {
      const metadata = {
        screenshots: ['https://example.com/1.png', 'https://example.com/2.png'],
      };

      expect(getScreenshots(metadata)).toEqual([
        'https://example.com/1.png',
        'https://example.com/2.png',
      ]);
    });

    it('should extract screenshots from JSON string', () => {
      const metadata = JSON.stringify({
        screenshots: ['url1', 'url2'],
      });

      expect(getScreenshots(metadata)).toEqual(['url1', 'url2']);
    });

    it('should return empty array when screenshots not present', () => {
      expect(getScreenshots({})).toEqual([]);
      expect(getScreenshots({ license: 'MIT' })).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(getScreenshots(null)).toEqual([]);
      expect(getScreenshots(undefined)).toEqual([]);
    });

    it('should return empty array when screenshots is not an array', () => {
      expect(getScreenshots({ screenshots: 'not-an-array' })).toEqual([]);
      expect(getScreenshots({ screenshots: 42 })).toEqual([]);
      expect(getScreenshots({ screenshots: {} })).toEqual([]);
    });

    it('should handle empty screenshots array', () => {
      expect(getScreenshots({ screenshots: [] })).toEqual([]);
    });

    it('should preserve array order', () => {
      const metadata = {
        screenshots: ['first', 'second', 'third'],
      };

      expect(getScreenshots(metadata)).toEqual(['first', 'second', 'third']);
    });
  });

  describe('getCategories', () => {
    it('should extract categories array', () => {
      const metadata = {
        categories: ['Development', 'Utilities'],
      };

      expect(getCategories(metadata)).toEqual(['Development', 'Utilities']);
    });

    it('should extract categories from JSON string', () => {
      const metadata = JSON.stringify({
        categories: ['Games', 'Entertainment'],
      });

      expect(getCategories(metadata)).toEqual(['Games', 'Entertainment']);
    });

    it('should return empty array when categories not present', () => {
      expect(getCategories({})).toEqual([]);
      expect(getCategories({ license: 'MIT' })).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(getCategories(null)).toEqual([]);
      expect(getCategories(undefined)).toEqual([]);
    });

    it('should return empty array when categories is not an array', () => {
      expect(getCategories({ categories: 'Development' })).toEqual([]);
      expect(getCategories({ categories: 123 })).toEqual([]);
      expect(getCategories({ categories: {} })).toEqual([]);
    });

    it('should handle empty categories array', () => {
      expect(getCategories({ categories: [] })).toEqual([]);
    });

    it('should handle multiple categories', () => {
      const metadata = {
        categories: ['Audio', 'Video', 'Multimedia', 'Player'],
      };

      expect(getCategories(metadata)).toEqual([
        'Audio',
        'Video',
        'Multimedia',
        'Player',
      ]);
    });
  });

  describe('getHomepage', () => {
    it('should extract homepage from object', () => {
      const metadata = { homepage: 'https://example.com' };
      expect(getHomepage(metadata)).toBe('https://example.com');
    });

    it('should extract homepage from JSON string', () => {
      const metadata = JSON.stringify({
        homepage: 'https://project.org',
      });

      expect(getHomepage(metadata)).toBe('https://project.org');
    });

    it('should return null when homepage is not present', () => {
      expect(getHomepage({})).toBeNull();
      expect(getHomepage({ license: 'MIT' })).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(getHomepage(null)).toBeNull();
      expect(getHomepage(undefined)).toBeNull();
    });

    it('should return null for invalid metadata', () => {
      expect(getHomepage('invalid json')).toBeNull();
      expect(getHomepage(42)).toBeNull();
    });

    it('should handle various URL formats', () => {
      expect(getHomepage({ homepage: 'https://example.com' })).toBe(
        'https://example.com'
      );
      expect(getHomepage({ homepage: 'http://example.com' })).toBe(
        'http://example.com'
      );
      expect(getHomepage({ homepage: 'https://example.com/path' })).toBe(
        'https://example.com/path'
      );
    });

    it('should handle empty string homepage', () => {
      expect(getHomepage({ homepage: '' })).toBeNull();
    });
  });

  describe('getIconUrl', () => {
    it('should extract iconUrl from object', () => {
      const metadata = { iconUrl: 'https://example.com/icon.png' };
      expect(getIconUrl(metadata)).toBe('https://example.com/icon.png');
    });

    it('should extract iconUrl from JSON string', () => {
      const metadata = JSON.stringify({
        iconUrl: 'https://cdn.example.com/app-icon.svg',
      });

      expect(getIconUrl(metadata)).toBe(
        'https://cdn.example.com/app-icon.svg'
      );
    });

    it('should return null when iconUrl is not present', () => {
      expect(getIconUrl({})).toBeNull();
      expect(getIconUrl({ license: 'MIT' })).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(getIconUrl(null)).toBeNull();
      expect(getIconUrl(undefined)).toBeNull();
    });

    it('should return null for invalid metadata', () => {
      expect(getIconUrl('invalid json')).toBeNull();
      expect(getIconUrl(42)).toBeNull();
    });

    it('should handle different icon URL formats', () => {
      expect(getIconUrl({ iconUrl: 'https://example.com/icon.png' })).toBe(
        'https://example.com/icon.png'
      );
      expect(getIconUrl({ iconUrl: 'https://example.com/icon.svg' })).toBe(
        'https://example.com/icon.svg'
      );
      expect(getIconUrl({ iconUrl: 'https://example.com/icon.jpg' })).toBe(
        'https://example.com/icon.jpg'
      );
    });

    it('should handle empty string iconUrl', () => {
      expect(getIconUrl({ iconUrl: '' })).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should extract all fields from comprehensive metadata', () => {
      const metadata: StoredPackageMetadata = {
        license: 'MIT',
        screenshots: ['shot1.png', 'shot2.png'],
        categories: ['Development', 'Utilities'],
        homepage: 'https://example.com',
        iconUrl: 'https://example.com/icon.png',
        releaseDate: '2024-01-15',
        description: 'A test app',
      };

      expect(getLicense(metadata)).toBe('MIT');
      expect(getScreenshots(metadata)).toEqual(['shot1.png', 'shot2.png']);
      expect(getCategories(metadata)).toEqual(['Development', 'Utilities']);
      expect(getHomepage(metadata)).toBe('https://example.com');
      expect(getIconUrl(metadata)).toBe('https://example.com/icon.png');
    });

    it('should handle metadata from API responses', () => {
      // Simulate API response with JSON string
      const apiResponse = JSON.stringify({
        license: 'Apache-2.0',
        screenshots: [
          'https://api.com/1.png',
          'https://api.com/2.png',
          'https://api.com/3.png',
        ],
        categories: ['Productivity'],
        homepage: 'https://project.com',
        iconUrl: 'https://api.com/icon.png',
      });

      expect(getLicense(apiResponse)).toBe('Apache-2.0');
      expect(getScreenshots(apiResponse)).toHaveLength(3);
      expect(getCategories(apiResponse)).toContain('Productivity');
      expect(getHomepage(apiResponse)).toBe('https://project.com');
      expect(getIconUrl(apiResponse)).toBe('https://api.com/icon.png');
    });

    it('should gracefully handle partial metadata', () => {
      const partialMetadata = {
        license: 'GPL-3.0',
        // Missing other fields
      };

      expect(getLicense(partialMetadata)).toBe('GPL-3.0');
      expect(getScreenshots(partialMetadata)).toEqual([]);
      expect(getCategories(partialMetadata)).toEqual([]);
      expect(getHomepage(partialMetadata)).toBeNull();
      expect(getIconUrl(partialMetadata)).toBeNull();
    });

    it('should handle completely empty metadata', () => {
      const emptyMetadata = {};

      expect(getLicense(emptyMetadata)).toBeNull();
      expect(getScreenshots(emptyMetadata)).toEqual([]);
      expect(getCategories(emptyMetadata)).toEqual([]);
      expect(getHomepage(emptyMetadata)).toBeNull();
      expect(getIconUrl(emptyMetadata)).toBeNull();
    });

    it('should handle metadata with extra unknown fields', () => {
      const metadata = {
        license: 'MIT',
        customField: 'custom-value',
        anotherField: 123,
        nestedObject: { foo: 'bar' },
      };

      // Should still extract known fields correctly
      expect(getLicense(metadata)).toBe('MIT');
      expect(getScreenshots(metadata)).toEqual([]);
    });
  });
});
