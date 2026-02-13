import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, apps, categories, distros, sources, commands } from './api-client';

// Mock fetch
global.fetch = vi.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('base functionality', () => {
    it('should export singleton apiClient instance', () => {
      expect(apiClient).toBeDefined();
    });

    it('should export convenience accessors', () => {
      expect(apps).toBeDefined();
      expect(categories).toBeDefined();
      expect(distros).toBeDefined();
      expect(sources).toBeDefined();
      expect(commands).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should throw error with status code for non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      } as Response);

      await expect(apps.getAll()).rejects.toThrow('API Error (500): Internal Server Error');
    });

    it('should throw error for 404 response', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found'),
      } as Response);

      await expect(apps.getById('nonexistent')).rejects.toThrow('API Error (404): Not Found');
    });

    it('should throw error for network failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(apps.getAll()).rejects.toThrow('Network error');
    });

    it('should throw generic error for unexpected error type', async () => {
      vi.mocked(fetch).mockRejectedValueOnce('some string error');

      await expect(apps.getAll()).rejects.toThrow('An unexpected error occurred');
    });

    it('should throw error for 400 bad request', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: () => Promise.resolve('Bad Request'),
      } as Response);

      await expect(commands.generate({ distroSlug: '', appIds: [] })).rejects.toThrow(
        'API Error (400): Bad Request'
      );
    });

    it('should throw error for 401 unauthorized', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      } as Response);

      await expect(apps.getAll()).rejects.toThrow('API Error (401): Unauthorized');
    });
  });

  describe('apps API', () => {
    const mockApp = {
      id: 'app-1',
      slug: 'firefox',
      displayName: 'Firefox',
      description: 'Web browser',
      iconUrl: 'https://example.com/icon.png',
      isPopular: true,
      isFoss: true,
      categoryId: 'cat-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      category: { id: 'cat-1', name: 'Browsers', slug: 'browsers' },
      packages: [],
    };

    describe('getAll', () => {
      it('should fetch all apps without params', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              apps: [mockApp],
              pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
            }),
        } as Response);

        const result = await apps.getAll();

        expect(fetch).toHaveBeenCalledWith('/api/apps', { method: 'GET' });
        expect(result.apps).toHaveLength(1);
        expect(result.pagination.total).toBe(1);
      });

      it('should fetch apps with limit param', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              apps: [mockApp],
              pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
            }),
        } as Response);

        await apps.getAll({ limit: 10 });

        expect(fetch).toHaveBeenCalledWith('/api/apps?limit=10', { method: 'GET' });
      });

      it('should fetch apps with offset param', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ apps: [], pagination: { total: 0, limit: 50, offset: 10, hasMore: false } }),
        } as Response);

        await apps.getAll({ offset: 10 });

        expect(fetch).toHaveBeenCalledWith('/api/apps?offset=10', { method: 'GET' });
      });

      it('should fetch apps with category param', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              apps: [mockApp],
              pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
            }),
        } as Response);

        await apps.getAll({ category: 'browsers' });

        expect(fetch).toHaveBeenCalledWith('/api/apps?category=browsers', { method: 'GET' });
      });

      it('should fetch apps with popular param', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              apps: [mockApp],
              pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
            }),
        } as Response);

        await apps.getAll({ popular: true });

        expect(fetch).toHaveBeenCalledWith('/api/apps?popular=true', { method: 'GET' });
      });

      it('should fetch apps with search param', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              apps: [mockApp],
              pagination: { total: 1, limit: 50, offset: 0, hasMore: false },
            }),
        } as Response);

        await apps.getAll({ search: 'firefox' });

        expect(fetch).toHaveBeenCalledWith('/api/apps?search=firefox', { method: 'GET' });
      });

      it('should fetch apps with multiple params', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              apps: [mockApp],
              pagination: { total: 1, limit: 10, offset: 5, hasMore: false },
            }),
        } as Response);

        await apps.getAll({
          limit: 10,
          offset: 5,
          category: 'browsers',
          popular: true,
          search: 'fire',
        });

        const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
        expect(fetchCall).toContain('limit=10');
        expect(fetchCall).toContain('offset=5');
        expect(fetchCall).toContain('category=browsers');
        expect(fetchCall).toContain('popular=true');
        expect(fetchCall).toContain('search=fire');
      });

      it('should not include false popular param', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              apps: [],
              pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
            }),
        } as Response);

        await apps.getAll({ popular: false });

        expect(fetch).toHaveBeenCalledWith('/api/apps', { method: 'GET' });
      });
    });

    describe('getByIds', () => {
      it('should fetch apps by IDs', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockApp]),
        } as Response);

        const result = await apps.getByIds(['app-1', 'app-2']);

        expect(fetch).toHaveBeenCalledWith('/api/apps/batch?ids=app-1%2Capp-2', { method: 'GET' });
        expect(result).toEqual([mockApp]);
      });

      it('should return empty array for empty IDs array', async () => {
        const result = await apps.getByIds([]);

        expect(fetch).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should handle single ID', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockApp]),
        } as Response);

        await apps.getByIds(['app-1']);

        expect(fetch).toHaveBeenCalledWith('/api/apps/batch?ids=app-1', { method: 'GET' });
      });
    });

    describe('getById', () => {
      it('should fetch app by ID', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApp),
        } as Response);

        const result = await apps.getById('app-1');

        expect(fetch).toHaveBeenCalledWith('/api/apps/app-1', { method: 'GET' });
        expect(result).toEqual(mockApp);
      });
    });

    describe('getBySlug', () => {
      it('should fetch app by slug', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockApp),
        } as Response);

        const result = await apps.getBySlug('firefox');

        expect(fetch).toHaveBeenCalledWith('/api/apps/slug/firefox', { method: 'GET' });
        expect(result).toEqual(mockApp);
      });
    });
  });

  describe('categories API', () => {
    const mockCategory = {
      id: 'cat-1',
      name: 'Browsers',
      slug: 'browsers',
      displayOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    describe('getAll', () => {
      it('should fetch all categories', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockCategory]),
        } as Response);

        const result = await categories.getAll();

        expect(fetch).toHaveBeenCalledWith('/api/categories', { method: 'GET' });
        expect(result).toEqual([mockCategory]);
      });

      it('should return empty array when no categories', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);

        const result = await categories.getAll();

        expect(result).toEqual([]);
      });
    });

    describe('getById', () => {
      it('should fetch category by ID', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCategory),
        } as Response);

        const result = await categories.getById('cat-1');

        expect(fetch).toHaveBeenCalledWith('/api/categories/cat-1', { method: 'GET' });
        expect(result).toEqual(mockCategory);
      });
    });
  });

  describe('distros API', () => {
    const mockDistro = {
      id: 'distro-1',
      name: 'Ubuntu',
      slug: 'ubuntu',
      family: 'debian',
      iconUrl: 'https://example.com/ubuntu.png',
      basedOn: null,
      isPopular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    describe('getAll', () => {
      it('should fetch all distros', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockDistro]),
        } as Response);

        const result = await distros.getAll();

        expect(fetch).toHaveBeenCalledWith('/api/distros', { method: 'GET' });
        expect(result).toEqual([mockDistro]);
      });
    });

    describe('getById', () => {
      it('should fetch distro by ID', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDistro),
        } as Response);

        const result = await distros.getById('distro-1');

        expect(fetch).toHaveBeenCalledWith('/api/distros/distro-1', { method: 'GET' });
        expect(result).toEqual(mockDistro);
      });
    });

    describe('getBySlug', () => {
      it('should fetch distro by slug', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockDistro),
        } as Response);

        const result = await distros.getBySlug('ubuntu');

        expect(fetch).toHaveBeenCalledWith('/api/distros/slug/ubuntu', { method: 'GET' });
        expect(result).toEqual(mockDistro);
      });
    });
  });

  describe('sources API', () => {
    const mockSource = {
      id: 'source-1',
      name: 'APT',
      slug: 'apt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    describe('getAll', () => {
      it('should fetch all sources', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([mockSource]),
        } as Response);

        const result = await sources.getAll();

        expect(fetch).toHaveBeenCalledWith('/api/sources', { method: 'GET' });
        expect(result).toEqual([mockSource]);
      });
    });

    describe('getById', () => {
      it('should fetch source by ID', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockSource),
        } as Response);

        const result = await sources.getById('source-1');

        expect(fetch).toHaveBeenCalledWith('/api/sources/source-1', { method: 'GET' });
        expect(result).toEqual(mockSource);
      });
    });
  });

  describe('commands API', () => {
    describe('generate', () => {
      const mockCommandResponse = {
        commands: ['sudo apt install firefox'],
        setupCommands: [],
        warnings: [],
        breakdown: [{ source: 'apt', packages: ['firefox'] }],
      };

      it('should generate commands with required params', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommandResponse),
        } as Response);

        const result = await commands.generate({
          distroSlug: 'ubuntu',
          appIds: ['app-1'],
        });

        expect(fetch).toHaveBeenCalledWith('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ distroSlug: 'ubuntu', appIds: ['app-1'] }),
        });
        expect(result).toEqual(mockCommandResponse);
      });

      it('should generate commands with source preference', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommandResponse),
        } as Response);

        await commands.generate({
          distroSlug: 'ubuntu',
          appIds: ['app-1'],
          sourcePreference: 'flatpak',
        });

        expect(fetch).toHaveBeenCalledWith('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distroSlug: 'ubuntu',
            appIds: ['app-1'],
            sourcePreference: 'flatpak',
          }),
        });
      });

      it('should generate commands with nixos install method', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommandResponse),
        } as Response);

        await commands.generate({
          distroSlug: 'nixos',
          appIds: ['app-1'],
          nixosInstallMethod: 'nix-flakes',
        });

        expect(fetch).toHaveBeenCalledWith('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distroSlug: 'nixos',
            appIds: ['app-1'],
            nixosInstallMethod: 'nix-flakes',
          }),
        });
      });

      it('should generate commands with all params', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockCommandResponse),
        } as Response);

        await commands.generate({
          distroSlug: 'nixos',
          appIds: ['app-1', 'app-2'],
          sourcePreference: 'nixpkgs',
          nixosInstallMethod: 'nix-env',
        });

        expect(fetch).toHaveBeenCalledWith('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            distroSlug: 'nixos',
            appIds: ['app-1', 'app-2'],
            sourcePreference: 'nixpkgs',
            nixosInstallMethod: 'nix-env',
          }),
        });
      });

      it('should handle empty appIds array', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              commands: [],
              setupCommands: [],
              warnings: [],
              breakdown: [],
            }),
        } as Response);

        await commands.generate({
          distroSlug: 'ubuntu',
          appIds: [],
        });

        expect(fetch).toHaveBeenCalledWith('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ distroSlug: 'ubuntu', appIds: [] }),
        });
      });
    });
  });
});
