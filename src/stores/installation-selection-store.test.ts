import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useInstallationSelectionStore } from './installation-selection-store';

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

global.localStorage = localStorageMock as any;

describe('Installation Selection Store', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    useInstallationSelectionStore.getState().clearSelection();
    useInstallationSelectionStore.getState().setFocusedRowIndex(-1);
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('initial state', () => {
    it('should have empty selectedInstallationIds Set', () => {
      const { selectedInstallationIds } = useInstallationSelectionStore.getState();
      expect(selectedInstallationIds).toBeInstanceOf(Set);
      expect(selectedInstallationIds.size).toBe(0);
    });

    it('should have focusedRowIndex of -1', () => {
      const { focusedRowIndex } = useInstallationSelectionStore.getState();
      expect(focusedRowIndex).toBe(-1);
    });
  });

  describe('toggleInstallation', () => {
    it('should add installation when not selected', () => {
      const { toggleInstallation } = useInstallationSelectionStore.getState();

      toggleInstallation('install-1');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.has('install-1')).toBe(true);
      expect(state.selectedInstallationIds.size).toBe(1);
    });

    it('should remove installation when already selected', () => {
      const { toggleInstallation } = useInstallationSelectionStore.getState();

      toggleInstallation('install-1');
      toggleInstallation('install-1');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.has('install-1')).toBe(false);
      expect(state.selectedInstallationIds.size).toBe(0);
    });

    it('should toggle multiple installations independently', () => {
      const { toggleInstallation } = useInstallationSelectionStore.getState();

      toggleInstallation('install-1');
      toggleInstallation('install-2');
      toggleInstallation('install-3');

      let state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
      expect(state.selectedInstallationIds.has('install-1')).toBe(true);
      expect(state.selectedInstallationIds.has('install-2')).toBe(true);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);

      toggleInstallation('install-2');

      state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(2);
      expect(state.selectedInstallationIds.has('install-1')).toBe(true);
      expect(state.selectedInstallationIds.has('install-2')).toBe(false);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
    });
  });

  describe('selectInstallation', () => {
    it('should add installation to selection', () => {
      const { selectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.has('install-1')).toBe(true);
      expect(state.selectedInstallationIds.size).toBe(1);
    });

    it('should not duplicate already selected installation', () => {
      const { selectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-1');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(1);
    });

    it('should select multiple installations', () => {
      const { selectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');
      selectInstallation('install-3');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
    });
  });

  describe('deselectInstallation', () => {
    it('should remove installation from selection', () => {
      const { selectInstallation, deselectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      deselectInstallation('install-1');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.has('install-1')).toBe(false);
      expect(state.selectedInstallationIds.size).toBe(0);
    });

    it('should do nothing if installation is not selected', () => {
      const { deselectInstallation } = useInstallationSelectionStore.getState();

      deselectInstallation('non-existent');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(0);
    });

    it('should only remove specified installation', () => {
      const { selectInstallation, deselectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');
      selectInstallation('install-3');

      deselectInstallation('install-2');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(2);
      expect(state.selectedInstallationIds.has('install-1')).toBe(true);
      expect(state.selectedInstallationIds.has('install-2')).toBe(false);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
    });
  });

  describe('selectAll', () => {
    it('should select all provided installation IDs', () => {
      const { selectAll } = useInstallationSelectionStore.getState();

      selectAll(['install-1', 'install-2', 'install-3']);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
      expect(state.selectedInstallationIds.has('install-1')).toBe(true);
      expect(state.selectedInstallationIds.has('install-2')).toBe(true);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
    });

    it('should replace existing selections', () => {
      const { selectInstallation, selectAll } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');

      selectAll(['install-3', 'install-4']);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(2);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
      expect(state.selectedInstallationIds.has('install-4')).toBe(true);
      expect(state.selectedInstallationIds.has('install-1')).toBe(false);
      expect(state.selectedInstallationIds.has('install-2')).toBe(false);
    });

    it('should handle empty array', () => {
      const { selectInstallation, selectAll } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');

      selectAll([]);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(0);
    });
  });

  describe('clearSelection', () => {
    it('should remove all selected installations', () => {
      const { selectInstallation, clearSelection } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');
      selectInstallation('install-3');

      clearSelection();

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(0);
    });

    it('should not affect focusedRowIndex', () => {
      const { selectInstallation, setFocusedRowIndex, clearSelection } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      setFocusedRowIndex(5);

      clearSelection();

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(0);
      expect(state.focusedRowIndex).toBe(5);
    });

    it('should work with empty selection', () => {
      const { clearSelection } = useInstallationSelectionStore.getState();

      expect(() => clearSelection()).not.toThrow();
    });
  });

  describe('selectRange', () => {
    it('should select range of installations between start and end', () => {
      const { selectRange } = useInstallationSelectionStore.getState();
      const allIds = ['install-1', 'install-2', 'install-3', 'install-4', 'install-5'];

      selectRange('install-2', 'install-4', allIds);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
      expect(state.selectedInstallationIds.has('install-2')).toBe(true);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
      expect(state.selectedInstallationIds.has('install-4')).toBe(true);
    });

    it('should select range inclusive of both boundaries', () => {
      const { selectRange } = useInstallationSelectionStore.getState();
      const allIds = ['install-1', 'install-2', 'install-3'];

      selectRange('install-1', 'install-3', allIds);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
      expect(state.selectedInstallationIds.has('install-1')).toBe(true);
      expect(state.selectedInstallationIds.has('install-2')).toBe(true);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
    });

    it('should work with reversed start and end', () => {
      const { selectRange } = useInstallationSelectionStore.getState();
      const allIds = ['install-1', 'install-2', 'install-3', 'install-4', 'install-5'];

      selectRange('install-4', 'install-2', allIds);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
      expect(state.selectedInstallationIds.has('install-2')).toBe(true);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
      expect(state.selectedInstallationIds.has('install-4')).toBe(true);
    });

    it('should replace existing selections', () => {
      const { selectInstallation, selectRange } = useInstallationSelectionStore.getState();
      const allIds = ['install-1', 'install-2', 'install-3', 'install-4', 'install-5'];

      selectInstallation('install-1');
      selectRange('install-3', 'install-5', allIds);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
      expect(state.selectedInstallationIds.has('install-3')).toBe(true);
      expect(state.selectedInstallationIds.has('install-4')).toBe(true);
      expect(state.selectedInstallationIds.has('install-5')).toBe(true);
      expect(state.selectedInstallationIds.has('install-1')).toBe(false);
    });

    it('should throw error if startId not found', () => {
      const { selectRange } = useInstallationSelectionStore.getState();
      const allIds = ['install-1', 'install-2', 'install-3'];

      expect(() => selectRange('non-existent', 'install-2', allIds)).toThrow();
    });

    it('should throw error if endId not found', () => {
      const { selectRange } = useInstallationSelectionStore.getState();
      const allIds = ['install-1', 'install-2', 'install-3'];

      expect(() => selectRange('install-1', 'non-existent', allIds)).toThrow();
    });
  });

  describe('setFocusedRowIndex', () => {
    it('should set focused row index', () => {
      const { setFocusedRowIndex } = useInstallationSelectionStore.getState();

      setFocusedRowIndex(5);

      const state = useInstallationSelectionStore.getState();
      expect(state.focusedRowIndex).toBe(5);
    });

    it('should update existing focused row index', () => {
      const { setFocusedRowIndex } = useInstallationSelectionStore.getState();

      setFocusedRowIndex(5);
      setFocusedRowIndex(10);

      const state = useInstallationSelectionStore.getState();
      expect(state.focusedRowIndex).toBe(10);
    });

    it('should accept negative index', () => {
      const { setFocusedRowIndex } = useInstallationSelectionStore.getState();

      setFocusedRowIndex(-1);

      const state = useInstallationSelectionStore.getState();
      expect(state.focusedRowIndex).toBe(-1);
    });

    it('should accept 0 as valid index', () => {
      const { setFocusedRowIndex } = useInstallationSelectionStore.getState();

      setFocusedRowIndex(0);

      const state = useInstallationSelectionStore.getState();
      expect(state.focusedRowIndex).toBe(0);
    });
  });

  describe('hasSelection', () => {
    it('should return false when no installations selected', () => {
      const { hasSelection } = useInstallationSelectionStore.getState();

      expect(hasSelection()).toBe(false);
    });

    it('should return true when installations are selected', () => {
      const { selectInstallation, hasSelection } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');

      expect(hasSelection()).toBe(true);
    });

    it('should return false after clearing selection', () => {
      const { selectInstallation, clearSelection, hasSelection } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');
      clearSelection();

      expect(hasSelection()).toBe(false);
    });

    it('should return true when multiple installations selected', () => {
      const { selectInstallation, hasSelection } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');
      selectInstallation('install-3');

      expect(hasSelection()).toBe(true);
    });
  });

  describe('getSelectedIds', () => {
    it('should return empty array when no installations selected', () => {
      const { getSelectedIds } = useInstallationSelectionStore.getState();

      const ids = getSelectedIds();

      expect(ids).toEqual([]);
    });

    it('should return array of selected installation IDs', () => {
      const { selectInstallation, getSelectedIds } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');
      selectInstallation('install-3');

      const ids = getSelectedIds();

      expect(ids).toHaveLength(3);
      expect(ids).toContain('install-1');
      expect(ids).toContain('install-2');
      expect(ids).toContain('install-3');
    });

    it('should return new array on each call', () => {
      const { selectInstallation, getSelectedIds } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');

      const ids1 = getSelectedIds();
      const ids2 = getSelectedIds();

      expect(ids1).not.toBe(ids2);
      expect(ids1).toEqual(ids2);
    });

    it('should reflect deselections in subsequent calls', () => {
      const { selectInstallation, deselectInstallation, getSelectedIds } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');
      selectInstallation('install-3');

      let ids = getSelectedIds();
      expect(ids).toHaveLength(3);

      deselectInstallation('install-2');

      ids = getSelectedIds();
      expect(ids).toHaveLength(2);
      expect(ids).not.toContain('install-2');
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage', () => {
      const { selectInstallation, selectInstallation: select2, selectInstallation: select3, setFocusedRowIndex } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      select2('install-2');
      select3('install-3');
      setFocusedRowIndex(5);

      const stored = localStorageMock.getItem('linite-installation-selection');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.selectedInstallationIds).toEqual(['install-1', 'install-2', 'install-3']);
      expect(parsed.state.focusedRowIndex).toBe(5);
    });

    it('should convert Set to array when saving', () => {
      const { selectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-2');

      const stored = localStorageMock.getItem('linite-installation-selection');
      const parsed = JSON.parse(stored!);

      expect(Array.isArray(parsed.state.selectedInstallationIds)).toBe(true);
      expect(parsed.state.selectedInstallationIds).toEqual(['install-1', 'install-2']);
    });

    it('should handle empty selection persistence', () => {
      const { setFocusedRowIndex } = useInstallationSelectionStore.getState();

      setFocusedRowIndex(10);

      const stored = localStorageMock.getItem('linite-installation-selection');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.selectedInstallationIds).toEqual([]);
      expect(parsed.state.focusedRowIndex).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle selecting same installation multiple times', () => {
      const { selectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      selectInstallation('install-1');
      selectInstallation('install-1');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(1);
    });

    it('should handle empty string as installation ID', () => {
      const { selectInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.has('')).toBe(true);
    });

    it('should handle special characters in installation IDs', () => {
      const { selectInstallation } = useInstallationSelectionStore.getState();

      const specialIds = ['install-with-dash', 'install.with.dots', 'install@with@at'];
      specialIds.forEach((id) => selectInstallation(id));

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(3);
      specialIds.forEach((id) => {
        expect(state.selectedInstallationIds.has(id)).toBe(true);
      });
    });

    it('should handle range selection with single item', () => {
      const { selectRange } = useInstallationSelectionStore.getState();
      const allIds = ['install-1', 'install-2', 'install-3'];

      selectRange('install-2', 'install-2', allIds);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(1);
      expect(state.selectedInstallationIds.has('install-2')).toBe(true);
    });

    it('should handle toggle on already selected item', () => {
      const { selectInstallation, toggleInstallation } = useInstallationSelectionStore.getState();

      selectInstallation('install-1');
      toggleInstallation('install-1');

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(0);
    });

    it('should handle large number of selections', () => {
      const { selectAll } = useInstallationSelectionStore.getState();
      const largeIds = Array.from({ length: 1000 }, (_, i) => `install-${i}`);

      selectAll(largeIds);

      const state = useInstallationSelectionStore.getState();
      expect(state.selectedInstallationIds.size).toBe(1000);
    });
  });
});
