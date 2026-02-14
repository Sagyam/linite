import { describe, it, expect, beforeEach, beforeAll, afterAll, vi, type Mock } from 'vitest';
import { searchFlathub } from './flathub';

global.fetch = vi.fn() as Mock;

describe('Flathub API Client', () => {
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

      (global.fetch as Mock).mockResolvedValueOnce({
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
      (global.fetch as Mock).mockResolvedValueOnce({
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
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(searchFlathub('firefox')).rejects.toThrow(
        'Failed to search Flathub: Flathub API error: 500 Internal Server Error'
      );
    });

    it('should throw error on network failure', async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(searchFlathub('firefox')).rejects.toThrow(
        'Failed to search Flathub: Network error'
      );
    });

    it('should cache search results', async () => {
      const mockResponse = {
        hits: [{ app_id: 'test', name: 'Test', summary: 'Test app' }],
        query: 'test',
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result1 = await searchFlathub('test');
      const result2 = await searchFlathub('test');

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('should cache search with case-insensitive keys', async () => {
      const mockResponse = {
        hits: [{ app_id: 'test', name: 'Test', summary: 'Test app' }],
        query: 'test',
      };

      (global.fetch as Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await searchFlathub('Firefox');
      await searchFlathub('firefox');
      await searchFlathub('FIREFOX');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});
