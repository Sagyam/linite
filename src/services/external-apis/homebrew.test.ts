import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import {
  searchHomebrew,
  getHomebrewPackageMetadata,
  checkHomebrewAvailability,
  clearHomebrewCache,
} from './homebrew';

global.fetch = vi.fn() as Mock;

describe('Homebrew API Client', () => {
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearHomebrewCache();
  });

  describe('searchHomebrew', () => {
    const mockFormulae = [
      {
        name: 'wget',
        full_name: 'wget',
        desc: 'Internet file retriever',
        license: 'GPL-3.0',
        homepage: 'https://www.gnu.org/software/wget/',
        versions: { stable: '1.21.3' },
      },
      {
        name: 'curl',
        full_name: 'curl',
        desc: 'Get a file from an HTTP, HTTPS or FTP server',
        license: 'MIT',
        homepage: 'https://curl.se',
        versions: { stable: '8.0.1' },
      },
    ];

    const mockCasks = [
      {
        name: 'firefox',
        full_name: 'firefox',
        desc: 'Web browser',
        license: 'MPL-2.0',
        homepage: 'https://www.mozilla.org/firefox/',
        versions: { stable: '120.0' },
      },
    ];

    it('should search for packages successfully', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFormulae,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCasks,
        });

      const results = await searchHomebrew('fire');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        identifier: 'firefox',
        name: 'firefox',
        summary: 'Web browser',
        version: '120.0',
        homepage: 'https://www.mozilla.org/firefox/',
        license: 'MPL-2.0',
        source: 'homebrew',
      });
    });

    it('should search by name', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFormulae,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCasks,
        });

      const results = await searchHomebrew('wget');

      expect(results).toHaveLength(1);
      expect(results[0].identifier).toBe('wget');
    });

    it('should search by description', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFormulae,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCasks,
        });

      const results = await searchHomebrew('retriever');

      expect(results).toHaveLength(1);
      expect(results[0].identifier).toBe('wget');
    });

    it('should be case-insensitive', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFormulae,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCasks,
        });

      const results = await searchHomebrew('WGET');

      expect(results).toHaveLength(1);
      expect(results[0].identifier).toBe('wget');
    });

    it('should return empty array when no matches found', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFormulae,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCasks,
        });

      const results = await searchHomebrew('nonexistent-package-xyz');

      expect(results).toEqual([]);
    });

    it('should limit results to 50', async () => {
      const manyPackages = Array.from({ length: 100 }, (_, i) => ({
        name: `package-${i}`,
        full_name: `package-${i}`,
        desc: 'test package',
        versions: { stable: '1.0.0' },
      }));

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => manyPackages,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const results = await searchHomebrew('package');

      expect(results).toHaveLength(50);
    });

    it('should throw error for empty query', async () => {
      await expect(searchHomebrew('')).rejects.toThrow('Search query is required');
      await expect(searchHomebrew('  ')).rejects.toThrow('Search query is required');
    });

    it('should handle API errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      // fetchAllFormulae/fetchAllCasks return empty array on error
      const results = await searchHomebrew('test');
      expect(results).toEqual([]);
    });

    it('should handle network errors', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      // fetchAllFormulae/fetchAllCasks return empty array on error
      const results = await searchHomebrew('test');
      expect(results).toEqual([]);
    });

    it('should use cache for subsequent searches', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFormulae,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCasks,
        });

      await searchHomebrew('wget');
      await searchHomebrew('curl');

      // Should only fetch once (from cache on second call)
      expect(global.fetch).toHaveBeenCalledTimes(2); // Once for formulae, once for casks
    });

    it('should filter out packages without name', async () => {
      const packagesWithNull = [
        ...mockFormulae,
        { full_name: 'no-name', desc: 'Package without name' } as any,
      ];

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => packagesWithNull,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const results = await searchHomebrew('no-name');

      expect(results).toEqual([]);
    });
  });

  describe('getHomebrewPackageMetadata', () => {
    const mockFormula = {
      name: 'wget',
      full_name: 'wget',
      desc: 'Internet file retriever',
      license: 'GPL-3.0',
      homepage: 'https://www.gnu.org/software/wget/',
      versions: { stable: '1.21.3', head: 'HEAD' },
      tap: 'homebrew/core',
      revision: 1,
      urls: {
        stable: {
          url: 'https://ftp.gnu.org/gnu/wget/wget-1.21.3.tar.gz',
        },
      },
    };

    it('should fetch package metadata for formula', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormula,
      });

      const metadata = await getHomebrewPackageMetadata('wget');

      expect(metadata).toEqual({
        identifier: 'wget',
        name: 'wget',
        summary: 'Internet file retriever',
        description: 'Internet file retriever',
        version: '1.21.3',
        homepage: 'https://www.gnu.org/software/wget/',
        license: 'GPL-3.0',
        source: 'homebrew',
        metadata: {
          tap: 'homebrew/core',
          revision: 1,
          downloadUrl: 'https://ftp.gnu.org/gnu/wget/wget-1.21.3.tar.gz',
        },
      });
    });

    it('should try cask if formula not found', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ...mockFormula, name: 'firefox' }),
        });

      const metadata = await getHomebrewPackageMetadata('firefox');

      expect(metadata?.identifier).toBe('firefox');
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should return null if package not found', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

      const metadata = await getHomebrewPackageMetadata('nonexistent');

      expect(metadata).toBeNull();
    });

    it('should throw error for empty package name', async () => {
      await expect(getHomebrewPackageMetadata('')).rejects.toThrow('Package name is required');
      await expect(getHomebrewPackageMetadata('  ')).rejects.toThrow('Package name is required');
    });

    it('should handle API errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getHomebrewPackageMetadata('test')).rejects.toThrow(
        'Failed to fetch Homebrew package metadata'
      );
    });

    it('should use cache for repeated requests', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormula,
      });

      await getHomebrewPackageMetadata('wget');
      const cached = await getHomebrewPackageMetadata('wget');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(cached?.identifier).toBe('wget');
    });

    it('should encode package names in URLs', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFormula,
      });

      await getHomebrewPackageMetadata('package/with/slashes');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('package%2Fwith%2Fslashes'),
        expect.any(Object)
      );
    });
  });

  describe('checkHomebrewAvailability', () => {
    it('should return true for available package', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ name: 'wget' }),
      });

      const available = await checkHomebrewAvailability('wget');

      expect(available).toBe(true);
    });

    it('should return false for unavailable package', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: false, status: 404 })
        .mockResolvedValueOnce({ ok: false, status: 404 });

      const available = await checkHomebrewAvailability('nonexistent');

      expect(available).toBe(false);
    });

    it('should return false on error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const available = await checkHomebrewAvailability('test');

      expect(available).toBe(false);
    });
  });

  describe('clearHomebrewCache', () => {
    it('should clear all caches', async () => {
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ name: 'wget' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      await searchHomebrew('wget');

      clearHomebrewCache();

      // After clearing cache, should fetch again
      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ name: 'wget' }],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      await searchHomebrew('wget');

      expect(global.fetch).toHaveBeenCalledTimes(4); // 2 initial + 2 after clear
    });
  });
});
