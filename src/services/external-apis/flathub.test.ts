import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  searchFlathub,
  getFlathubAppMetadata,
  checkFlathubAvailability,
  clearFlathubCache,
} from './flathub';

// Mock fetch globally
global.fetch = vi.fn();

describe('Flathub API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearFlathubCache();
  });

  afterEach(() => {
    clearFlathubCache();
  });

  describe('searchFlathub', () => {
    it('should search for apps successfully', async () => {
      const mockResponse = {
        hits: [
          {
            app_id: 'org.mozilla.firefox',
            name: 'Firefox',
            summary: 'Fast, private browser',
            icon: 'https://example.com/icon.png',
          },
          {
            app_id: 'org.chromium.Chromium',
            name: 'Chromium',
            summary: 'Open-source web browser',
          },
        ],
        query: 'browser',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const results = await searchFlathub('browser');

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        identifier: 'org.mozilla.firefox',
        name: 'Firefox',
        summary: 'Fast, private browser',
        iconUrl: 'https://example.com/icon.png',
        source: 'flatpak',
      });
      expect(results[1]).toEqual({
        identifier: 'org.chromium.Chromium',
        name: 'Chromium',
        summary: 'Open-source web browser',
        iconUrl: undefined,
        source: 'flatpak',
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://flathub.org/api/v2/search/browser',
        { headers: { Accept: 'application/json' } }
      );
    });

    it('should URL encode the search query', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hits: [], query: 'test query' }),
      });

      await searchFlathub('test query');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://flathub.org/api/v2/search/test%20query',
        expect.any(Object)
      );
    });

    it('should throw error for empty query', async () => {
      await expect(searchFlathub('')).rejects.toThrow('Search query is required');
      await expect(searchFlathub('   ')).rejects.toThrow('Search query is required');
    });

    it('should throw error on API failure', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchFlathub('firefox')).rejects.toThrow(
        'Failed to search Flathub: Flathub API error: 500 Internal Server Error'
      );
    });

    it('should throw error on network failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(searchFlathub('firefox')).rejects.toThrow(
        'Failed to search Flathub: Network error'
      );
    });

    it('should cache search results', async () => {
      const mockResponse = {
        hits: [{ app_id: 'test', name: 'Test', summary: 'Test app' }],
        query: 'test',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // First call should hit the API
      const result1 = await searchFlathub('test');
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await searchFlathub('test');
      expect(global.fetch).toHaveBeenCalledTimes(1); // Still 1 call
      expect(result1).toEqual(result2);
    });

    it('should cache search with case-insensitive keys', async () => {
      const mockResponse = {
        hits: [{ app_id: 'test', name: 'Test', summary: 'Test app' }],
        query: 'test',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await searchFlathub('Firefox');
      await searchFlathub('firefox');
      await searchFlathub('FIREFOX');

      // Should only call API once due to case-insensitive caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFlathubAppMetadata', () => {
    it('should fetch app metadata successfully', async () => {
      const mockAppData = {
        id: 'org.mozilla.firefox',
        name: 'Firefox',
        summary: 'Fast, private browser',
        description: 'Detailed description',
        projectLicense: 'MPL-2.0',
        homepageUrl: 'https://firefox.com',
        iconDesktopUrl: 'https://example.com/icon.png',
        currentReleaseVersion: '120.0',
        currentReleaseDate: '2024-01-15',
        developerName: 'Mozilla',
        categories: [{ name: 'Network' }, { name: 'WebBrowser' }],
        screenshots: [
          { imgDesktopUrl: 'https://example.com/screen1.png' },
          { imgMobileUrl: 'https://example.com/screen2.png' },
          { thumbUrl: 'https://example.com/thumb.png' },
        ],
        downloadFlatpakRefUrl: 'https://example.com/firefox.flatpakref',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppData,
      });

      const metadata = await getFlathubAppMetadata('org.mozilla.firefox');

      expect(metadata).toEqual({
        identifier: 'org.mozilla.firefox',
        name: 'Firefox',
        summary: 'Fast, private browser',
        description: 'Detailed description',
        version: '120.0',
        homepage: 'https://firefox.com',
        iconUrl: 'https://example.com/icon.png',
        license: 'MPL-2.0',
        maintainer: 'Mozilla',
        categories: ['Network', 'WebBrowser'],
        screenshots: [
          'https://example.com/screen1.png',
          'https://example.com/screen2.png',
          'https://example.com/thumb.png',
        ],
        releaseDate: '2024-01-15',
        source: 'flatpak',
        metadata: {
          downloadUrl: 'https://example.com/firefox.flatpakref',
        },
      });
    });

    it('should prefer desktop icon over mobile icon', async () => {
      const mockAppData = {
        id: 'test.app',
        name: 'Test',
        summary: 'Test',
        iconDesktopUrl: 'https://example.com/desktop.png',
        iconMobileUrl: 'https://example.com/mobile.png',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppData,
      });

      const metadata = await getFlathubAppMetadata('test.app');
      expect(metadata?.iconUrl).toBe('https://example.com/desktop.png');
    });

    it('should use mobile icon if desktop icon is not available', async () => {
      const mockAppData = {
        id: 'test.app',
        name: 'Test',
        summary: 'Test',
        iconMobileUrl: 'https://example.com/mobile.png',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppData,
      });

      const metadata = await getFlathubAppMetadata('test.app');
      expect(metadata?.iconUrl).toBe('https://example.com/mobile.png');
    });

    it('should return null for 404 not found', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const metadata = await getFlathubAppMetadata('non.existent.app');
      expect(metadata).toBeNull();
    });

    it('should throw error for non-404 API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(getFlathubAppMetadata('test.app')).rejects.toThrow(
        'Failed to fetch Flathub app metadata: Flathub API error: 500 Internal Server Error'
      );
    });

    it('should throw error for empty app ID', async () => {
      await expect(getFlathubAppMetadata('')).rejects.toThrow('App ID is required');
      await expect(getFlathubAppMetadata('   ')).rejects.toThrow('App ID is required');
    });

    it('should cache metadata results', async () => {
      const mockAppData = {
        id: 'test.app',
        name: 'Test',
        summary: 'Test app',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppData,
      });

      const result1 = await getFlathubAppMetadata('test.app');
      const result2 = await getFlathubAppMetadata('test.app');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should filter out empty screenshot URLs', async () => {
      const mockAppData = {
        id: 'test.app',
        name: 'Test',
        summary: 'Test',
        screenshots: [
          { imgDesktopUrl: 'https://example.com/valid.png' },
          { imgDesktopUrl: '' }, // Empty string
          {}, // No URLs
          { thumbUrl: 'https://example.com/thumb.png' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAppData,
      });

      const metadata = await getFlathubAppMetadata('test.app');
      expect(metadata?.screenshots).toEqual([
        'https://example.com/valid.png',
        'https://example.com/thumb.png',
      ]);
    });

    it('should URL encode the app ID', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'test', name: 'Test', summary: 'Test' }),
      });

      await getFlathubAppMetadata('org.example.Test App');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://flathub.org/api/v2/appstream/org.example.Test%20App',
        expect.any(Object)
      );
    });
  });

  describe('checkFlathubAvailability', () => {
    it('should return true if app exists', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'test.app',
          name: 'Test',
          summary: 'Test',
        }),
      });

      const isAvailable = await checkFlathubAvailability('test.app');
      expect(isAvailable).toBe(true);
    });

    it('should return false if app does not exist (404)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const isAvailable = await checkFlathubAvailability('non.existent');
      expect(isAvailable).toBe(false);
    });

    it('should return false on API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const isAvailable = await checkFlathubAvailability('test.app');
      expect(isAvailable).toBe(false);
    });

    it('should return false on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const isAvailable = await checkFlathubAvailability('test.app');
      expect(isAvailable).toBe(false);
    });
  });

  describe('clearFlathubCache', () => {
    it('should clear both search and metadata caches', async () => {
      const mockSearchResponse = {
        hits: [{ app_id: 'test', name: 'Test', summary: 'Test' }],
        query: 'test',
      };

      const mockMetadata = {
        id: 'test',
        name: 'Test',
        summary: 'Test',
      };

      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMetadata });

      // Populate caches
      await searchFlathub('test');
      await getFlathubAppMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(2);

      // Clear caches
      clearFlathubCache();

      // Next calls should hit the API again
      (global.fetch as any)
        .mockResolvedValueOnce({ ok: true, json: async () => mockSearchResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockMetadata });

      await searchFlathub('test');
      await getFlathubAppMetadata('test');

      expect(global.fetch).toHaveBeenCalledTimes(4);
    });
  });
});
