import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import { searchAUR } from './aur';

global.fetch = vi.fn() as Mock;

describe('AUR API Client', () => {
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    vi.clearAllMocks();
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
});
