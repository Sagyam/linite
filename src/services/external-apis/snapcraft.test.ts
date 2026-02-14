import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import { searchSnapcraft } from './snapcraft';

global.fetch = vi.fn() as Mock;

// Use unique strings to avoid cache pollution between tests
let testCounter = 0;
const getUnique = (base: string) => `${base}-${++testCounter}-${Date.now()}`;

describe('Snapcraft API Client', () => {
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

  describe('searchSnapcraft', () => {
    it('should search for snaps successfully', async () => {
      const query = getUnique('browser');
      const snapName1 = getUnique('firefox');
      const snapName2 = getUnique('chromium');

      const mockSearchResponse = {
        results: [
          { name: snapName1, 'snap-id': 'firefox-id' },
          { name: snapName2, 'snap-id': 'chromium-id' },
        ],
      };

      const mockFirefoxDetails = {
        'channel-map': [
          {
            channel: { name: 'stable', track: 'latest', risk: 'stable' },
            version: '120.0',
            'released-at': '2024-01-15T10:00:00Z',
          },
        ],
        snap: {
          name: snapName1,
          title: 'Firefox',
          summary: 'Mozilla Firefox web browser',
          description: 'Full description of Firefox',
          publisher: {
            'display-name': 'Mozilla',
            username: 'mozilla',
          },
          media: [
            { type: 'icon', url: 'https://example.com/icon.png' },
            { type: 'screenshot', url: 'https://example.com/screen.png' },
          ],
          license: 'MPL-2.0',
          website: 'https://www.mozilla.org/firefox',
          'download-size': 75000000,
        },
      };

      const mockChromiumDetails = {
        'channel-map': [],
        snap: {
          name: snapName2,
          title: 'Chromium',
          summary: 'Chromium web browser',
          description: 'Chromium browser',
          media: [
            { type: 'icon', url: 'https://example.com/chromium.png' },
          ],
        },
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFirefoxDetails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChromiumDetails,
        });

      const results = await searchSnapcraft(query);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        identifier: snapName1,
        name: 'Firefox',
        summary: 'Mozilla Firefox web browser',
        description: 'Full description of Firefox',
        homepage: 'https://www.mozilla.org/firefox',
        iconUrl: 'https://example.com/icon.png',
        license: 'MPL-2.0',
        maintainer: 'Mozilla',
        downloadSize: 75000000,
        version: '120.0',
        source: 'snap',
      });

      const searchUrl = (global.fetch as Mock).mock.calls[0][0];
      expect(searchUrl).toContain('q=');

      const headers = (global.fetch as Mock).mock.calls[0][1].headers;
      expect(headers['Snap-Device-Series']).toBe('16');
    });

    it('should handle snaps with fallback title', async () => {
      const query = getUnique('fallback-title');
      const snapName = getUnique('test-snap');

      const mockSearchResponse = {
        results: [{ name: snapName, 'snap-id': 'test-id' }],
      };

      const mockDetailsResponse = {
        'channel-map': [],
        snap: {
          name: snapName,
          summary: 'Test snap',
          description: 'Test description',
        },
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailsResponse,
        });

      const results = await searchSnapcraft(query);

      expect(results[0].name).toBe(snapName);
    });

    it('should handle snaps with fallback publisher', async () => {
      const query = getUnique('fallback-publisher');
      const snapName = getUnique('test-snap');

      const mockSearchResponse = {
        results: [{ name: snapName, 'snap-id': 'test-id' }],
      };

      const mockDetailsResponse = {
        'channel-map': [],
        snap: {
          name: snapName,
          title: 'Test',
          summary: 'Test snap',
          description: 'Test description',
          publisher: {
            username: 'testuser',
          },
        },
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailsResponse,
        });

      const results = await searchSnapcraft(query);

      expect(results[0].maintainer).toBe('testuser');
    });

    it('should throw error for empty query', async () => {
      await expect(searchSnapcraft('')).rejects.toThrow('Search query is required');
      await expect(searchSnapcraft('   ')).rejects.toThrow('Search query is required');
    });

    it('should throw error on API failure', async () => {
      const query = getUnique('api-failure');
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchSnapcraft(query)).rejects.toThrow(
        'Failed to search Snapcraft: Snapcraft API error: 500 Internal Server Error'
      );
    });

    it('should cache search results', async () => {
      const query = getUnique('cache-test');
      const snapName = getUnique('test');

      const mockSearchResponse = {
        results: [{ name: snapName, 'snap-id': 'test-id' }],
      };

      const mockDetailsResponse = {
        'channel-map': [],
        snap: {
          name: snapName,
          title: 'Test',
          summary: 'Test snap',
          description: 'Test description',
        },
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailsResponse,
        });

      await searchSnapcraft(query);
      await searchSnapcraft(query);

      // Should only call fetch twice (1 search + 1 detail), not 4 times
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should extract icon from media array', async () => {
      const query = getUnique('icon-extraction');
      const snapName = getUnique('test');

      const mockSearchResponse = {
        results: [{ name: snapName, 'snap-id': 'test-id' }],
      };

      const mockDetailsResponse = {
        'channel-map': [],
        snap: {
          name: snapName,
          title: 'Test',
          summary: 'Test',
          description: 'Test description',
          media: [
            { type: 'screenshot', url: 'https://example.com/screen.png' },
            { type: 'icon', url: 'https://example.com/icon.png' },
            { type: 'banner', url: 'https://example.com/banner.png' },
          ],
        },
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSearchResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockDetailsResponse,
        });

      const results = await searchSnapcraft(query);

      expect(results[0].iconUrl).toBe('https://example.com/icon.png');
    });
  });
});
