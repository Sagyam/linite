import { describe, it, expect, vi } from 'vitest';
import { createRefreshStrategy } from './strategy-factory';
import type { PackageMetadata } from './types';

describe('createRefreshStrategy', () => {
  describe('factory creation', () => {
    it('should create a strategy object with getMetadata and checkAvailability methods', () => {
      const getMetadataFn = vi.fn();
      const checkAvailabilityFn = vi.fn();

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);

      expect(strategy).toHaveProperty('getMetadata');
      expect(strategy).toHaveProperty('checkAvailability');
      expect(typeof strategy.getMetadata).toBe('function');
      expect(typeof strategy.checkAvailability).toBe('function');
    });

    it('should return an object implementing RefreshStrategy interface', () => {
      const strategy = createRefreshStrategy(
        async () => null,
        async () => false
      );

      expect(strategy.getMetadata).toBeDefined();
      expect(strategy.checkAvailability).toBeDefined();
    });
  });

  describe('getMetadata passthrough', () => {
    it('should call the provided getMetadata function with the identifier', async () => {
      const mockMetadata: PackageMetadata = {
        version: '1.0.0',
        description: 'Test package',
      };
      const getMetadataFn = vi.fn().mockResolvedValue(mockMetadata);
      const checkAvailabilityFn = vi.fn();

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);
      const result = await strategy.getMetadata('test-package');

      expect(getMetadataFn).toHaveBeenCalledWith('test-package');
      expect(getMetadataFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockMetadata);
    });

    it('should return null when getMetadata function returns null', async () => {
      const getMetadataFn = vi.fn().mockResolvedValue(null);
      const checkAvailabilityFn = vi.fn();

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);
      const result = await strategy.getMetadata('nonexistent-package');

      expect(result).toBeNull();
    });

    it('should propagate errors from getMetadata function', async () => {
      const error = new Error('API error');
      const getMetadataFn = vi.fn().mockRejectedValue(error);
      const checkAvailabilityFn = vi.fn();

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);

      await expect(strategy.getMetadata('test-package')).rejects.toThrow(
        'API error'
      );
    });

    it('should handle complex metadata objects', async () => {
      const complexMetadata: PackageMetadata = {
        version: '2.5.3',
        description: 'A complex package with many fields',
        license: 'MIT',
        homepage: 'https://example.com',
        maintainers: ['maintainer1', 'maintainer2'],
        categories: ['utilities', 'development'],
        metadata: {
          downloads: 50000,
          lastUpdated: '2024-01-15',
          rating: 4.5,
        },
      };
      const getMetadataFn = vi.fn().mockResolvedValue(complexMetadata);

      const strategy = createRefreshStrategy(getMetadataFn, vi.fn());
      const result = await strategy.getMetadata('complex-package');

      expect(result).toEqual(complexMetadata);
    });
  });

  describe('checkAvailability passthrough', () => {
    it('should call the provided checkAvailability function with the identifier', async () => {
      const getMetadataFn = vi.fn();
      const checkAvailabilityFn = vi.fn().mockResolvedValue(true);

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);
      const result = await strategy.checkAvailability('test-package');

      expect(checkAvailabilityFn).toHaveBeenCalledWith('test-package');
      expect(checkAvailabilityFn).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should return true when package is available', async () => {
      const checkAvailabilityFn = vi.fn().mockResolvedValue(true);

      const strategy = createRefreshStrategy(vi.fn(), checkAvailabilityFn);
      const result = await strategy.checkAvailability('available-package');

      expect(result).toBe(true);
    });

    it('should return false when package is not available', async () => {
      const checkAvailabilityFn = vi.fn().mockResolvedValue(false);

      const strategy = createRefreshStrategy(vi.fn(), checkAvailabilityFn);
      const result = await strategy.checkAvailability('unavailable-package');

      expect(result).toBe(false);
    });

    it('should propagate errors from checkAvailability function', async () => {
      const error = new Error('Network error');
      const checkAvailabilityFn = vi.fn().mockRejectedValue(error);

      const strategy = createRefreshStrategy(vi.fn(), checkAvailabilityFn);

      await expect(strategy.checkAvailability('test-package')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('independent function calls', () => {
    it('should not call checkAvailability when getMetadata is called', async () => {
      const getMetadataFn = vi.fn().mockResolvedValue({ version: '1.0.0' });
      const checkAvailabilityFn = vi.fn();

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);
      await strategy.getMetadata('test-package');

      expect(getMetadataFn).toHaveBeenCalledTimes(1);
      expect(checkAvailabilityFn).not.toHaveBeenCalled();
    });

    it('should not call getMetadata when checkAvailability is called', async () => {
      const getMetadataFn = vi.fn();
      const checkAvailabilityFn = vi.fn().mockResolvedValue(true);

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);
      await strategy.checkAvailability('test-package');

      expect(checkAvailabilityFn).toHaveBeenCalledTimes(1);
      expect(getMetadataFn).not.toHaveBeenCalled();
    });

    it('should allow calling both methods on the same strategy', async () => {
      const getMetadataFn = vi.fn().mockResolvedValue({ version: '1.0.0' });
      const checkAvailabilityFn = vi.fn().mockResolvedValue(true);

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);

      const metadata = await strategy.getMetadata('package-1');
      const available = await strategy.checkAvailability('package-2');

      expect(metadata).toEqual({ version: '1.0.0' });
      expect(available).toBe(true);
      expect(getMetadataFn).toHaveBeenCalledWith('package-1');
      expect(checkAvailabilityFn).toHaveBeenCalledWith('package-2');
    });
  });

  describe('multiple strategy instances', () => {
    it('should create independent strategy instances', async () => {
      const getMetadataFn1 = vi.fn().mockResolvedValue({ version: '1.0.0' });
      const checkAvailabilityFn1 = vi.fn().mockResolvedValue(true);
      const getMetadataFn2 = vi.fn().mockResolvedValue({ version: '2.0.0' });
      const checkAvailabilityFn2 = vi.fn().mockResolvedValue(false);

      const strategy1 = createRefreshStrategy(getMetadataFn1, checkAvailabilityFn1);
      const strategy2 = createRefreshStrategy(getMetadataFn2, checkAvailabilityFn2);

      const result1 = await strategy1.getMetadata('package');
      const result2 = await strategy2.getMetadata('package');

      expect(result1).toEqual({ version: '1.0.0' });
      expect(result2).toEqual({ version: '2.0.0' });
      expect(getMetadataFn1).toHaveBeenCalledTimes(1);
      expect(getMetadataFn2).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string identifier', async () => {
      const getMetadataFn = vi.fn().mockResolvedValue(null);
      const checkAvailabilityFn = vi.fn().mockResolvedValue(false);

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);

      await strategy.getMetadata('');
      await strategy.checkAvailability('');

      expect(getMetadataFn).toHaveBeenCalledWith('');
      expect(checkAvailabilityFn).toHaveBeenCalledWith('');
    });

    it('should handle identifiers with special characters', async () => {
      const getMetadataFn = vi.fn().mockResolvedValue({ version: '1.0.0' });
      const checkAvailabilityFn = vi.fn().mockResolvedValue(true);

      const strategy = createRefreshStrategy(getMetadataFn, checkAvailabilityFn);
      const specialId = 'org.example.app-name_2.0';

      await strategy.getMetadata(specialId);
      await strategy.checkAvailability(specialId);

      expect(getMetadataFn).toHaveBeenCalledWith(specialId);
      expect(checkAvailabilityFn).toHaveBeenCalledWith(specialId);
    });

    it('should handle async functions that take time to resolve', async () => {
      const getMetadataFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ version: '1.0.0' }), 100)
          )
      );

      const strategy = createRefreshStrategy(getMetadataFn, vi.fn());
      const result = await strategy.getMetadata('slow-package');

      expect(result).toEqual({ version: '1.0.0' });
    });
  });
});
