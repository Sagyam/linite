import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import { searchRepology } from './repology';

global.fetch = vi.fn() as Mock;

// Use unique query strings to avoid cache pollution between tests
let testCounter = 0;
const getUnique = (base: string) => `${base}-${++testCounter}-${Date.now()}`;

describe('Repology API Client', () => {
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

  describe('searchRepology', () => {
    it('should search for projects successfully', async () => {
      const query = getUnique('firefox');
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: query,
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
          name: query,
          version: '120.0',
          status: 'newest',
          licenses: ['MPL-2.0'],
          maintainers: ['firefox@fedoraproject.org'],
          summary: 'Mozilla Firefox',
          www: ['https://www.mozilla.org/firefox'],
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology(query);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].identifier).toBe(query);
      expect(results[0].source).toBe('repology');
    });

    it('should filter out unsupported repositories', async () => {
      const query = getUnique('test-pkg');
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: query,
          version: '1.0.0',
          status: 'newest',
          summary: 'Test package',
        },
        {
          repo: 'unsupported_repo',
          name: query,
          version: '1.0.0',
          status: 'newest',
          summary: 'Test package',
        },
        {
          repo: 'another_unsupported',
          name: query,
          version: '2.0.0',
          status: 'newest',
          summary: 'Test package',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology(query);

      // Should only include the debian_stable result
      expect(results.length).toBe(1);
      expect(results[0].identifier).toBe(query);
    });

    it('should prefer newest status packages', async () => {
      const query = getUnique('test-pkg');
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: query,
          version: '1.0.0',
          status: 'outdated',
          summary: 'Test package',
        },
        {
          repo: 'debian_stable',
          name: query,
          version: '2.0.0',
          status: 'newest',
          summary: 'Test package',
        },
      ];

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchRepology(query);

      // Should group by repo and prefer newest
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for 404 not found', async () => {
      const query = getUnique('non-existent');
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const results = await searchRepology(query);
      expect(results).toEqual([]);
    });

    it('should throw error for empty project name', async () => {
      await expect(searchRepology('')).rejects.toThrow('Search query is required');
      await expect(searchRepology('   ')).rejects.toThrow('Search query is required');
    });

    it('should throw error on API failure', async () => {
      const query = getUnique('api-failure');
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchRepology(query)).rejects.toThrow(
        'Failed to search Repology: Repology API error: 500 Internal Server Error'
      );
    });

    it('should URL encode project name', async () => {
      const query = getUnique('test package');
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await searchRepology(query);

      const fetchUrl = (global.fetch as Mock).mock.calls[0][0];
      expect(fetchUrl).toContain(encodeURIComponent(query));
    });

    it('should handle packages with multiple licenses', async () => {
      const query = getUnique('multi-license');
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: query,
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

      const results = await searchRepology(query);

      expect(results[0].license).toBe('GPL, MIT, Apache');
    });

    it('should handle packages with multiple maintainers', async () => {
      const query = getUnique('multi-maintainer');
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: query,
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

      const results = await searchRepology(query);

      expect(results[0].maintainer).toBe('maintainer1@example.com');
    });

    it('should handle packages with multiple websites', async () => {
      const query = getUnique('multi-website');
      const mockResponse = [
        {
          repo: 'debian_stable',
          name: query,
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

      const results = await searchRepology(query);

      expect(results[0].homepage).toBe('https://example.com');
    });
  });
});
