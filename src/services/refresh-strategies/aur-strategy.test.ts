import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import { AURRefreshStrategy } from './aur-strategy';

// Mock the AUR API client
vi.mock('../external-apis/aur', () => ({
  getAURPackageMetadata: vi.fn(),
  checkAURAvailability: vi.fn(),
}));

import { getAURPackageMetadata, checkAURAvailability } from '../external-apis/aur';

describe('AURRefreshStrategy', () => {
  let strategy: AURRefreshStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new AURRefreshStrategy();
  });

  describe('getMetadata', () => {
    it('should call getAURPackageMetadata with identifier', async () => {
      const mockMetadata = {
        identifier: 'firefox-bin',
        name: 'firefox-bin',
        summary: 'Standalone web browser from mozilla.org',
        version: '120.0-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('firefox-bin');

      expect(getAURPackageMetadata).toHaveBeenCalledWith('firefox-bin');
      expect(result).toEqual(mockMetadata);
    });

    it('should return null when package not found', async () => {
      (getAURPackageMetadata as Mock).mockResolvedValueOnce(null);

      const result = await strategy.getMetadata('non-existent-package');

      expect(result).toBeNull();
    });

    it('should propagate errors from API client', async () => {
      (getAURPackageMetadata as Mock).mockRejectedValueOnce(new Error('API error'));

      await expect(strategy.getMetadata('test-package')).rejects.toThrow('API error');
    });

    it('should handle metadata with all optional fields', async () => {
      const mockMetadata = {
        identifier: 'visual-studio-code-bin',
        name: 'visual-studio-code-bin',
        summary: 'Visual Studio Code (vscode): Editor for building and debugging modern web and cloud applications',
        version: '1.85.1-1',
        source: 'aur' as const,
        homepage: 'https://code.visualstudio.com/',
        license: 'MIT',
        maintainer: 'john.doe@example.com',
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('visual-studio-code-bin');

      expect(result).toEqual(mockMetadata);
    });

    it('should handle metadata with minimal fields', async () => {
      const mockMetadata = {
        identifier: 'simple-package',
        name: 'simple-package',
        summary: 'A simple package',
        version: '1.0-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('simple-package');

      expect(result).toEqual(mockMetadata);
    });

    it('should handle packages with -bin suffix', async () => {
      const packages = ['firefox-bin', 'chromium-bin', 'code-bin', 'slack-bin'];

      for (const pkg of packages) {
        const mockMetadata = {
          identifier: pkg,
          name: pkg,
          summary: 'Test package',
          version: '1.0-1',
          source: 'aur' as const,
        };

        (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);
        const result = await strategy.getMetadata(pkg);
        expect(result?.identifier).toBe(pkg);
      }
    });

    it('should handle packages with -git suffix', async () => {
      const mockMetadata = {
        identifier: 'neovim-git',
        name: 'neovim-git',
        summary: 'Fork of Vim aiming to improve user experience, plugins, and GUIs (git version)',
        version: 'r29456.abc123def-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('neovim-git');

      expect(result).toEqual(mockMetadata);
    });

    it('should handle version with epoch', async () => {
      const mockMetadata = {
        identifier: 'test-package',
        name: 'test-package',
        summary: 'Test',
        version: '1:2.0.0-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('test-package');

      expect(result?.version).toBe('1:2.0.0-1');
    });

    it('should handle network timeout errors', async () => {
      (getAURPackageMetadata as Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(strategy.getMetadata('firefox-bin')).rejects.toThrow('Network timeout');
    });

    it('should handle API rate limit errors', async () => {
      (getAURPackageMetadata as Mock).mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      await expect(strategy.getMetadata('firefox-bin')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle malformed API responses', async () => {
      (getAURPackageMetadata as Mock).mockRejectedValueOnce(
        new Error('Invalid JSON response')
      );

      await expect(strategy.getMetadata('test')).rejects.toThrow('Invalid JSON response');
    });
  });

  describe('checkAvailability', () => {
    it('should call checkAURAvailability with identifier', async () => {
      (checkAURAvailability as Mock).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability('firefox-bin');

      expect(checkAURAvailability).toHaveBeenCalledWith('firefox-bin');
      expect(result).toBe(true);
    });

    it('should return false when package not available', async () => {
      (checkAURAvailability as Mock).mockResolvedValueOnce(false);

      const result = await strategy.checkAvailability('non-existent-package');

      expect(result).toBe(false);
    });

    it('should propagate errors from API client', async () => {
      (checkAURAvailability as Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(strategy.checkAvailability('test-package')).rejects.toThrow('Network error');
    });

    it('should handle availability check for popular AUR packages', async () => {
      const popularPackages = [
        'yay',
        'visual-studio-code-bin',
        'google-chrome',
        'spotify',
        'slack-desktop',
      ];

      for (const pkg of popularPackages) {
        (checkAURAvailability as Mock).mockResolvedValueOnce(true);
        const result = await strategy.checkAvailability(pkg);
        expect(result).toBe(true);
      }

      expect(checkAURAvailability).toHaveBeenCalledTimes(popularPackages.length);
    });

    it('should handle packages with hyphens', async () => {
      const identifier = 'package-with-many-hyphens';
      (checkAURAvailability as Mock).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability(identifier);

      expect(checkAURAvailability).toHaveBeenCalledWith(identifier);
      expect(result).toBe(true);
    });

    it('should handle case-sensitive identifiers', async () => {
      // AUR package names are case-sensitive
      (checkAURAvailability as Mock).mockResolvedValueOnce(false);

      const result = await strategy.checkAvailability('Firefox-bin');

      expect(checkAURAvailability).toHaveBeenCalledWith('Firefox-bin');
      expect(result).toBe(false);
    });

    it('should handle network timeout errors', async () => {
      (checkAURAvailability as Mock).mockRejectedValueOnce(
        new Error('Network timeout')
      );

      await expect(strategy.checkAvailability('firefox-bin')).rejects.toThrow('Network timeout');
    });

    it('should handle API errors gracefully', async () => {
      (checkAURAvailability as Mock).mockRejectedValueOnce(
        new Error('API returned 503')
      );

      await expect(strategy.checkAvailability('firefox-bin')).rejects.toThrow('API returned 503');
    });

    it('should handle orphaned packages', async () => {
      // Orphaned packages should still be available
      (checkAURAvailability as Mock).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability('orphaned-package');

      expect(result).toBe(true);
    });

    it('should handle out-of-date packages', async () => {
      // Out-of-date packages should still be available
      (checkAURAvailability as Mock).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability('outdated-package');

      expect(result).toBe(true);
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
      (getAURPackageMetadata as Mock).mockResolvedValueOnce(null);
      (checkAURAvailability as Mock).mockResolvedValueOnce(false);

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
      (getAURPackageMetadata as Mock).mockResolvedValueOnce(null);

      const result = await strategy.getMetadata('');

      expect(getAURPackageMetadata).toHaveBeenCalledWith('');
      expect(result).toBeNull();
    });

    it('should handle empty string identifier for checkAvailability', async () => {
      (checkAURAvailability as Mock).mockResolvedValueOnce(false);

      const result = await strategy.checkAvailability('');

      expect(checkAURAvailability).toHaveBeenCalledWith('');
      expect(result).toBe(false);
    });

    it('should handle very long identifiers', async () => {
      const longIdentifier = 'very-long-package-name-' + 'a'.repeat(200);
      (getAURPackageMetadata as Mock).mockResolvedValueOnce(null);

      const result = await strategy.getMetadata(longIdentifier);

      expect(getAURPackageMetadata).toHaveBeenCalledWith(longIdentifier);
      expect(result).toBeNull();
    });

    it('should handle identifiers with special characters', async () => {
      const identifier = 'package++-lib';
      const mockMetadata = {
        identifier,
        name: identifier,
        summary: 'C++ library package',
        version: '1.0-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata(identifier);

      expect(result?.identifier).toBe(identifier);
    });

    it('should handle concurrent metadata requests', async () => {
      const mockMetadata = {
        identifier: 'test',
        name: 'test',
        summary: 'Test',
        version: '1.0-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValue(mockMetadata);

      const promises = [
        strategy.getMetadata('firefox-bin'),
        strategy.getMetadata('chromium-bin'),
        strategy.getMetadata('yay'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(getAURPackageMetadata).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent availability checks', async () => {
      (checkAURAvailability as Mock).mockResolvedValue(true);

      const promises = [
        strategy.checkAvailability('firefox-bin'),
        strategy.checkAvailability('chromium-bin'),
        strategy.checkAvailability('yay'),
      ];

      const results = await Promise.all(promises);

      expect(results).toEqual([true, true, true]);
      expect(checkAURAvailability).toHaveBeenCalledTimes(3);
    });

    it('should handle packages with numbers in name', async () => {
      const mockMetadata = {
        identifier: 'qt5-base',
        name: 'qt5-base',
        summary: 'A cross-platform application and UI framework',
        version: '5.15.11-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('qt5-base');

      expect(result?.identifier).toBe('qt5-base');
    });

    it('should handle packages with underscores', async () => {
      const identifier = 'package_with_underscores';
      const mockMetadata = {
        identifier,
        name: identifier,
        summary: 'Test',
        version: '1.0-1',
        source: 'aur' as const,
      };

      (getAURPackageMetadata as Mock).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata(identifier);

      expect(result?.identifier).toBe(identifier);
    });
  });
});
