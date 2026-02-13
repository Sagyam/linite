import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock dependencies BEFORE imports
vi.mock('@/db', () => ({
  db: {
    query: {
      sources: {
        findMany: vi.fn(),
      },
      packages: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      refreshLogs: {
        findMany: vi.fn(),
      },
    },
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn((column, value) => ({ column, value, type: 'eq' })),
  };
});

vi.mock('./refresh-strategies', () => ({
  getRefreshStrategy: vi.fn(),
}));

vi.mock('@/lib/blob', () => ({
  uploadImageFromUrl: vi.fn(),
}));

import {
  refreshPackages,
  syncAppIcon,
  getRefreshLogs,
  checkPackageAvailability,
} from './package-refresh';
import { db } from '@/db';
import { getRefreshStrategy } from './refresh-strategies';
import { uploadImageFromUrl } from '@/lib/blob';

// Get mock references
const mockSourcesFindMany = db.query.sources.findMany as Mock;
const mockPackagesFindMany = db.query.packages.findMany as Mock;
const mockPackagesFindFirst = db.query.packages.findFirst as Mock;
const mockRefreshLogsFindMany = db.query.refreshLogs.findMany as Mock;
const mockDbUpdate = db.update as Mock;
const mockDbInsert = db.insert as Mock;

describe('package-refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const createMockSource = (overrides = {}) => ({
    id: 'source-1',
    name: 'APT',
    slug: 'apt',
    apiEndpoint: 'https://api.example.com',
    ...overrides,
  });

  const createMockPackage = (overrides = {}) => ({
    id: 'pkg-1',
    identifier: 'firefox',
    version: '120.0',
    size: 1024,
    maintainer: 'Mozilla',
    isAvailable: true,
    lastChecked: new Date(),
    metadata: {},
    app: {
      id: 'app-1',
      slug: 'firefox',
      iconUrl: null,
    },
    ...overrides,
  });

  describe('refreshPackages', () => {
    it('should return empty results when no sources have API endpoints', async () => {
      mockSourcesFindMany.mockResolvedValueOnce([
        createMockSource({ apiEndpoint: null }),
        createMockSource({ apiEndpoint: '' }),
      ]);

      const results = await refreshPackages();

      expect(results).toEqual([]);
    });

    it('should refresh packages for sources with API endpoints', async () => {
      const source = createMockSource();
      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([]);

      // Mock insert for logging
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const results = await refreshPackages();

      expect(results).toHaveLength(1);
      expect(results[0].sourceId).toBe('source-1');
      expect(results[0].sourceName).toBe('APT');
    });

    it('should filter to specific source when sourceId option provided', async () => {
      const source = createMockSource({ id: 'specific-source' });
      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([]);
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await refreshPackages({ sourceId: 'specific-source' });

      expect(mockSourcesFindMany).toHaveBeenCalled();
    });

    it('should not log refresh when dryRun is true', async () => {
      const source = createMockSource();
      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([]);

      const results = await refreshPackages({ dryRun: true });

      expect(mockDbInsert).not.toHaveBeenCalled();
      expect(results).toHaveLength(1);
    });

    it('should handle errors during refresh', async () => {
      mockSourcesFindMany.mockRejectedValueOnce(new Error('Database error'));

      await expect(refreshPackages()).rejects.toThrow('Database error');
    });

    it('should update package when strategy returns metadata', async () => {
      const source = createMockSource();
      const pkg = createMockPackage();

      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([pkg]);

      const mockStrategy = {
        getMetadata: vi.fn().mockResolvedValue({
          version: '121.0',
          downloadSize: 2048,
          maintainer: 'Mozilla Team',
          license: 'MPL-2.0',
        }),
        checkAvailability: vi.fn(),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const results = await refreshPackages();

      expect(results[0].packagesUpdated).toBe(1);
      expect(mockStrategy.getMetadata).toHaveBeenCalledWith('firefox');
    });

    it('should handle package without strategy', async () => {
      const source = createMockSource();
      const pkg = createMockPackage();

      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([pkg]);
      vi.mocked(getRefreshStrategy).mockReturnValue(null);
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const results = await refreshPackages();

      expect(results[0].packagesUpdated).toBe(0);
    });

    it('should log errors for individual package failures', async () => {
      const source = createMockSource();
      const pkg = createMockPackage();

      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([pkg]);

      const mockStrategy = {
        getMetadata: vi.fn().mockRejectedValue(new Error('API timeout')),
        checkAvailability: vi.fn(),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const results = await refreshPackages();

      expect(results[0].errors).toContain('firefox: API timeout');
    });

    it('should update lastChecked even when no metadata returned', async () => {
      const source = createMockSource();
      const pkg = createMockPackage();

      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([pkg]);

      const mockStrategy = {
        getMetadata: vi.fn().mockResolvedValue(null),
        checkAvailability: vi.fn(),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await refreshPackages();

      expect(mockDbUpdate).toHaveBeenCalled();
    });

    it('should track duration in results', async () => {
      const source = createMockSource();
      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([]);
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const results = await refreshPackages();

      expect(results[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle source-level errors', async () => {
      const source = createMockSource();
      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockRejectedValueOnce(new Error('Query failed'));
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      const results = await refreshPackages();

      expect(results[0].errors).toContain('Query failed');
    });
  });

  describe('syncAppIcon', () => {
    it('should upload icon and update app record', async () => {
      vi.mocked(uploadImageFromUrl).mockResolvedValueOnce({
        original: 'https://blob.example.com/firefox-original.png',
        variants: {
          64: 'https://blob.example.com/firefox-64.webp',
        },
      });

      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      await syncAppIcon('app-1', 'firefox', 'https://mozilla.org/firefox.png');

      expect(uploadImageFromUrl).toHaveBeenCalledWith(
        'https://mozilla.org/firefox.png',
        'firefox'
      );
      expect(mockDbUpdate).toHaveBeenCalled();
    });

    it('should prefer 64px variant URL', async () => {
      vi.mocked(uploadImageFromUrl).mockResolvedValueOnce({
        original: 'https://blob.example.com/firefox-original.png',
        variants: {
          32: 'https://blob.example.com/firefox-32.webp',
          64: 'https://blob.example.com/firefox-64.webp',
          128: 'https://blob.example.com/firefox-128.webp',
        },
      });

      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      mockDbUpdate.mockReturnValue({ set: setMock });

      await syncAppIcon('app-1', 'firefox', 'https://mozilla.org/firefox.png');

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          iconUrl: 'https://blob.example.com/firefox-64.webp',
        })
      );
    });

    it('should fallback to original URL for SVG (no variants)', async () => {
      vi.mocked(uploadImageFromUrl).mockResolvedValueOnce({
        original: 'https://blob.example.com/firefox.svg',
        variants: {},
      });

      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      mockDbUpdate.mockReturnValue({ set: setMock });

      await syncAppIcon('app-1', 'firefox', 'https://mozilla.org/firefox.svg');

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          iconUrl: 'https://blob.example.com/firefox.svg',
        })
      );
    });

    it('should not update app when upload fails', async () => {
      vi.mocked(uploadImageFromUrl).mockResolvedValueOnce(null);

      await syncAppIcon('app-1', 'firefox', 'https://mozilla.org/firefox.png');

      expect(mockDbUpdate).not.toHaveBeenCalled();
    });

    it('should handle upload errors silently', async () => {
      vi.mocked(uploadImageFromUrl).mockRejectedValueOnce(
        new Error('Upload failed')
      );

      // Should not throw
      await syncAppIcon('app-1', 'firefox', 'https://mozilla.org/firefox.png');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getRefreshLogs', () => {
    it('should return recent refresh logs with source info', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          sourceId: 'source-1',
          status: 'success',
          packagesUpdated: 10,
          errorMessage: null,
          startedAt: new Date('2024-01-01'),
          completedAt: new Date('2024-01-01'),
          source: { id: 'source-1', name: 'APT', slug: 'apt' },
        },
      ];

      mockRefreshLogsFindMany.mockResolvedValueOnce(mockLogs);

      const logs = await getRefreshLogs();

      expect(logs).toEqual(mockLogs);
      expect(mockRefreshLogsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        })
      );
    });

    it('should use custom limit when provided', async () => {
      mockRefreshLogsFindMany.mockResolvedValueOnce([]);

      await getRefreshLogs(10);

      expect(mockRefreshLogsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
        })
      );
    });

    it('should order by startedAt descending', async () => {
      mockRefreshLogsFindMany.mockResolvedValueOnce([]);

      await getRefreshLogs();

      expect(mockRefreshLogsFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.any(Function),
        })
      );
    });
  });

  describe('checkPackageAvailability', () => {
    it('should return available with version when package exists and is available', async () => {
      const pkg = createMockPackage({
        source: { id: 'source-1', slug: 'flatpak' },
      });
      mockPackagesFindFirst.mockResolvedValueOnce(pkg);

      const mockStrategy = {
        getMetadata: vi.fn().mockResolvedValue({ version: '121.0' }),
        checkAvailability: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      const result = await checkPackageAvailability('pkg-1');

      expect(result).toEqual({
        available: true,
        version: '121.0',
      });
    });

    it('should return not available when strategy returns false', async () => {
      const pkg = createMockPackage({
        source: { id: 'source-1', slug: 'flatpak' },
      });
      mockPackagesFindFirst.mockResolvedValueOnce(pkg);

      const mockStrategy = {
        getMetadata: vi.fn(),
        checkAvailability: vi.fn().mockResolvedValue(false),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      const result = await checkPackageAvailability('pkg-1');

      expect(result).toEqual({
        available: false,
        version: undefined,
      });
      expect(mockStrategy.getMetadata).not.toHaveBeenCalled();
    });

    it('should throw error when package not found', async () => {
      mockPackagesFindFirst.mockResolvedValueOnce(null);

      await expect(checkPackageAvailability('nonexistent')).rejects.toThrow(
        'Package not found'
      );
    });

    it('should return available with existing version when no strategy exists', async () => {
      const pkg = createMockPackage({
        version: '120.0',
        source: { id: 'source-1', slug: 'apt' },
      });
      mockPackagesFindFirst.mockResolvedValueOnce(pkg);
      vi.mocked(getRefreshStrategy).mockReturnValue(null);

      const result = await checkPackageAvailability('pkg-1');

      expect(result).toEqual({
        available: true,
        version: '120.0',
      });
    });

    it('should return undefined version when package has null version and no strategy', async () => {
      const pkg = createMockPackage({
        version: null,
        source: { id: 'source-1', slug: 'apt' },
      });
      mockPackagesFindFirst.mockResolvedValueOnce(pkg);
      vi.mocked(getRefreshStrategy).mockReturnValue(null);

      const result = await checkPackageAvailability('pkg-1');

      expect(result).toEqual({
        available: true,
        version: undefined,
      });
    });

    it('should handle strategy throwing error', async () => {
      const pkg = createMockPackage({
        source: { id: 'source-1', slug: 'flatpak' },
      });
      mockPackagesFindFirst.mockResolvedValueOnce(pkg);

      const mockStrategy = {
        getMetadata: vi.fn(),
        checkAvailability: vi.fn().mockRejectedValue(new Error('API error')),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      await expect(checkPackageAvailability('pkg-1')).rejects.toThrow(
        'API error'
      );
    });
  });

  describe('refresh logging', () => {
    it('should log success status when no errors', async () => {
      const source = createMockSource();
      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([]);

      const valuesMock = vi.fn().mockResolvedValue(undefined);
      mockDbInsert.mockReturnValue({ values: valuesMock });

      await refreshPackages();

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          errorMessage: null,
        })
      );
    });

    it('should log partial status when there are errors', async () => {
      const source = createMockSource();
      const pkg = createMockPackage();

      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([pkg]);

      const mockStrategy = {
        getMetadata: vi.fn().mockRejectedValue(new Error('API timeout')),
        checkAvailability: vi.fn(),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      const valuesMock = vi.fn().mockResolvedValue(undefined);
      mockDbInsert.mockReturnValue({ values: valuesMock });

      await refreshPackages();

      expect(valuesMock).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'partial',
          errorMessage: expect.stringContaining('firefox: API timeout'),
        })
      );
    });

    it('should truncate error messages to first 5', async () => {
      const source = createMockSource();
      const packages = Array.from({ length: 10 }, (_, i) =>
        createMockPackage({ id: `pkg-${i}`, identifier: `package-${i}` })
      );

      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce(packages);

      const mockStrategy = {
        getMetadata: vi.fn().mockRejectedValue(new Error('API timeout')),
        checkAvailability: vi.fn(),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      const valuesMock = vi.fn().mockResolvedValue(undefined);
      mockDbInsert.mockReturnValue({ values: valuesMock });

      await refreshPackages();

      const errorMessage = valuesMock.mock.calls[0][0].errorMessage;
      const errorCount = errorMessage.split('; ').length;
      expect(errorCount).toBeLessThanOrEqual(5);
    });
  });

  describe('metadata handling', () => {
    it('should include all metadata fields from strategy', async () => {
      const source = createMockSource();
      const pkg = createMockPackage();

      mockSourcesFindMany.mockResolvedValueOnce([source]);
      mockPackagesFindMany.mockResolvedValueOnce([pkg]);

      const richMetadata = {
        version: '121.0',
        downloadSize: 2048,
        maintainer: 'Mozilla Team',
        license: 'MPL-2.0',
        screenshots: ['https://example.com/screenshot1.png'],
        categories: ['Internet', 'Browser'],
        releaseDate: '2024-01-15',
        description: 'A free and open-source web browser',
        summary: 'Mozilla Firefox web browser',
        homepage: 'https://mozilla.org',
        iconUrl: 'https://example.com/icon.png',
        metadata: {
          flatpakId: 'org.mozilla.firefox',
        },
      };

      const mockStrategy = {
        getMetadata: vi.fn().mockResolvedValue(richMetadata),
        checkAvailability: vi.fn(),
      };
      vi.mocked(getRefreshStrategy).mockReturnValue(mockStrategy);

      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });
      mockDbUpdate.mockReturnValue({ set: setMock });
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      });

      await refreshPackages();

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          version: '121.0',
          size: 2048,
          maintainer: 'Mozilla Team',
          metadata: expect.objectContaining({
            license: 'MPL-2.0',
            screenshots: ['https://example.com/screenshot1.png'],
            categories: ['Internet', 'Browser'],
            flatpakId: 'org.mozilla.firefox',
          }),
        })
      );
    });
  });
});
