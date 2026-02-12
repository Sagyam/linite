import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import {
  searchAUR,
  getAURPackageMetadata,
  checkAURAvailability,
  getAURPackagesMetadata,
  clearAURCache,
} from './aur';

// Mock fetch globally
global.fetch = vi.fn() as Mock;

describe('AUR API Client', () => {
  // Suppress console.error for tests that intentionally throw errors
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearAURCache();
  });

  describe('searchAUR', () => {
    it('should search for packages successfully', async () => {
      const mockResponse = {
        version: 5,
        type: 'search',
        resultcount: 2,
        results: [
          {
            ID: 1,
            Name: 'firefox-nightly',
            PackageBaseID: 1,
            PackageBase: 'firefox-nightly',
            Version: '124.0a1',
            Description: 'Standalone web browser from mozilla.org, nightly build',
            URL: 'https://www.mozilla.org/firefox',
            NumVotes: 100,
            Popularity: 5.5,
            OutOfDate: null,
            Maintainer: 'maintainer1',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/packages/firefox-nightly',
            License: ['MPL-2.0'],
          },
          {
            ID: 2,
            Name: 'firefox-developer-edition',
            PackageBaseID: 2,
            PackageBase: 'firefox-developer-edition',
            Version: '123.0b1',
            Description: 'Firefox Developer Edition',
            NumVotes: 50,
            Popularity: 3.2,
            OutOfDate: null,
            Maintainer: 'maintainer2',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/packages/firefox-dev',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchAUR('firefox');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        identifier: 'firefox-nightly',
        name: 'firefox-nightly',
        summary: 'Standalone web browser from mozilla.org, nightly build',
        version: '124.0a1',
        homepage: 'https://www.mozilla.org/firefox',
        license: 'MPL-2.0',
        maintainer: 'maintainer1',
        source: 'aur',
      });

      // Verify URL parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('v=5'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=search'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('arg=firefox'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('by=name-desc'),
        expect.any(Object)
      );
    });

    it('should throw error for empty query', async () => {
      await expect(searchAUR('')).rejects.toThrow('Search query is required');
      await expect(searchAUR('   ')).rejects.toThrow('Search query is required');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchAUR('test')).rejects.toThrow(
        'Failed to search AUR: AUR API error: 500 Internal Server Error'
      );
    });

    it('should handle AUR API error response', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: 5,
          type: 'error',
          error: 'Invalid request',
        }),
      });

      await expect(searchAUR('test')).rejects.toThrow(
        'Failed to search AUR: AUR API error: Invalid request'
      );
    });

    it('should cache search results', async () => {
      const mockResponse = {
        version: 5,
        type: 'search',
        resultcount: 1,
        results: [
          {
            ID: 1,
            Name: 'test-pkg',
            PackageBaseID: 1,
            PackageBase: 'test-pkg',
            Version: '1.0.0',
            Description: 'Test package',
            NumVotes: 10,
            Popularity: 1.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/packages/test',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result1 = await searchAUR('test');
      const result2 = await searchAUR('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should handle packages with multiple licenses', async () => {
      const mockResponse = {
        version: 5,
        type: 'search',
        resultcount: 1,
        results: [
          {
            ID: 1,
            Name: 'multi-license',
            PackageBaseID: 1,
            PackageBase: 'multi-license',
            Version: '1.0.0',
            Description: 'Package with multiple licenses',
            License: ['GPL', 'MIT', 'Apache'],
            NumVotes: 10,
            Popularity: 1.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/packages/test',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchAUR('multi-license');

      expect(results[0].license).toBe('GPL, MIT, Apache');
    });
  });

  describe('getAURPackageMetadata', () => {
    it('should fetch package metadata successfully', async () => {
      const mockResponse = {
        version: 5,
        type: 'info',
        resultcount: 1,
        results: [
          {
            ID: 1,
            Name: 'yay',
            PackageBaseID: 1,
            PackageBase: 'yay',
            Version: '12.0.0',
            Description: 'Yet another yogurt. Pacman wrapper and AUR helper written in go.',
            URL: 'https://github.com/Jguer/yay',
            NumVotes: 1500,
            Popularity: 25.5,
            OutOfDate: null,
            Maintainer: 'jguer',
            FirstSubmitted: 1519862400,
            LastModified: 1704067200,
            URLPath: '/cgit/aur.git/snapshot/yay.tar.gz',
            License: ['GPL'],
            Depends: ['pacman', 'git'],
            MakeDepends: ['go'],
            OptDepends: ['sudo: for privilege elevation'],
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getAURPackageMetadata('yay');

      expect(metadata).toEqual({
        identifier: 'yay',
        name: 'yay',
        summary: 'Yet another yogurt. Pacman wrapper and AUR helper written in go.',
        description: 'Yet another yogurt. Pacman wrapper and AUR helper written in go.',
        version: '12.0.0',
        homepage: 'https://github.com/Jguer/yay',
        license: 'GPL',
        maintainer: 'jguer',
        releaseDate: new Date(1704067200 * 1000).toISOString(),
        source: 'aur',
        metadata: {
          packageBase: 'yay',
          votes: 1500,
          popularity: 25.5,
          outOfDate: null,
          firstSubmitted: new Date(1519862400 * 1000).toISOString(),
          urlPath: 'https://aur.archlinux.org/cgit/aur.git/snapshot/yay.tar.gz',
          depends: ['pacman', 'git'],
          makeDepends: ['go'],
          optDepends: ['sudo: for privilege elevation'],
        },
      });
    });

    it('should return null for non-existent package', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: 5,
          type: 'info',
          resultcount: 0,
          results: [],
        }),
      });

      const metadata = await getAURPackageMetadata('non-existent');
      expect(metadata).toBeNull();
    });

    it('should throw error for empty package name', async () => {
      await expect(getAURPackageMetadata('')).rejects.toThrow('Identifier is required');
      await expect(getAURPackageMetadata('   ')).rejects.toThrow('Identifier is required');
    });

    it('should cache metadata results', async () => {
      const mockResponse = {
        version: 5,
        type: 'info',
        resultcount: 1,
        results: [
          {
            ID: 1,
            Name: 'test',
            PackageBaseID: 1,
            PackageBase: 'test',
            Version: '1.0.0',
            Description: 'Test',
            NumVotes: 10,
            Popularity: 1.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/test',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getAURPackageMetadata('test');
      await getAURPackageMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle out-of-date packages', async () => {
      const outOfDateTimestamp = 1700000000;
      const mockResponse = {
        version: 5,
        type: 'info',
        resultcount: 1,
        results: [
          {
            ID: 1,
            Name: 'old-package',
            PackageBaseID: 1,
            PackageBase: 'old-package',
            Version: '1.0.0',
            Description: 'Old package',
            NumVotes: 10,
            Popularity: 1.0,
            OutOfDate: outOfDateTimestamp,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/test',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getAURPackageMetadata('old-package');

      expect(metadata?.metadata).toHaveProperty('outOfDate');
      expect(metadata?.metadata?.outOfDate).toBe(new Date(outOfDateTimestamp * 1000).toISOString());
    });
  });

  describe('checkAURAvailability', () => {
    it('should return true if package exists', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: 5,
          type: 'info',
          resultcount: 1,
          results: [
            {
              ID: 1,
              Name: 'test',
              PackageBaseID: 1,
              PackageBase: 'test',
              Version: '1.0.0',
              Description: 'Test',
              NumVotes: 10,
              Popularity: 1.0,
              OutOfDate: null,
              Maintainer: 'test',
              FirstSubmitted: 1609459200,
              LastModified: 1704067200,
              URLPath: '/test',
            },
          ],
        }),
      });

      const isAvailable = await checkAURAvailability('test');
      expect(isAvailable).toBe(true);
    });

    it('should return false if package does not exist', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          version: 5,
          type: 'info',
          resultcount: 0,
          results: [],
        }),
      });

      const isAvailable = await checkAURAvailability('non-existent');
      expect(isAvailable).toBe(false);
    });

    it('should return false on error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await checkAURAvailability('test');
      expect(isAvailable).toBe(false);
    });
  });

  describe('getAURPackagesMetadata', () => {
    it('should fetch multiple packages in one request', async () => {
      const mockResponse = {
        version: 5,
        type: 'info',
        resultcount: 3,
        results: [
          {
            ID: 1,
            Name: 'pkg1',
            PackageBaseID: 1,
            PackageBase: 'pkg1',
            Version: '1.0.0',
            Description: 'Package 1',
            NumVotes: 10,
            Popularity: 1.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/pkg1',
          },
          {
            ID: 2,
            Name: 'pkg2',
            PackageBaseID: 2,
            PackageBase: 'pkg2',
            Version: '2.0.0',
            Description: 'Package 2',
            NumVotes: 20,
            Popularity: 2.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/pkg2',
          },
          {
            ID: 3,
            Name: 'pkg3',
            PackageBaseID: 3,
            PackageBase: 'pkg3',
            Version: '3.0.0',
            Description: 'Package 3',
            NumVotes: 30,
            Popularity: 3.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/pkg3',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await getAURPackagesMetadata(['pkg1', 'pkg2', 'pkg3']);

      expect(results.size).toBe(3);
      expect(results.get('pkg1')?.version).toBe('1.0.0');
      expect(results.get('pkg2')?.version).toBe('2.0.0');
      expect(results.get('pkg3')?.version).toBe('3.0.0');

      // Verify it uses multiple arg[] parameters
      const fetchCall = (global.fetch as Mock).mock.calls[0][0];
      expect(fetchCall).toContain('arg%5B%5D=pkg1'); // arg[]=pkg1
      expect(fetchCall).toContain('arg%5B%5D=pkg2'); // arg[]=pkg2
      expect(fetchCall).toContain('arg%5B%5D=pkg3'); // arg[]=pkg3
    });

    it('should return empty map for empty input', async () => {
      const results = await getAURPackagesMetadata([]);
      expect(results.size).toBe(0);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return empty map on error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const results = await getAURPackagesMetadata(['pkg1', 'pkg2']);
      expect(results.size).toBe(0);
    });

    it('should handle partial results', async () => {
      // Request 3 packages, but only 2 exist
      const mockResponse = {
        version: 5,
        type: 'info',
        resultcount: 2,
        results: [
          {
            ID: 1,
            Name: 'pkg1',
            PackageBaseID: 1,
            PackageBase: 'pkg1',
            Version: '1.0.0',
            Description: 'Package 1',
            NumVotes: 10,
            Popularity: 1.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/pkg1',
          },
          {
            ID: 2,
            Name: 'pkg2',
            PackageBaseID: 2,
            PackageBase: 'pkg2',
            Version: '2.0.0',
            Description: 'Package 2',
            NumVotes: 20,
            Popularity: 2.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/pkg2',
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await getAURPackagesMetadata(['pkg1', 'pkg2', 'non-existent']);

      expect(results.size).toBe(2);
      expect(results.has('pkg1')).toBe(true);
      expect(results.has('pkg2')).toBe(true);
      expect(results.has('non-existent')).toBe(false);
    });
  });

  describe('clearAURCache', () => {
    it('should clear both search and metadata caches', async () => {
      const mockSearchResponse = {
        version: 5,
        type: 'search',
        resultcount: 1,
        results: [
          {
            ID: 1,
            Name: 'test',
            PackageBaseID: 1,
            PackageBase: 'test',
            Version: '1.0.0',
            Description: 'Test',
            NumVotes: 10,
            Popularity: 1.0,
            OutOfDate: null,
            Maintainer: 'test',
            FirstSubmitted: 1609459200,
            LastModified: 1704067200,
            URLPath: '/test',
          },
        ],
      };

      const mockInfoResponse = {
        version: 5,
        type: 'info',
        resultcount: 1,
        results: [mockSearchResponse.results[0]],
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockInfoResponse });

      await searchAUR('test');
      await getAURPackageMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);

      clearAURCache();

      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockInfoResponse });

      await searchAUR('test');
      await getAURPackageMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });
});
