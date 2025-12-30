import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlathubRefreshStrategy } from './flathub-strategy';

// Mock the Flathub API client
vi.mock('../external-apis/flathub', () => ({
  getFlathubAppMetadata: vi.fn(),
  checkFlathubAvailability: vi.fn(),
}));

import { getFlathubAppMetadata, checkFlathubAvailability } from '../external-apis/flathub';

describe('FlathubRefreshStrategy', () => {
  let strategy: FlathubRefreshStrategy;

  beforeEach(() => {
    vi.clearAllMocks();
    strategy = new FlathubRefreshStrategy();
  });

  describe('getMetadata', () => {
    it('should call getFlathubAppMetadata with identifier', async () => {
      const mockMetadata = {
        identifier: 'org.mozilla.firefox',
        name: 'Firefox',
        summary: 'Web browser',
        version: '120.0',
        source: 'flatpak' as const,
      };

      (getFlathubAppMetadata as any).mockResolvedValueOnce(mockMetadata);

      const result = await strategy.getMetadata('org.mozilla.firefox');

      expect(getFlathubAppMetadata).toHaveBeenCalledWith('org.mozilla.firefox');
      expect(result).toEqual(mockMetadata);
    });

    it('should return null when app not found', async () => {
      (getFlathubAppMetadata as any).mockResolvedValueOnce(null);

      const result = await strategy.getMetadata('non.existent.app');

      expect(result).toBeNull();
    });

    it('should propagate errors from API client', async () => {
      (getFlathubAppMetadata as any).mockRejectedValueOnce(new Error('API error'));

      await expect(strategy.getMetadata('test.app')).rejects.toThrow('API error');
    });
  });

  describe('checkAvailability', () => {
    it('should call checkFlathubAvailability with identifier', async () => {
      (checkFlathubAvailability as any).mockResolvedValueOnce(true);

      const result = await strategy.checkAvailability('org.mozilla.firefox');

      expect(checkFlathubAvailability).toHaveBeenCalledWith('org.mozilla.firefox');
      expect(result).toBe(true);
    });

    it('should return false when app not available', async () => {
      (checkFlathubAvailability as any).mockResolvedValueOnce(false);

      const result = await strategy.checkAvailability('non.existent.app');

      expect(result).toBe(false);
    });

    it('should propagate errors from API client', async () => {
      (checkFlathubAvailability as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(strategy.checkAvailability('test.app')).rejects.toThrow('Network error');
    });
  });

  describe('interface compliance', () => {
    it('should implement RefreshStrategy interface', () => {
      expect(strategy.getMetadata).toBeDefined();
      expect(typeof strategy.getMetadata).toBe('function');
      expect(strategy.checkAvailability).toBeDefined();
      expect(typeof strategy.checkAvailability).toBe('function');
    });
  });
});
