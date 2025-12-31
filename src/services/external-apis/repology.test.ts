import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  searchRepology,
  getRepologyProjectMetadata,
  getRepologyPackagesForDistro,
  clearRepologyCache,
} from './repology';

// Mock fetch globally
global.fetch = vi.fn() as Mock;

describe('Repology API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearRepologyCache();
  });

  describe('searchRepology', () => {
    it('should search for projects successfully', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'firefox',
          version: '115.0',
          status: 'newest',
          licenses: ['MPL-2.0'],
          maintainers: ['debian-mozilla@lists.debian.org'],
          categories: ['www-client'],
          summary: 'Mozilla Firefox web browser',
          www: ['https://www.mozilla.org/firefox'],
        },
        {
          repo: 'fedora_39',
          name: 'firefox',
          version: '120.0',
          status: 'newest',
          licenses: ['MPL-2.0'],
          maintainers: ['firefox@fedoraproject.org'],
          summary: 'Mozilla Firefox',
          www: ['https://www.mozilla.org/firefox'],
        },
        {
          repo: 'flathub',
          name: 'org.mozilla.firefox',
          version: '121.0',
          status: 'newest',
          licenses: ['MPL-2.0'],
          summary: 'Firefox Browser',
          www: ['https://firefox.com'],
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology('firefox');

      expect(results.length).toBeGreaterThan(0);

      // Check that we got results from supported repos
      const debianResult = results.find(r => r.identifier === 'firefox');
      expect(debianResult).toBeDefined();
      expect(debianResult?.source).toBe('repology');
    });

    it('should filter out unsupported repositories', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test-pkg',
          version: '1.0.0',
          status: 'newest',
          summary: 'Test package',
        },
        {
          repo: 'unsupported_repo',
          name: 'test-pkg',
          version: '1.0.0',
          status: 'newest',
          summary: 'Test package',
        },
        {
          repo: 'another_unsupported',
          name: 'test-pkg',
          version: '2.0.0',
          status: 'newest',
          summary: 'Test package',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology('test-pkg');

      // Should only include the debian_stable result
      expect(results.length).toBe(1);
      expect(results[0].identifier).toBe('test-pkg');
    });

    it('should prefer newest status packages', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test-pkg',
          version: '1.0.0',
          status: 'outdated',
          summary: 'Test package',
        },
        {
          repo: 'debian_stable',
          name: 'test-pkg',
          version: '2.0.0',
          status: 'newest',
          summary: 'Test package',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology('test-pkg');

      // Should group by repo and prefer newest
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for 404 not found', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const results = await searchRepology('non-existent-project');
      expect(results).toEqual([]);
    });

    it('should throw error for empty project name', async () => {
      await expect(searchRepology('')).rejects.toThrow('Project name is required');
      await expect(searchRepology('   ')).rejects.toThrow('Project name is required');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchRepology('test')).rejects.toThrow(
        'Failed to search Repology: Repology API error: 500 Internal Server Error'
      );
    });

    it('should cache search results', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
          summary: 'Test',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchRepology('test');
      await searchRepology('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should URL encode project name', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await searchRepology('test package');

      const fetchUrl = (global.fetch as Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('test%20package');
    });

    it('should handle packages with multiple licenses', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'multi-license',
          version: '1.0.0',
          status: 'newest',
          licenses: ['GPL', 'MIT', 'Apache'],
          summary: 'Multi-licensed package',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology('multi-license');

      expect(results[0].license).toBe('GPL, MIT, Apache');
    });

    it('should handle packages with multiple maintainers', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
          maintainers: ['maintainer1@example.com', 'maintainer2@example.com'],
          summary: 'Test',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology('test');

      expect(results[0].maintainer).toBe('maintainer1@example.com');
    });

    it('should handle packages with multiple websites', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
          www: ['https://example.com', 'https://project.org'],
          summary: 'Test',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology('test');

      expect(results[0].homepage).toBe('https://example.com');
    });
  });

  describe('getRepologyProjectMetadata', () => {
    it('should fetch project metadata successfully', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'firefox',
          version: '115.0',
          status: 'newest',
          licenses: ['MPL-2.0'],
          maintainers: ['debian-mozilla@lists.debian.org'],
          categories: ['www-client', 'web-browser'],
          summary: 'Mozilla Firefox web browser',
          www: ['https://www.mozilla.org/firefox'],
        },
        {
          repo: 'fedora_39',
          name: 'firefox',
          version: '120.0',
          status: 'newest',
          licenses: ['MPL-2.0'],
          summary: 'Firefox',
        },
        {
          repo: 'arch',
          name: 'firefox',
          version: '121.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getRepologyProjectMetadata('firefox');

      expect(metadata).toEqual({
        identifier: 'firefox',
        name: 'firefox',
        summary: 'Mozilla Firefox web browser',
        version: '115.0',
        homepage: 'https://www.mozilla.org/firefox',
        license: 'MPL-2.0',
        maintainer: 'debian-mozilla@lists.debian.org',
        categories: ['www-client', 'web-browser'],
        source: 'repology',
        metadata: {
          availableRepos: [
            { repo: 'debian_stable', version: '115.0', status: 'newest' },
            { repo: 'fedora_39', version: '120.0', status: 'newest' },
            { repo: 'arch', version: '121.0', status: 'newest' },
          ],
        },
      });
    });

    it('should prefer newest status package', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'outdated',
          summary: 'Outdated version',
        },
        {
          repo: 'arch',
          name: 'test',
          version: '2.0.0',
          status: 'newest',
          summary: 'Newest version',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getRepologyProjectMetadata('test');

      expect(metadata?.version).toBe('2.0.0');
      expect(metadata?.summary).toBe('Newest version');
    });

    it('should fallback to first package if no newest status', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'outdated',
          summary: 'Test',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getRepologyProjectMetadata('test');

      expect(metadata?.version).toBe('1.0.0');
      expect(metadata?.identifier).toBe('test');
    });

    it('should return null for non-existent project', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const metadata = await getRepologyProjectMetadata('non-existent');
      expect(metadata).toBeNull();
    });

    it('should return null for empty response', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const metadata = await getRepologyProjectMetadata('empty');
      expect(metadata).toBeNull();
    });

    it('should throw error for empty project name', async () => {
      await expect(getRepologyProjectMetadata('')).rejects.toThrow('Project name is required');
    });

    it('should cache metadata results', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getRepologyProjectMetadata('test');
      await getRepologyProjectMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRepologyPackagesForDistro', () => {
    it('should filter packages for Debian family', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
        },
        {
          repo: 'ubuntu_24_04',
          name: 'test',
          version: '1.1.0',
          status: 'newest',
        },
        {
          repo: 'fedora_39',
          name: 'test',
          version: '2.0.0',
          status: 'newest',
        },
        {
          repo: 'arch',
          name: 'test',
          version: '2.1.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const packages = await getRepologyPackagesForDistro('test', 'debian');

      expect(packages).toHaveLength(2);
      expect(packages.some(p => p.repo === 'debian_stable')).toBe(true);
      expect(packages.some(p => p.repo === 'ubuntu_24_04')).toBe(true);
      expect(packages.some(p => p.repo === 'fedora_39')).toBe(false);
    });

    it('should filter packages for RHEL family', async () => {
      const mockResponse = [
        {
          repo: 'fedora_39',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
        },
        {
          repo: 'centos_stream_9',
          name: 'test',
          version: '1.1.0',
          status: 'newest',
        },
        {
          repo: 'debian_stable',
          name: 'test',
          version: '2.0.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const packages = await getRepologyPackagesForDistro('test', 'rhel');

      expect(packages.length).toBeGreaterThan(0);
      expect(packages.every(p => /^(fedora|centos|rhel)/i.test(p.repo))).toBe(true);
    });

    it('should filter packages for Arch family', async () => {
      const mockResponse = [
        {
          repo: 'arch',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
        },
        {
          repo: 'aur',
          name: 'test',
          version: '1.1.0',
          status: 'newest',
        },
        {
          repo: 'manjaro',
          name: 'test',
          version: '1.2.0',
          status: 'newest',
        },
        {
          repo: 'debian_stable',
          name: 'test',
          version: '2.0.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const packages = await getRepologyPackagesForDistro('test', 'arch');

      expect(packages.length).toBe(3);
      expect(packages.every(p => /^(arch|aur|manjaro)/i.test(p.repo))).toBe(true);
    });

    it('should filter packages for openSUSE family', async () => {
      const mockResponse = [
        {
          repo: 'opensuse_tumbleweed',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
        },
        {
          repo: 'opensuse_leap_15_5',
          name: 'test',
          version: '0.9.0',
          status: 'outdated',
        },
        {
          repo: 'debian_stable',
          name: 'test',
          version: '2.0.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const packages = await getRepologyPackagesForDistro('test', 'suse');

      expect(packages.length).toBe(2);
      expect(packages.every(p => /^opensuse/i.test(p.repo))).toBe(true);
    });

    it('should return empty array for non-existent project', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const packages = await getRepologyPackagesForDistro('non-existent', 'debian');
      expect(packages).toEqual([]);
    });

    it('should return empty array on error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const packages = await getRepologyPackagesForDistro('test', 'debian');
      expect(packages).toEqual([]);
    });

    it('should return empty array for unsupported distro family', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const packages = await getRepologyPackagesForDistro('test', 'unknown');
      expect(packages).toEqual([]);
    });
  });

  describe('clearRepologyCache', () => {
    it('should clear both search and metadata caches', async () => {
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: 'test',
          version: '1.0.0',
          status: 'newest',
        },
      ];

      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      await searchRepology('test');
      await getRepologyProjectMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);

      clearRepologyCache();

      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockResponse });

      await searchRepology('test');
      await getRepologyProjectMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });
});
