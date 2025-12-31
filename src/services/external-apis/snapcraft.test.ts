import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  searchSnapcraft,
  getSnapcraftPackageMetadata,
  checkSnapcraftAvailability,
  clearSnapcraftCache,
} from './snapcraft';

// Mock fetch globally
global.fetch = vi.fn() as Mock;

describe('Snapcraft API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSnapcraftCache();
  });

  describe('searchSnapcraft', () => {
    it('should search for snaps successfully', async () => {
      const mockResponse = {
        results: [
          {
            snap: {
              name: 'firefox',
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
          },
          {
            snap: {
              name: 'chromium',
              title: 'Chromium',
              summary: 'Chromium web browser',
              media: [
                { type: 'icon', url: 'https://example.com/chromium.png' },
              ],
            },
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchSnapcraft('browser');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        identifier: 'firefox',
        name: 'Firefox',
        summary: 'Mozilla Firefox web browser',
        description: 'Full description of Firefox',
        homepage: 'https://www.mozilla.org/firefox',
        iconUrl: 'https://example.com/icon.png',
        license: 'MPL-2.0',
        maintainer: 'Mozilla',
        downloadSize: 75000000,
        source: 'snap',
      });

      // Verify request parameters
      const fetchUrl = (global.fetch as Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('q=browser');
      expect(fetchUrl).toContain('scope=wide');

      const headers = (global.fetch as Mock).mock.calls[0][1].headers;
      expect(headers['Snap-Device-Series']).toBe('16');
    });

    it('should handle snaps with fallback title', async () => {
      const mockResponse = {
        results: [
          {
            snap: {
              name: 'test-snap',
              // No title provided
              summary: 'Test snap',
            },
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchSnapcraft('test');

      expect(results[0].name).toBe('test-snap'); // Falls back to name
    });

    it('should handle snaps with fallback publisher', async () => {
      const mockResponse = {
        results: [
          {
            snap: {
              name: 'test-snap',
              title: 'Test',
              summary: 'Test snap',
              publisher: {
                username: 'testuser',
                // No display-name
              },
            },
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchSnapcraft('test');

      expect(results[0].maintainer).toBe('testuser');
    });

    it('should throw error for empty query', async () => {
      await expect(searchSnapcraft('')).rejects.toThrow('Search query is required');
      await expect(searchSnapcraft('   ')).rejects.toThrow('Search query is required');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchSnapcraft('test')).rejects.toThrow(
        'Failed to search Snapcraft: Snapcraft API error: 500 Internal Server Error'
      );
    });

    it('should cache search results', async () => {
      const mockResponse = {
        results: [
          {
            snap: {
              name: 'test',
              title: 'Test',
              summary: 'Test snap',
            },
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await searchSnapcraft('test');
      await searchSnapcraft('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should extract icon from media array', async () => {
      const mockResponse = {
        results: [
          {
            snap: {
              name: 'test',
              title: 'Test',
              summary: 'Test',
              media: [
                { type: 'screenshot', url: 'https://example.com/screen.png' },
                { type: 'icon', url: 'https://example.com/icon.png' },
                { type: 'banner', url: 'https://example.com/banner.png' },
              ],
            },
          },
        ],
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const results = await searchSnapcraft('test');

      expect(results[0].iconUrl).toBe('https://example.com/icon.png');
    });
  });

  describe('getSnapcraftPackageMetadata', () => {
    it('should fetch snap metadata successfully', async () => {
      const mockResponse = {
        'channel-map': [
          {
            channel: { name: 'stable', track: 'latest', risk: 'stable' },
            version: '1.2.3',
            'released-at': '2024-01-15T10:00:00Z',
          },
          {
            channel: { name: 'edge', track: 'latest', risk: 'edge' },
            version: '1.2.4-dev',
            'released-at': '2024-01-16T10:00:00Z',
          },
        ],
        snap: {
          name: 'firefox',
          title: 'Firefox',
          summary: 'Mozilla Firefox',
          description: 'Full description',
          publisher: {
            'display-name': 'Mozilla',
          },
          media: [
            { type: 'icon', url: 'https://example.com/icon.png' },
            { type: 'screenshot', url: 'https://example.com/screen1.png' },
            { type: 'screenshot', url: 'https://example.com/screen2.png' },
          ],
          license: 'MPL-2.0',
          website: 'https://firefox.com',
          categories: [{ name: 'productivity' }, { name: 'utilities' }],
          'download-size': 80000000,
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getSnapcraftPackageMetadata('firefox');

      expect(metadata).toEqual({
        identifier: 'firefox',
        name: 'Firefox',
        summary: 'Mozilla Firefox',
        description: 'Full description',
        version: '1.2.3', // From stable channel
        homepage: 'https://firefox.com',
        iconUrl: 'https://example.com/icon.png',
        license: 'MPL-2.0',
        maintainer: 'Mozilla',
        downloadSize: 80000000,
        categories: ['productivity', 'utilities'],
        screenshots: [
          'https://example.com/screen1.png',
          'https://example.com/screen2.png',
        ],
        releaseDate: '2024-01-15T10:00:00Z',
        source: 'snap',
        metadata: {
          channels: mockResponse['channel-map'],
        },
      });
    });

    it('should handle snap without stable channel', async () => {
      const mockResponse = {
        'channel-map': [
          {
            channel: { name: 'edge', track: 'latest', risk: 'edge' },
            version: '2.0.0-dev',
            'released-at': '2024-01-16T10:00:00Z',
          },
        ],
        snap: {
          name: 'test',
          title: 'Test',
          summary: 'Test snap',
          description: 'Test description',
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getSnapcraftPackageMetadata('test');

      expect(metadata?.version).toBeUndefined();
      expect(metadata?.releaseDate).toBeUndefined();
    });

    it('should return null for 404 not found', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const metadata = await getSnapcraftPackageMetadata('non-existent');
      expect(metadata).toBeNull();
    });

    it('should throw error for non-404 API errors', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getSnapcraftPackageMetadata('test')).rejects.toThrow(
        'Failed to fetch Snapcraft package metadata: Snapcraft API error: 500 Internal Server Error'
      );
    });

    it('should throw error for empty snap name', async () => {
      await expect(getSnapcraftPackageMetadata('')).rejects.toThrow('Snap name is required');
      await expect(getSnapcraftPackageMetadata('   ')).rejects.toThrow('Snap name is required');
    });

    it('should cache metadata results', async () => {
      const mockResponse = {
        'channel-map': [],
        snap: {
          name: 'test',
          title: 'Test',
          summary: 'Test',
          description: 'Test',
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getSnapcraftPackageMetadata('test');
      await getSnapcraftPackageMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should URL encode the snap name', async () => {
      const mockResponse = {
        'channel-map': [],
        snap: {
          name: 'test app',
          title: 'Test',
          summary: 'Test',
          description: 'Test',
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await getSnapcraftPackageMetadata('test app');

      const fetchUrl = (global.fetch as Mock).mock.calls[0][0];
      expect(fetchUrl).toContain('test%20app');
    });

    it('should filter screenshots from media', async () => {
      const mockResponse = {
        'channel-map': [],
        snap: {
          name: 'test',
          title: 'Test',
          summary: 'Test',
          description: 'Test',
          media: [
            { type: 'icon', url: 'https://example.com/icon.png' },
            { type: 'screenshot', url: 'https://example.com/screen1.png' },
            { type: 'banner', url: 'https://example.com/banner.png' },
            { type: 'screenshot', url: 'https://example.com/screen2.png' },
          ],
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const metadata = await getSnapcraftPackageMetadata('test');

      expect(metadata?.screenshots).toEqual([
        'https://example.com/screen1.png',
        'https://example.com/screen2.png',
      ]);
    });
  });

  describe('checkSnapcraftAvailability', () => {
    it('should return true if snap exists', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'channel-map': [],
          snap: {
            name: 'test',
            title: 'Test',
            summary: 'Test',
            description: 'Test',
          },
        }),
      });

      const isAvailable = await checkSnapcraftAvailability('test');
      expect(isAvailable).toBe(true);
    });

    it('should return false if snap does not exist', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const isAvailable = await checkSnapcraftAvailability('non-existent');
      expect(isAvailable).toBe(false);
    });

    it('should return false on API error', async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const isAvailable = await checkSnapcraftAvailability('test');
      expect(isAvailable).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await checkSnapcraftAvailability('test');
      expect(isAvailable).toBe(false);
    });
  });

  describe('clearSnapcraftCache', () => {
    it('should clear both search and metadata caches', async () => {
      const mockSearchResponse = {
        results: [
          {
            snap: {
              name: 'test',
              title: 'Test',
              summary: 'Test',
            },
          },
        ],
      };

      const mockMetadataResponse = {
        'channel-map': [],
        snap: {
          name: 'test',
          title: 'Test',
          summary: 'Test',
          description: 'Test',
        },
      };

      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMetadataResponse });

      await searchSnapcraft('test');
      await getSnapcraftPackageMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);

      clearSnapcraftCache();

      (global.fetch as Mock)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMetadataResponse });

      await searchSnapcraft('test');
      await getSnapcraftPackageMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });
});
