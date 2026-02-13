import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialogs } from './use-dialogs';

// Mock the selection store
const mockSelectedApps = new Map<string, unknown>();
let mockSelectedDistro: unknown = null;

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn((selector) => {
    const state = {
      selectedApps: mockSelectedApps,
      selectedDistro: mockSelectedDistro,
    };
    return selector(state);
  }),
}));

describe('useDialogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedApps.clear();
    mockSelectedDistro = null;
  });

  describe('initial state', () => {
    it('should have all dialogs closed initially', () => {
      const { result } = renderHook(() => useDialogs());

      expect(result.current.selectionDrawerOpen).toBe(false);
      expect(result.current.commandDialogOpen).toBe(false);
      expect(result.current.saveDialogOpen).toBe(false);
    });

    it('should return all expected properties', () => {
      const { result } = renderHook(() => useDialogs());

      expect(result.current).toHaveProperty('selectionDrawerOpen');
      expect(result.current).toHaveProperty('setSelectionDrawerOpen');
      expect(result.current).toHaveProperty('toggleSelectionDrawer');
      expect(result.current).toHaveProperty('commandDialogOpen');
      expect(result.current).toHaveProperty('setCommandDialogOpen');
      expect(result.current).toHaveProperty('saveDialogOpen');
      expect(result.current).toHaveProperty('setSaveDialogOpen');
      expect(result.current).toHaveProperty('handleGenerateCommand');
      expect(result.current).toHaveProperty('handleToggleGenerateCommand');
      expect(result.current).toHaveProperty('handleToggleSelectionDrawer');
      expect(result.current).toHaveProperty('handleSaveInstallation');
    });
  });

  describe('selectionDrawerOpen', () => {
    it('should open selection drawer', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSelectionDrawerOpen(true);
      });

      expect(result.current.selectionDrawerOpen).toBe(true);
    });

    it('should close selection drawer', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSelectionDrawerOpen(true);
      });
      act(() => {
        result.current.setSelectionDrawerOpen(false);
      });

      expect(result.current.selectionDrawerOpen).toBe(false);
    });

    it('should toggle selection drawer from closed to open', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.toggleSelectionDrawer();
      });

      expect(result.current.selectionDrawerOpen).toBe(true);
    });

    it('should toggle selection drawer from open to closed', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSelectionDrawerOpen(true);
      });
      act(() => {
        result.current.toggleSelectionDrawer();
      });

      expect(result.current.selectionDrawerOpen).toBe(false);
    });

    it('should toggle selection drawer multiple times', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.toggleSelectionDrawer();
      });
      expect(result.current.selectionDrawerOpen).toBe(true);

      act(() => {
        result.current.toggleSelectionDrawer();
      });
      expect(result.current.selectionDrawerOpen).toBe(false);

      act(() => {
        result.current.toggleSelectionDrawer();
      });
      expect(result.current.selectionDrawerOpen).toBe(true);
    });
  });

  describe('commandDialogOpen', () => {
    it('should open command dialog', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setCommandDialogOpen(true);
      });

      expect(result.current.commandDialogOpen).toBe(true);
    });

    it('should close command dialog', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setCommandDialogOpen(true);
      });
      act(() => {
        result.current.setCommandDialogOpen(false);
      });

      expect(result.current.commandDialogOpen).toBe(false);
    });
  });

  describe('saveDialogOpen', () => {
    it('should open save dialog', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSaveDialogOpen(true);
      });

      expect(result.current.saveDialogOpen).toBe(true);
    });

    it('should close save dialog', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSaveDialogOpen(true);
      });
      act(() => {
        result.current.setSaveDialogOpen(false);
      });

      expect(result.current.saveDialogOpen).toBe(false);
    });
  });

  describe('handleGenerateCommand', () => {
    it('should open command dialog when apps and distro are selected', () => {
      mockSelectedApps.set('app-1', { id: 'app-1' });
      mockSelectedDistro = { id: 'distro-1', slug: 'ubuntu' };

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(true);
      expect(result.current.selectionDrawerOpen).toBe(false);
    });

    it('should open selection drawer when no apps are selected', () => {
      mockSelectedDistro = { id: 'distro-1', slug: 'ubuntu' };

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(false);
      expect(result.current.selectionDrawerOpen).toBe(true);
    });

    it('should open selection drawer when no distro is selected', () => {
      mockSelectedApps.set('app-1', { id: 'app-1' });

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(false);
      expect(result.current.selectionDrawerOpen).toBe(true);
    });

    it('should open selection drawer when neither apps nor distro are selected', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(false);
      expect(result.current.selectionDrawerOpen).toBe(true);
    });

    it('should work with multiple apps selected', () => {
      mockSelectedApps.set('app-1', { id: 'app-1' });
      mockSelectedApps.set('app-2', { id: 'app-2' });
      mockSelectedApps.set('app-3', { id: 'app-3' });
      mockSelectedDistro = { id: 'distro-1', slug: 'ubuntu' };

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(true);
    });
  });

  describe('handleToggleGenerateCommand', () => {
    it('should close command dialog when it is open', () => {
      mockSelectedApps.set('app-1', { id: 'app-1' });
      mockSelectedDistro = { id: 'distro-1', slug: 'ubuntu' };

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setCommandDialogOpen(true);
      });
      act(() => {
        result.current.handleToggleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(false);
    });

    it('should open command dialog when it is closed and selection is valid', () => {
      mockSelectedApps.set('app-1', { id: 'app-1' });
      mockSelectedDistro = { id: 'distro-1', slug: 'ubuntu' };

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleToggleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(true);
    });

    it('should open selection drawer when toggling and selection is invalid', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleToggleGenerateCommand();
      });

      expect(result.current.commandDialogOpen).toBe(false);
      expect(result.current.selectionDrawerOpen).toBe(true);
    });
  });

  describe('handleToggleSelectionDrawer', () => {
    it('should toggle selection drawer from closed to open', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleToggleSelectionDrawer();
      });

      expect(result.current.selectionDrawerOpen).toBe(true);
    });

    it('should toggle selection drawer from open to closed', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSelectionDrawerOpen(true);
      });
      act(() => {
        result.current.handleToggleSelectionDrawer();
      });

      expect(result.current.selectionDrawerOpen).toBe(false);
    });
  });

  describe('handleSaveInstallation', () => {
    it('should open save dialog when apps and distro are selected', () => {
      mockSelectedApps.set('app-1', { id: 'app-1' });
      mockSelectedDistro = { id: 'distro-1', slug: 'ubuntu' };

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleSaveInstallation();
      });

      expect(result.current.saveDialogOpen).toBe(true);
    });

    it('should not open save dialog when no apps are selected', () => {
      mockSelectedDistro = { id: 'distro-1', slug: 'ubuntu' };

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleSaveInstallation();
      });

      expect(result.current.saveDialogOpen).toBe(false);
    });

    it('should not open save dialog when no distro is selected', () => {
      mockSelectedApps.set('app-1', { id: 'app-1' });

      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleSaveInstallation();
      });

      expect(result.current.saveDialogOpen).toBe(false);
    });

    it('should not open save dialog when neither apps nor distro are selected', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.handleSaveInstallation();
      });

      expect(result.current.saveDialogOpen).toBe(false);
    });
  });

  describe('dialog independence', () => {
    it('should allow multiple dialogs to be open simultaneously', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSelectionDrawerOpen(true);
        result.current.setCommandDialogOpen(true);
        result.current.setSaveDialogOpen(true);
      });

      expect(result.current.selectionDrawerOpen).toBe(true);
      expect(result.current.commandDialogOpen).toBe(true);
      expect(result.current.saveDialogOpen).toBe(true);
    });

    it('should close dialogs independently', () => {
      const { result } = renderHook(() => useDialogs());

      act(() => {
        result.current.setSelectionDrawerOpen(true);
        result.current.setCommandDialogOpen(true);
        result.current.setSaveDialogOpen(true);
      });

      act(() => {
        result.current.setCommandDialogOpen(false);
      });

      expect(result.current.selectionDrawerOpen).toBe(true);
      expect(result.current.commandDialogOpen).toBe(false);
      expect(result.current.saveDialogOpen).toBe(true);
    });
  });

  describe('function reference stability', () => {
    it('should have stable function references for callbacks', () => {
      const { result, rerender } = renderHook(() => useDialogs());

      const initialToggleSelectionDrawer = result.current.handleToggleSelectionDrawer;

      rerender();

      expect(result.current.handleToggleSelectionDrawer).toBe(initialToggleSelectionDrawer);
    });
  });
});
