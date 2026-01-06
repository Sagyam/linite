import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { SnapcraftRefreshStrategy } from './snapcraft-strategy';

// Mock the Snapcraft API client
vi.mock('../external-apis/snapcraft', () => ({
  getSnapcraftPackageMetadata: vi.fn(),
  checkSnapcraftAvailability: vi.fn(),
}));

import { getSnapcraftPackageMetadata, checkSnapcraftAvailability } from '../external-apis/snapcraft';

describe('SnapcraftRefreshStrategy', () => {
  let strategy: SnapcraftRefreshStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new SnapcraftRefreshStrategy();
  });

  describe('getMetadata', () => {
    it('should call getSnapcraftPackageMetadata with identifier', async () => {
      const mockMetadata = {
        identifier: 'firefox',
        name: 'Firefox',
        summary: 'Fast, Private & Safe Web Browser',
        version: '120.0',
        source: 'snap' as const,
      };

      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('firefox');

      expect(getSnapcraftPackageMetadata).toHaveBeenCalledWith('firefox');
      expect(result).toEqual(mockMetadata);
    });

    it('should return null when snap not found', async () => {
      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(null);

      const result = await strategy.getMetadata('non-existent-snap');

      expect(result).toBeNull();
    });

    it('should propagate errors from API client', async () => {
      (getSnapcraftPackageMetadata as Mock).mockRejectedValueOnce(new Error('API error'));

      await expect(strategy.getMetadata('test-snap')).rejects.toThrow('API error');
    });

    it('should handle metadata with all optional fields', async () => {
      const mockMetadata = {
        identifier: 'vlc',
        name: 'VLC',
        summary: 'The ultimate media player',
        version: '3.0.20',
        source: 'snap' as const,
        iconUrl: 'https://dashboard.snapcraft.io/site_media/appmedia/2018/01/vlc.png',
        homepage: 'https://www.videolan.org/vlc/',
        license: 'GPL-2.0+',
        downloadSize: 92274688,
      };

      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('vlc');

      expect(result).toEqual(mockMetadata);
    });

    it('should handle metadata with minimal fields', async () => {
      const mockMetadata = {
        identifier: 'simple-snap',
        name: 'Simple Snap',
        summary: 'A simple application',
        version: '1.0',
        source: 'snap' as const,
      };

      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('simple-snap');

      expect(result).toEqual(mockMetadata);
    });

    it('should handle special characters in identifier', async () => {
      const identifier = 'com.example.app-name';
      const mockMetadata = {
        identifier,
        name: 'App Name',
        summary: 'Test app',
        version: '1.0',
        source: 'snap' as const,
      };

      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata(identifier);

      expect(getSnapcraftPackageMetadata).toHaveBeenCalledWith(identifier);
      expect(result).toEqual(mockMetadata);
    });

    it('should handle network timeout errors', async () => {
      (getSnapcraftPackageMetadata as Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(strategy.getMetadata('firefox')).rejects.toThrow('Network timeout');
    });

    it('should handle API rate limit errors', async () => {
      (getSnapcraftPackageMetadata as Mock).mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      await expect(strategy.getMetadata('firefox')).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('checkAvailability', () => {
    it('should call checkSnapcraftAvailability with identifier', async () => {
      (checkSnapcraftAvailability as Mock).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability('firefox');

      expect(checkSnapcraftAvailability).toHaveBeenCalledWith('firefox');
      expect(result).toBe(true);
    });

    it('should return false when snap not available', async () => {
      (checkSnapcraftAvailability as Mock).mockResolvedValueOnce(false);

      const result = await strategy.checkAvailability('non-existent-snap');

      expect(result).toBe(false);
    });

    it('should propagate errors from API client', async () => {
      (checkSnapcraftAvailability as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(strategy.checkAvailability('test-snap')).rejects.toThrow('Network error');
    });

    it('should handle availability check for popular snaps', async () => {
      const popularSnaps = ['firefox', 'chromium', 'vlc', 'code', 'spotify'];

      for (const snap of popularSnaps) {
        (checkSnapcraftAvailability as Mock).mockResolvedValueOnce(true);
        const result = await strategy.checkAvailability(snap);
        expect(result).toBe(true);
      }

      expect(checkSnapcraftAvailability).toHaveBeenCalledTimes(popularSnaps.length);
    });

    it('should handle special characters in identifier', async () => {
      const identifier = 'com.example.app-name';
      (checkSnapcraftAvailability as Mock).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability(identifier);

      expect(checkSnapcraftAvailability).toHaveBeenCalledWith(identifier);
      expect(result).toBe(true);
    });

    it('should handle case-sensitive identifiers', async () => {
      (checkSnapcraftAvailability as Mock).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability('Firefox');

      expect(checkSnapcraftAvailability).toHaveBeenCalledWith('Firefox');
      expect(result).toBe(true);
    });

    it('should handle network timeout errors', async () => {
      (checkSnapcraftAvailability as Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(strategy.checkAvailability('firefox')).rejects.toThrow('Network timeout');
    });

    it('should handle API errors gracefully', async () => {
      (checkSnapcraftAvailability as Mock).mockRejectedValueOnce(
        new Error('API returned 500')
      );

      await expect(strategy.checkAvailability('firefox')).rejects.toThrow('API returned 500');
    });
  });

  describe('interface compliance', () => {
    it('should implement RefreshStrategy interface', () => {
      expect(strategy.getMetadata).toBeDefined();
      expect(typeof strategy.getMetadata).toBe('function');
      expect(strategy.checkAvailability).toBeDefined();
      expect(typeof strategy.checkAvailability).toBe('function');
    });

    it('should have async methods', async () => {
      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(null);
      (checkSnapcraftAvailability as Mock).mockResolvedValueOnce(false);

      const metadataPromise = strategy.getMetadata('test');
      const availabilityPromise = strategy.checkAvailability('test');

      expect(metadataPromise).toBeInstanceOf(Promise);
      expect(availabilityPromise).toBeInstanceOf(Promise);

      await metadataPromise;
      await availabilityPromise;
    });
  });

  describe('edge cases', () => {
    it('should handle empty string identifier for getMetadata', async () => {
      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(null);

      const result = await strategy.getMetadata('');

      expect(getSnapcraftPackageMetadata).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should handle empty string identifier for checkAvailability', async () => {
      (checkSnapcraftAvailability as Mock).mockResolvedValueOnce(false);

      const result = await strategy.checkAvailability('');

      expect(checkSnapcraftAvailability).toHaveBeenCalledWith('');
      expect(result).toBe(false);
    });

    it('should handle very long identifiers', async () => {
      const longIdentifier = 'a'.repeat(500);
      (getSnapcraftPackageMetadata as Mock).mockResolvedValueOnce(null);

      const result = await strategy.getMetadata(longIdentifier);

      expect(getSnapcraftPackageMetadata).toHaveBeenCalledWith(longIdentifier);
      expect(result).toBeNull();
    });

    it('should handle concurrent metadata requests', async () => {
      const mockMetadata = {
        identifier: 'firefox',
        name: 'Firefox',
        summary: 'Browser',
        version: '120.0',
        source: 'snap' as const,
      };

      (getSnapcraftPackageMetadata as Mock).mockResolvedValue(mockMetadata);

      const promises = [
        strategy.getMetadata('firefox'),
        strategy.getMetadata('chromium'),
        strategy.getMetadata('vlc'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(getSnapcraftPackageMetadata).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent availability checks', async () => {
      (checkSnapcraftAvailability as Mock).mockResolvedValue(true);

      const promises = [
        strategy.checkAvailability('firefox'),
        strategy.checkAvailability('chromium'),
        strategy.checkAvailability('vlc'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
      expect(checkSnapcraftAvailability).toHaveBeenCalledTimes(3);
    });
  });
});
