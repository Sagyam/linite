import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import {
  searchNixHub,
  getNixHubPackageMetadata,
  checkNixHubAvailability,
  clearNixHubCache,
} from './nixhub';

global.fetch = vi.fn() as Mock;

describe('NixHub API Client', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearNixHubCache();
  });

  describe('searchNixHub', () => {
    it('should search for packages successfully', async () => {
      const mockResponse = {
        query: 'firefox',
        total_results: 2,
        results: [
          {
            name: 'firefox',
            summary: 'Mozilla Firefox web browser',
            last_updated: '2024-01-01',
          },
          {
            name: 'firefox-esr',
            summary: 'Firefox Extended Support Release',
            last_updated: '2024-01-01',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchNixHub('firefox');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        identifier: 'firefox',
        name: 'firefox',
        summary: 'Mozilla Firefox web browser',
        source: 'nixhub',
      });
    });

    it('should encode search query', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: '', total_results: 0, results: [] }),
      });

      await searchNixHub('package with spaces');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('package%20with%20spaces'),
        expect.any(Object)
      );
    });

    it('should return empty array when no results', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: 'test', total_results: 0, results: [] }),
      });

      const results = await searchNixHub('nonexistent');

      expect(results).toEqual([]);
    });

    it('should throw error for empty query', async () => {
      await expect(searchNixHub('')).rejects.toThrow('Search query is required');
      await expect(searchNixHub('  ')).rejects.toThrow('Search query is required');
    });

    it('should handle rate limit errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      await expect(searchNixHub('test')).rejects.toThrow('rate limit exceeded');
    });

    it('should handle API errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchNixHub('test')).rejects.toThrow('Failed to search NixHub');
    });

    it('should handle network errors', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(searchNixHub('test')).rejects.toThrow('Failed to search NixHub');
    });

    it('should use cache for repeated searches', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: 'test', total_results: 0, results: [] }),
      });

      await searchNixHub('test');
      await searchNixHub('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should be case-insensitive for cache', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: 'TEST', total_results: 0, results: [] }),
      });

      await searchNixHub('TEST');
      await searchNixHub('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getNixHubPackageMetadata', () => {
    const mockPackage = {
      name: 'firefox',
      summary: 'Mozilla Firefox web browser',
      description: 'A free and open-source web browser',
      homepage_url: 'https://www.mozilla.org/firefox/',
      license: 'MPL-2.0',
      releases: [
        {
          version: '120.0',
          last_updated: '2024-01-01',
          platforms: ['x86_64-linux', 'aarch64-linux'],
          outputs: ['out', 'dev'],
        },
      ],
    };

    it('should fetch package metadata', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      });

      const metadata = await getNixHubPackageMetadata('firefox');

      expect(metadata).toEqual({
        identifier: 'firefox',
        name: 'firefox',
        summary: 'Mozilla Firefox web browser',
        description: 'A free and open-source web browser',
        version: '120.0',
        homepage: 'https://www.mozilla.org/firefox/',
        license: 'MPL-2.0',
        releaseDate: '2024-01-01',
        source: 'nixhub',
        metadata: {
          platforms: ['x86_64-linux', 'aarch64-linux'],
          outputs: ['out', 'dev'],
        },
      });
    });

    it('should handle package without releases', async () => {
      const packageNoReleases = { ...mockPackage, releases: [] };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => packageNoReleases,
      });

      const metadata = await getNixHubPackageMetadata('test');

      expect(metadata?.version).toBeUndefined();
    });

    it('should return null if package not found', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const metadata = await getNixHubPackageMetadata('nonexistent');

      expect(metadata).toBeNull();
    });

    it('should throw error for empty package name', async () => {
      await expect(getNixHubPackageMetadata('')).rejects.toThrow('Package name is required');
    });

    it('should handle API errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(getNixHubPackageMetadata('test')).rejects.toThrow(
        'Failed to fetch NixHub package metadata'
      );
    });

    it('should use cache for repeated requests', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      });

      await getNixHubPackageMetadata('firefox');
      await getNixHubPackageMetadata('firefox');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should encode package names in URLs', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPackage,
      });

      await getNixHubPackageMetadata('package/name');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('package%2Fname'),
        expect.any(Object)
      );
    });
  });

  describe('checkNixHubAvailability', () => {
    it('should return true for available package', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'firefox' }),
      });

      const available = await checkNixHubAvailability('firefox');

      expect(available).toBe(true);
    });

    it('should return false for unavailable package', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const available = await checkNixHubAvailability('nonexistent');

      expect(available).toBe(false);
    });

    it('should return false on error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const available = await checkNixHubAvailability('test');

      expect(available).toBe(false);
    });
  });

  describe('clearNixHubCache', () => {
    it('should clear all caches', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: 'test', total_results: 0, results: [] }),
      });

      await searchNixHub('test');

      clearNixHubCache();

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: 'test', total_results: 0, results: [] }),
      });

      await searchNixHub('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
