import { describe, it, expect } from 'vitest';
import { getRefreshStrategy, refreshStrategies } from './index';
import { FlathubRefreshStrategy } from './flathub-strategy';
import { SnapcraftRefreshStrategy } from './snapcraft-strategy';
import { AURRefreshStrategy } from './aur-strategy';
import { RepologyRefreshStrategy } from './repology-strategy';

describe('Refresh Strategies Registry', () => {
  describe('refreshStrategies', () => {
    it('should contain strategy for flatpak', () => {
      expect(refreshStrategies['flatpak']).toBeDefined();
      expect(refreshStrategies['flatpak']).toBeInstanceOf(FlathubRefreshStrategy);
    });

    it('should contain strategy for snap', () => {
      expect(refreshStrategies['snap']).toBeDefined();
      expect(refreshStrategies['snap']).toBeInstanceOf(SnapcraftRefreshStrategy);
    });

    it('should contain strategy for aur', () => {
      expect(refreshStrategies['aur']).toBeDefined();
      expect(refreshStrategies['aur']).toBeInstanceOf(AURRefreshStrategy);
    });

    it('should contain strategies for native package managers', () => {
      expect(refreshStrategies['apt']).toBeDefined();
      expect(refreshStrategies['apt']).toBeInstanceOf(RepologyRefreshStrategy);

      expect(refreshStrategies['dnf']).toBeDefined();
      expect(refreshStrategies['dnf']).toBeInstanceOf(RepologyRefreshStrategy);

      expect(refreshStrategies['pacman']).toBeDefined();
      expect(refreshStrategies['pacman']).toBeInstanceOf(RepologyRefreshStrategy);

      expect(refreshStrategies['zypper']).toBeDefined();
      expect(refreshStrategies['zypper']).toBeInstanceOf(RepologyRefreshStrategy);
    });

    it('should have exactly 7 strategies registered', () => {
      const keys = Object.keys(refreshStrategies);
      expect(keys).toHaveLength(7);
      expect(keys).toContain('flatpak');
      expect(keys).toContain('snap');
      expect(keys).toContain('aur');
      expect(keys).toContain('apt');
      expect(keys).toContain('dnf');
      expect(keys).toContain('pacman');
      expect(keys).toContain('zypper');
    });
  });

  describe('getRefreshStrategy', () => {
    it('should return Flathub strategy for "flatpak"', () => {
      const strategy = getRefreshStrategy('flatpak');

      expect(strategy).not.toBeNull();
      expect(strategy).toBeInstanceOf(FlathubRefreshStrategy);
    });

    it('should return Snapcraft strategy for "snap"', () => {
      const strategy = getRefreshStrategy('snap');

      expect(strategy).not.toBeNull();
      expect(strategy).toBeInstanceOf(SnapcraftRefreshStrategy);
    });

    it('should return AUR strategy for "aur"', () => {
      const strategy = getRefreshStrategy('aur');

      expect(strategy).not.toBeNull();
      expect(strategy).toBeInstanceOf(AURRefreshStrategy);
    });

    it('should return null for unknown source', () => {
      const strategy = getRefreshStrategy('unknown-source');

      expect(strategy).toBeNull();
    });

    it('should return null for empty string', () => {
      const strategy = getRefreshStrategy('');

      expect(strategy).toBeNull();
    });

    it('should be case-sensitive', () => {
      expect(getRefreshStrategy('Flatpak')).toBeNull();
      expect(getRefreshStrategy('FLATPAK')).toBeNull();
      expect(getRefreshStrategy('flatpak')).not.toBeNull();
    });

    it('should return consistent instances', () => {
      const strategy1 = getRefreshStrategy('flatpak');
      const strategy2 = getRefreshStrategy('flatpak');

      expect(strategy1).toBe(strategy2); // Same instance
    });
  });

  describe('Strategy contract compliance', () => {
    it('all strategies should implement getMetadata method', () => {
      for (const strategy of Object.values(refreshStrategies)) {
        expect(strategy.getMetadata).toBeDefined();
        expect(typeof strategy.getMetadata).toBe('function');
      }
    });

    it('all strategies should implement checkAvailability method', () => {
      for (const strategy of Object.values(refreshStrategies)) {
        expect(strategy.checkAvailability).toBeDefined();
        expect(typeof strategy.checkAvailability).toBe('function');
      }
    });
  });
});
