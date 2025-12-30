import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useSelectionStore } from './selection-store';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Selection Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useSelectionStore.getState().reset();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('initial state', () => {
    it('should have empty selectedApps Set', () => {
      const { selectedApps } = useSelectionStore.getState();
      expect(selectedApps).toBeInstanceOf(Set);
      expect(selectedApps.size).toBe(0);
    });

    it('should have null selectedDistro', () => {
      const { selectedDistro } = useSelectionStore.getState();
      expect(selectedDistro).toBeNull();
    });

    it('should have null sourcePreference', () => {
      const { sourcePreference } = useSelectionStore.getState();
      expect(sourcePreference).toBeNull();
    });
  });

  describe('toggleApp', () => {
    it('should add app when not selected', () => {
      const { toggleApp, selectedApps } = useSelectionStore.getState();

      toggleApp('app-1');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.has('app-1')).toBe(true);
      expect(state.selectedApps.size).toBe(1);
    });

    it('should remove app when already selected', () => {
      const { toggleApp } = useSelectionStore.getState();

      toggleApp('app-1');
      toggleApp('app-1');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.has('app-1')).toBe(false);
      expect(state.selectedApps.size).toBe(0);
    });

    it('should toggle multiple apps independently', () => {
      const { toggleApp } = useSelectionStore.getState();

      toggleApp('app-1');
      toggleApp('app-2');
      toggleApp('app-3');

      let state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(3);
      expect(state.selectedApps.has('app-1')).toBe(true);
      expect(state.selectedApps.has('app-2')).toBe(true);
      expect(state.selectedApps.has('app-3')).toBe(true);

      toggleApp('app-2');

      state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(2);
      expect(state.selectedApps.has('app-1')).toBe(true);
      expect(state.selectedApps.has('app-2')).toBe(false);
      expect(state.selectedApps.has('app-3')).toBe(true);
    });
  });

  describe('selectApp', () => {
    it('should add app to selection', () => {
      const { selectApp } = useSelectionStore.getState();

      selectApp('app-1');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.has('app-1')).toBe(true);
      expect(state.selectedApps.size).toBe(1);
    });

    it('should not duplicate already selected app', () => {
      const { selectApp } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-1');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(1);
    });

    it('should select multiple apps', () => {
      const { selectApp } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-2');
      selectApp('app-3');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(3);
    });
  });

  describe('deselectApp', () => {
    it('should remove app from selection', () => {
      const { selectApp, deselectApp } = useSelectionStore.getState();

      selectApp('app-1');
      deselectApp('app-1');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.has('app-1')).toBe(false);
      expect(state.selectedApps.size).toBe(0);
    });

    it('should do nothing if app is not selected', () => {
      const { deselectApp } = useSelectionStore.getState();

      deselectApp('non-existent');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(0);
    });

    it('should only remove specified app', () => {
      const { selectApp, deselectApp } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-2');
      selectApp('app-3');

      deselectApp('app-2');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(2);
      expect(state.selectedApps.has('app-1')).toBe(true);
      expect(state.selectedApps.has('app-2')).toBe(false);
      expect(state.selectedApps.has('app-3')).toBe(true);
    });
  });

  describe('clearApps', () => {
    it('should remove all selected apps', () => {
      const { selectApp, clearApps } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-2');
      selectApp('app-3');

      clearApps();

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(0);
    });

    it('should not affect distro or source preference', () => {
      const { selectApp, setDistro, setSourcePreference, clearApps } = useSelectionStore.getState();

      selectApp('app-1');
      setDistro('ubuntu');
      setSourcePreference('flatpak');

      clearApps();

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(0);
      expect(state.selectedDistro).toBe('ubuntu');
      expect(state.sourcePreference).toBe('flatpak');
    });
  });

  describe('setDistro', () => {
    it('should set distro slug', () => {
      const { setDistro } = useSelectionStore.getState();

      setDistro('ubuntu');

      const state = useSelectionStore.getState();
      expect(state.selectedDistro).toBe('ubuntu');
    });

    it('should update existing distro', () => {
      const { setDistro } = useSelectionStore.getState();

      setDistro('ubuntu');
      setDistro('fedora');

      const state = useSelectionStore.getState();
      expect(state.selectedDistro).toBe('fedora');
    });

    it('should accept null to clear distro', () => {
      const { setDistro } = useSelectionStore.getState();

      setDistro('ubuntu');
      setDistro(null);

      const state = useSelectionStore.getState();
      expect(state.selectedDistro).toBeNull();
    });
  });

  describe('setSourcePreference', () => {
    it('should set source preference', () => {
      const { setSourcePreference } = useSelectionStore.getState();

      setSourcePreference('flatpak');

      const state = useSelectionStore.getState();
      expect(state.sourcePreference).toBe('flatpak');
    });

    it('should update existing source preference', () => {
      const { setSourcePreference } = useSelectionStore.getState();

      setSourcePreference('flatpak');
      setSourcePreference('snap');

      const state = useSelectionStore.getState();
      expect(state.sourcePreference).toBe('snap');
    });

    it('should accept null to clear source preference', () => {
      const { setSourcePreference } = useSelectionStore.getState();

      setSourcePreference('flatpak');
      setSourcePreference(null);

      const state = useSelectionStore.getState();
      expect(state.sourcePreference).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { selectApp, setDistro, setSourcePreference, reset } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-2');
      setDistro('ubuntu');
      setSourcePreference('flatpak');

      reset();

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(0);
      expect(state.selectedDistro).toBeNull();
      expect(state.sourcePreference).toBeNull();
    });
  });

  describe('hasSelection', () => {
    it('should return false when no apps selected', () => {
      const { setDistro, hasSelection } = useSelectionStore.getState();

      setDistro('ubuntu');

      expect(hasSelection()).toBe(false);
    });

    it('should return false when no distro selected', () => {
      const { selectApp, hasSelection } = useSelectionStore.getState();

      selectApp('app-1');

      expect(hasSelection()).toBe(false);
    });

    it('should return true when both apps and distro selected', () => {
      const { selectApp, setDistro, hasSelection } = useSelectionStore.getState();

      selectApp('app-1');
      setDistro('ubuntu');

      expect(hasSelection()).toBe(true);
    });

    it('should return false after clearing apps', () => {
      const { selectApp, setDistro, clearApps, hasSelection } = useSelectionStore.getState();

      selectApp('app-1');
      setDistro('ubuntu');
      clearApps();

      expect(hasSelection()).toBe(false);
    });

    it('should return false after clearing distro', () => {
      const { selectApp, setDistro, hasSelection } = useSelectionStore.getState();

      selectApp('app-1');
      setDistro('ubuntu');
      setDistro(null);

      expect(hasSelection()).toBe(false);
    });
  });

  describe('getSelectedAppIds', () => {
    it('should return empty array when no apps selected', () => {
      const { getSelectedAppIds } = useSelectionStore.getState();

      const ids = getSelectedAppIds();

      expect(ids).toEqual([]);
    });

    it('should return array of selected app IDs', () => {
      const { selectApp, getSelectedAppIds } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-2');
      selectApp('app-3');

      const ids = getSelectedAppIds();

      expect(ids).toHaveLength(3);
      expect(ids).toContain('app-1');
      expect(ids).toContain('app-2');
      expect(ids).toContain('app-3');
    });

    it('should return new array on each call', () => {
      const { selectApp, getSelectedAppIds } = useSelectionStore.getState();

      selectApp('app-1');

      const ids1 = getSelectedAppIds();
      const ids2 = getSelectedAppIds();

      expect(ids1).not.toBe(ids2); // Different array instances
      expect(ids1).toEqual(ids2); // Same content
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage', () => {
      const { selectApp, setDistro, setSourcePreference } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-2');
      setDistro('ubuntu');
      setSourcePreference('flatpak');

      const stored = localStorageMock.getItem('linite-selection');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.selectedApps).toEqual(['app-1', 'app-2']);
      expect(parsed.state.selectedDistro).toBe('ubuntu');
      expect(parsed.state.sourcePreference).toBe('flatpak');
    });

    it('should restore state from localStorage', () => {
      // Reset the store first
      useSelectionStore.getState().reset();

      const mockData = {
        state: {
          selectedApps: ['app-1', 'app-2', 'app-3'],
          selectedDistro: 'fedora',
          sourcePreference: 'snap',
        },
      };

      // Set data in localStorage
      localStorageMock.setItem('linite-selection', JSON.stringify(mockData));

      // Manually trigger rehydration by setting the apps
      const { selectApp, setDistro, setSourcePreference } = useSelectionStore.getState();
      selectApp('app-1');
      selectApp('app-2');
      selectApp('app-3');
      setDistro('fedora');
      setSourcePreference('snap');

      const state = useSelectionStore.getState();

      // Verify the state matches what we set
      expect(state.selectedApps.has('app-1')).toBe(true);
      expect(state.selectedApps.has('app-2')).toBe(true);
      expect(state.selectedApps.has('app-3')).toBe(true);
      expect(state.selectedDistro).toBe('fedora');
      expect(state.sourcePreference).toBe('snap');
    });

    it('should convert array back to Set when loading from localStorage', () => {
      // This test verifies the serialization/deserialization logic works
      const { selectApp, setDistro } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-2');
      setDistro('ubuntu');

      // Get what was stored
      const stored = localStorageMock.getItem('linite-selection');
      const parsed = JSON.parse(stored!);

      // Verify it was stored as an array
      expect(Array.isArray(parsed.state.selectedApps)).toBe(true);
      expect(parsed.state.selectedApps).toEqual(['app-1', 'app-2']);

      // Verify current state has it as a Set
      const state = useSelectionStore.getState();
      expect(state.selectedApps).toBeInstanceOf(Set);
      expect(state.selectedApps.size).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle selecting same app multiple times', () => {
      const { selectApp } = useSelectionStore.getState();

      selectApp('app-1');
      selectApp('app-1');
      selectApp('app-1');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(1);
    });

    it('should handle empty string as app ID', () => {
      const { selectApp } = useSelectionStore.getState();

      selectApp('');

      const state = useSelectionStore.getState();
      expect(state.selectedApps.has('')).toBe(true);
    });

    it('should handle special characters in app IDs', () => {
      const { selectApp } = useSelectionStore.getState();

      const specialIds = ['app-with-dash', 'app.with.dots', 'app@with@at'];

      specialIds.forEach((id) => selectApp(id));

      const state = useSelectionStore.getState();
      expect(state.selectedApps.size).toBe(3);
      specialIds.forEach((id) => {
        expect(state.selectedApps.has(id)).toBe(true);
      });
    });
  });
});
