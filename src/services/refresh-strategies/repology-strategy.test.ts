import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RepologyRefreshStrategy } from './repology-strategy';

// Mock fetch
global.fetch = vi.fn();

describe('RepologyRefreshStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Sample Repology response data
  const createRepologyPackage = (repo: string, version: string, status: 'newest' | 'outdated' | 'ignored' | 'unique' | 'devel' | 'legacy' = 'newest') => ({
    repo,
    name: 'firefox',
    version,
    status,
    origversion: version,
    licenses: ['MPL-2.0'],
    maintainers: ['maintainer@example.com'],
    categories: ['www'],
    summary: 'Mozilla Firefox web browser',
    www: ['https://www.mozilla.org/firefox/'],
  });

  describe('constructor', () => {
    it('should create strategy with source slug', () => {
      const strategy = new RepologyRefreshStrategy('apt');
      expect(strategy).toBeDefined();
    });
  });

  describe('getMetadata', () => {
    describe('APT source (Debian/Ubuntu family)', () => {
      it('should return metadata for Debian packages', async () => {
        const mockPackages = [
          createRepologyPackage('debian_stable', '120.0'),
          createRepologyPackage('ubuntu_22_04', '120.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
        expect(result?.version).toBe('120.0');
        expect(result?.source).toBe('repology');
      });

      it('should filter to only include apt-compatible repos', async () => {
        const mockPackages = [
          createRepologyPackage('debian_stable', '120.0'),
          createRepologyPackage('arch', '121.0'), // Should be filtered out
          createRepologyPackage('ubuntu_22_04', '119.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result?.metadata?.availableRepos).toEqual([
          { repo: 'debian_stable', version: '120.0', status: 'newest' },
          { repo: 'ubuntu_22_04', version: '119.0', status: 'newest' },
        ]);
      });

      it('should match linuxmint repos', async () => {
        const mockPackages = [
          createRepologyPackage('linuxmint_21', '120.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
      });

      it('should match pop_os repos', async () => {
        const mockPackages = [
          createRepologyPackage('pop_os', '120.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
      });

      it('should match raspbian repos', async () => {
        const mockPackages = [
          createRepologyPackage('raspbian_stable', '120.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
      });
    });

    describe('DNF source (RHEL/Fedora family)', () => {
      it('should return metadata for Fedora packages', async () => {
        const mockPackages = [
          createRepologyPackage('fedora_39', '120.0'),
          createRepologyPackage('centos_stream_9', '115.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('dnf');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
        expect(result?.metadata?.availableRepos?.length).toBe(2);
      });

      it('should match rocky linux repos', async () => {
        const mockPackages = [
          createRepologyPackage('rocky_9', '115.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('dnf');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
      });

      it('should match alma linux repos', async () => {
        const mockPackages = [
          createRepologyPackage('alma_9', '115.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('dnf');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
      });
    });

    describe('Pacman source (Arch family)', () => {
      it('should return metadata for Arch packages', async () => {
        const mockPackages = [
          createRepologyPackage('arch', '121.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('pacman');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
        expect(result?.version).toBe('121.0');
      });

      it('should NOT match AUR repos', async () => {
        const mockPackages = [
          createRepologyPackage('aur', '122.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('pacman');
        const result = await strategy.getMetadata('firefox');

        // Should be null because 'aur' doesn't match /^(arch)$/i
        expect(result).toBeNull();
      });
    });

    describe('Zypper source (openSUSE family)', () => {
      it('should return metadata for openSUSE packages', async () => {
        const mockPackages = [
          createRepologyPackage('opensuse_tumbleweed', '121.0'),
          createRepologyPackage('opensuse_leap_15_5', '115.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('zypper');
        const result = await strategy.getMetadata('firefox');

        expect(result).not.toBeNull();
        expect(result?.metadata?.availableRepos?.length).toBe(2);
      });
    });

    describe('package status selection', () => {
      it('should prefer newest status package', async () => {
        const mockPackages = [
          createRepologyPackage('debian_stable', '115.0', 'outdated'),
          createRepologyPackage('debian_testing', '120.0', 'newest'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result?.version).toBe('120.0');
        expect(result?.metadata?.status).toBe('newest');
      });

      it('should fallback to first package when no newest status', async () => {
        const mockPackages = [
          createRepologyPackage('debian_oldstable', '110.0', 'legacy'),
          createRepologyPackage('debian_stable', '115.0', 'outdated'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result?.version).toBe('110.0');
        expect(result?.metadata?.status).toBe('legacy');
      });
    });

    describe('metadata extraction', () => {
      it('should extract all available metadata fields', async () => {
        const mockPackages = [
          {
            repo: 'debian_stable',
            name: 'firefox',
            version: '120.0',
            status: 'newest' as const,
            origversion: '120.0-1',
            licenses: ['MPL-2.0', 'GPL-3.0'],
            maintainers: ['maintainer1@example.com', 'maintainer2@example.com'],
            categories: ['www', 'browsers'],
            summary: 'Mozilla Firefox web browser',
            www: ['https://www.mozilla.org/firefox/', 'https://firefox.com/'],
          },
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result).toEqual({
          identifier: 'firefox',
          name: 'firefox',
          summary: 'Mozilla Firefox web browser',
          version: '120.0',
          homepage: 'https://www.mozilla.org/firefox/',
          license: 'MPL-2.0, GPL-3.0',
          maintainer: 'maintainer1@example.com',
          categories: ['www', 'browsers'],
          source: 'repology',
          metadata: {
            repo: 'debian_stable',
            status: 'newest',
            origversion: '120.0-1',
            allLicenses: ['MPL-2.0', 'GPL-3.0'],
            allMaintainers: ['maintainer1@example.com', 'maintainer2@example.com'],
            availableRepos: [
              { repo: 'debian_stable', version: '120.0', status: 'newest' },
            ],
          },
        });
      });

      it('should handle missing optional fields', async () => {
        const mockPackages = [
          {
            repo: 'debian_stable',
            name: 'simple-package',
            version: '1.0',
            status: 'newest' as const,
          },
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('simple-package');

        expect(result?.summary).toBeUndefined();
        expect(result?.homepage).toBeUndefined();
        expect(result?.license).toBeUndefined();
        expect(result?.maintainer).toBeUndefined();
        expect(result?.categories).toBeUndefined();
      });
    });

    describe('error handling', () => {
      it('should return null when package not found (404)', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: false,
          status: 404,
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('nonexistent-package');

        expect(result).toBeNull();
      });

      it('should return null on API error (catch block)', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should return null when response is empty array', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('empty-result');

        expect(result).toBeNull();
      });

      it('should return null when no matching repos found', async () => {
        const mockPackages = [
          createRepologyPackage('freebsd', '120.0'),
          createRepologyPackage('macos_homebrew', '120.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        const result = await strategy.getMetadata('firefox');

        expect(result).toBeNull();
      });

      it('should return null for unknown source slug', async () => {
        const mockPackages = [
          createRepologyPackage('debian_stable', '120.0'),
        ];

        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPackages),
        } as Response);

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const strategy = new RepologyRefreshStrategy('unknown-source');
        const result = await strategy.getMetadata('firefox');

        expect(result).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith('No repo pattern defined for source: unknown-source');

        consoleSpy.mockRestore();
      });
    });

    describe('API request', () => {
      it('should call correct Repology API endpoint', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([createRepologyPackage('debian_stable', '120.0')]),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        await strategy.getMetadata('firefox');

        expect(fetch).toHaveBeenCalledWith(
          'https://repology.org/api/v1/project/firefox',
          expect.objectContaining({
            headers: {
              'Accept': 'application/json',
              'User-Agent': expect.stringContaining('Linite'),
            },
          })
        );
      });

      it('should URL encode the identifier', async () => {
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);

        const strategy = new RepologyRefreshStrategy('apt');
        await strategy.getMetadata('package+special/chars');

        expect(fetch).toHaveBeenCalledWith(
          'https://repology.org/api/v1/project/package%2Bspecial%2Fchars',
          expect.any(Object)
        );
      });
    });
  });

  describe('checkAvailability', () => {
    it('should return true when package has metadata', async () => {
      const mockPackages = [createRepologyPackage('debian_stable', '120.0')];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPackages),
      } as Response);

      const strategy = new RepologyRefreshStrategy('apt');
      const result = await strategy.checkAvailability('firefox');

      expect(result).toBe(true);
    });

    it('should return false when package has no metadata', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);

      const strategy = new RepologyRefreshStrategy('apt');
      const result = await strategy.checkAvailability('nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when no matching repos found', async () => {
      const mockPackages = [createRepologyPackage('freebsd', '120.0')];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPackages),
      } as Response);

      const strategy = new RepologyRefreshStrategy('apt');
      const result = await strategy.checkAvailability('firefox');

      expect(result).toBe(false);
    });
  });
});
