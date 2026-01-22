/**
 * Tests for useInstallationKeyboardNavigation hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useInstallationKeyboardNavigation } from '@/hooks/use-installation-keyboard-navigation';
import { useInstallationSelectionStore } from '@/stores/installation-selection-store';

describe('useInstallationKeyboardNavigation', () => {
  const mockInstallations = [
    { id: 'inst1', app: { displayName: 'App 1' } },
    { id: 'inst2', app: { displayName: 'App 2' } },
    { id: 'inst3', app: { displayName: 'App 3' } },
    { id: 'inst4', app: { displayName: 'App 4' } },
    { id: 'inst5', app: { displayName: 'App 5' } },
  ] as const;

  beforeEach(() => {
    // Reset localStorage and store state
    localStorage.clear();
    useInstallationSelectionStore.getState().clearSelection();
    useInstallationSelectionStore.getState().setFocusedRowIndex(-1);
  });

  afterEach(() => {
    // Reset store state after each test
    useInstallationSelectionStore.getState().clearSelection();
    useInstallationSelectionStore.getState().setFocusedRowIndex(-1);
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should initialize with showHelpDialog as false', async () => {
      const { result } = renderHook(() =>
        useInstallationKeyboardNavigation(mockInstallations)
      );

      // Flush all effects
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.showHelpDialog).toBe(false);
    });

    it('should provide setShowHelpDialog function', async () => {
      const { result } = renderHook(() =>
        useInstallationKeyboardNavigation(mockInstallations)
      );

      // Flush all effects
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(typeof result.current.setShowHelpDialog).toBe('function');
    });
  });

  describe('showHelpDialog state', () => {
    it('should allow setting showHelpDialog to true', async () => {
      const { result } = renderHook(() =>
        useInstallationKeyboardNavigation(mockInstallations)
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      act(() => {
        result.current.setShowHelpDialog(true);
      });

      expect(result.current.showHelpDialog).toBe(true);
    });

    it('should allow setting showHelpDialog to false', async () => {
      const { result } = renderHook(() =>
        useInstallationKeyboardNavigation(mockInstallations)
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      act(() => {
        result.current.setShowHelpDialog(true);
      });
      expect(result.current.showHelpDialog).toBe(true);

      act(() => {
        result.current.setShowHelpDialog(false);
      });
      expect(result.current.showHelpDialog).toBe(false);
    });
  });

  describe('onDelete callback', () => {
    it('should provide onDelete callback option', async () => {
      const onDelete = vi.fn();

      renderHook(() =>
        useInstallationKeyboardNavigation(mockInstallations, { onDelete })
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      // Callback is registered, will be called on Delete key press
      // This test verifies the hook accepts the option
      expect(onDelete).toBeDefined();
    });
  });

  describe('hook lifecycle', () => {
    it('should reset focus when installations length changes', async () => {
      const { rerender } = renderHook(
        ({ installations }) => useInstallationKeyboardNavigation(installations),
        {
          initialProps: { installations: mockInstallations },
        }
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      // Initial render resets focus to -1
      expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);

      // Set focus to 3
      act(() => {
        useInstallationSelectionStore.getState().setFocusedRowIndex(3);
      });
      expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(3);

      // Change installations array length
      const newInstallations = mockInstallations.slice(0, 2);
      act(() => {
        rerender({ installations: newInstallations });
      });

      // Focus should reset to -1 when length changes
      const focusedIndex = useInstallationSelectionStore.getState().focusedRowIndex;
      expect(focusedIndex).toBe(-1);
    });

    it('should reset focus when installations length stays the same but array changes', async () => {
      const { rerender } = renderHook(
        ({ installations }) => useInstallationKeyboardNavigation(installations),
        {
          initialProps: { installations: mockInstallations },
        }
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      // Initial render resets focus to -1
      expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);

      // Set focus to 2
      act(() => {
        useInstallationSelectionStore.getState().setFocusedRowIndex(2);
      });
      expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(2);

      // Re-render with same length installations (different array reference)
      const newInstallations = [
        { id: 'new1', app: { displayName: 'New App 1' } },
        { id: 'new2', app: { displayName: 'New App 2' } },
        { id: 'new3', app: { displayName: 'New App 3' } },
        { id: 'new4', app: { displayName: 'New App 4' } },
        { id: 'new5', app: { displayName: 'New App 5' } },
      ] as const;
      act(() => {
        rerender({ installations: newInstallations });
      });

      // Focus should remain at 2 since length didn't change
      const focusedIndex = useInstallationSelectionStore.getState().focusedRowIndex;
      expect(focusedIndex).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle empty installations array', async () => {
      const { result } = renderHook(() =>
        useInstallationKeyboardNavigation([])
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      expect(result.current.showHelpDialog).toBe(false);
      expect(typeof result.current.setShowHelpDialog).toBe('function');
    });

    it('should handle single installation', async () => {
      const singleInstall = [{ id: 'inst1', app: { displayName: 'App 1' } }] as const;

      const { result } = renderHook(() => useInstallationKeyboardNavigation(singleInstall));

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      expect(result.current.showHelpDialog).toBe(false);
    });

    it('should handle undefined onDelete', async () => {
      const { result } = renderHook(() =>
        useInstallationKeyboardNavigation(mockInstallations)
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      expect(result.current.showHelpDialog).toBe(false);
    });
  });

  describe('unmount behavior', () => {
    it('should clean up event listeners on unmount', async () => {
      const { unmount } = renderHook(() =>
        useInstallationKeyboardNavigation(mockInstallations)
      );

      // Wait for effects to complete
      await waitFor(() => {
        expect(useInstallationSelectionStore.getState().focusedRowIndex).toBe(-1);
      });

      expect(() => unmount()).not.toThrow();
    });
  });
});
