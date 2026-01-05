import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import {
  searchWinget,
  getWingetPackageMetadata,
  checkWingetAvailability,
  clearWingetCache,
} from './winget';

global.fetch = vi.fn() as Mock;

describe('Winget API Client', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearWingetCache();
  });

  describe('searchWinget', () => {
    it('should search for packages successfully', async () => {
      const mockResponse = {
        Packages: [
          {
            Id: 'Mozilla.Firefox',
            Name: 'Firefox',
            Publisher: 'Mozilla',
            Description: 'Fast, private browser',
            Homepage: 'https://www.mozilla.org/firefox/',
            License: 'MPL-2.0',
            LatestVersion: {
              Version: '120.0',
            },
          },
          {
            Id: 'Google.Chrome',
            Name: 'Chrome',
            Publisher: 'Google LLC',
            Description: 'Fast, secure browser',
            Homepage: 'https://www.google.com/chrome/',
            LatestVersion: {
              Version: '120.0.6099.130',
            },
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchWinget('browser');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        identifier: 'Mozilla.Firefox',
        name: 'Firefox',
        summary: 'Fast, private browser',
        version: '120.0',
        homepage: 'https://www.mozilla.org/firefox/',
        license: 'MPL-2.0',
        maintainer: 'Mozilla',
        source: 'winget',
      });
    });

    it('should build search URL with query parameter', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Packages: [] }),
      });

      await searchWinget('firefox');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('query=firefox'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('take=50'),
        expect.any(Object)
      );
    });

    it('should handle packages without LatestVersion', async () => {
      const mockResponse = {
        Packages: [
          {
            Id: 'Test.Package',
            Name: 'Test',
            Publisher: 'Test',
            Versions: [{ Version: '1.0.0' }],
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchWinget('test');

      expect(results[0].version).toBe('1.0.0');
    });

    it('should handle empty response', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Packages: [] }),
      });

      const results = await searchWinget('nonexistent');

      expect(results).toEqual([]);
    });

    it('should handle missing Packages array', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const results = await searchWinget('test');

      expect(results).toEqual([]);
    });

    it('should throw error for empty query', async () => {
      await expect(searchWinget('')).rejects.toThrow('Search query is required');
      await expect(searchWinget('  ')).rejects.toThrow('Search query is required');
    });

    it('should handle API errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchWinget('test')).rejects.toThrow('Failed to search Winget');
    });

    it('should handle network errors', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(searchWinget('test')).rejects.toThrow('Failed to search Winget');
    });

    it('should use cache for repeated searches', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Packages: [] }),
      });

      await searchWinget('test');
      await searchWinget('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should be case-insensitive for cache', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Packages: [] }),
      });

      await searchWinget('TEST');
      await searchWinget('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getWingetPackageMetadata', () => {
    const mockPackage = {
      Id: 'Mozilla.Firefox',
      Name: 'Firefox',
      Publisher: 'Mozilla',
      Description: 'Fast, private browser',
      Homepage: 'https://www.mozilla.org/firefox/',
      License: 'MPL-2.0',
      LicenseUrl: 'https://www.mozilla.org/MPL/2.0/',
      Tags: ['browser', 'web', 'mozilla'],
      Versions: [
        {
          Version: '120.0',
          Installers: [
            {
              Architecture: 'x64',
              InstallerType: 'exe',
              Scope: 'machine',
            },
          ],
        },
      ],
      LatestVersion: {
        Version: '120.0',
      },
    };

    it('should fetch package metadata', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      });

      const metadata = await getWingetPackageMetadata('Mozilla.Firefox');

      expect(metadata).toEqual({
        identifier: 'Mozilla.Firefox',
        name: 'Firefox',
        summary: 'Fast, private browser',
        description: 'Fast, private browser',
        version: '120.0',
        homepage: 'https://www.mozilla.org/firefox/',
        license: 'MPL-2.0',
        maintainer: 'Mozilla',
        source: 'winget',
        metadata: {
          licenseUrl: 'https://www.mozilla.org/MPL/2.0/',
          tags: ['browser', 'web', 'mozilla'],
          installers: [
            {
              Architecture: 'x64',
              InstallerType: 'exe',
              Scope: 'machine',
            },
          ],
        },
      });
    });

    it('should handle package without installers', async () => {
      const packageNoInstallers = { ...mockPackage, Versions: [] };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => packageNoInstallers,
      });

      const metadata = await getWingetPackageMetadata('test');

      expect(metadata?.metadata?.installerType).toBeUndefined();
    });

    it('should return null if package not found', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const metadata = await getWingetPackageMetadata('nonexistent');

      expect(metadata).toBeNull();
    });

    it('should throw error for empty package name', async () => {
      await expect(getWingetPackageMetadata('')).rejects.toThrow('Package ID is required');
    });

    it('should handle API errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getWingetPackageMetadata('test')).rejects.toThrow(
        'Failed to fetch Winget package metadata'
      );
    });

    it('should use cache for repeated requests', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      });

      await getWingetPackageMetadata('Mozilla.Firefox');
      await getWingetPackageMetadata('Mozilla.Firefox');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should encode package IDs in URLs', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      });

      await getWingetPackageMetadata('Package.With.Dots');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Package.With.Dots'),
        expect.any(Object)
      );
    });
  });

  describe('checkWingetAvailability', () => {
    it('should return true for available package', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Id: 'Mozilla.Firefox' }),
      });

      const available = await checkWingetAvailability('Mozilla.Firefox');

      expect(available).toBe(true);
    });

    it('should return false for unavailable package', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const available = await checkWingetAvailability('nonexistent');

      expect(available).toBe(false);
    });

    it('should return false on error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const available = await checkWingetAvailability('test');

      expect(available).toBe(false);
    });
  });

  describe('clearWingetCache', () => {
    it('should clear all caches', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Packages: [] }),
      });

      await searchWinget('test');

      clearWingetCache();

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ Packages: [] }),
      });

      await searchWinget('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
