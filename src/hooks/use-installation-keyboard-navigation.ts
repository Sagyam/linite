'use client';

import { useEffect, useState, useCallback } from 'react';
import { useInstallationSelectionStore } from '@/stores/installation-selection-store';
import type { InstallationWithRelations } from '@/types/entities';

interface UseInstallationKeyboardNavigationOptions {
  onDelete?: () => void;
}

interface UseInstallationKeyboardNavigationReturn {
  showHelpDialog: boolean;
  setShowHelpDialog: (show: boolean) => void;
}

export function useInstallationKeyboardNavigation(
  installations: InstallationWithRelations[],
  options?: UseInstallationKeyboardNavigationOptions
): UseInstallationKeyboardNavigationReturn {
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  const {
    focusedRowIndex,
    setFocusedRowIndex,
    toggleInstallation,
    selectAll,
    clearSelection,
    hasSelection,
  } = useInstallationSelectionStore();

  // Get the IDs for select all
  const installationIds = installations.map((inst) => inst.id);

  // Scroll the focused row into view
  const scrollFocusedRowIntoView = useCallback((index: number) => {
    if (index < 0 || index >= installations.length) return;

    // Find the row by data attribute
    const table = document.querySelector('[data-installation-table]');
    if (!table) return;

    const rows = table.querySelectorAll('[data-row-index]');
    const targetRow = rows[index] as HTMLElement;

    if (targetRow) {
      targetRow.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [installations.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if typing in an input field (ignore except Escape)
      const target = e.target as HTMLElement;
      const isInputField =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isInputField) {
        // Only handle Escape in input fields (to blur)
        if (e.key === 'Escape') {
          e.preventDefault();
          (target as HTMLInputElement | HTMLTextAreaElement).blur();
        }
        return;
      }

      switch (e.key) {
        // Navigation: Arrow Up
        case 'ArrowUp':
          e.preventDefault();
          if (focusedRowIndex > 0) {
            const newIndex = focusedRowIndex - 1;
            setFocusedRowIndex(newIndex);
            scrollFocusedRowIntoView(newIndex);
          } else if (focusedRowIndex === -1 && installations.length > 0) {
            // Start from first row when no focus
            setFocusedRowIndex(0);
            scrollFocusedRowIntoView(0);
          }
          break;

        // Navigation: Arrow Down
        case 'ArrowDown':
          e.preventDefault();
          const maxIndex = installations.length - 1;
          if (focusedRowIndex < maxIndex) {
            const newIndex = focusedRowIndex + 1;
            setFocusedRowIndex(newIndex);
            scrollFocusedRowIntoView(newIndex);
          } else if (focusedRowIndex === -1 && installations.length > 0) {
            // Start from first row when no focus
            setFocusedRowIndex(0);
            scrollFocusedRowIntoView(0);
          }
          break;

        // Navigation: Home (jump to first row)
        case 'Home':
          e.preventDefault();
          if (installations.length > 0) {
            setFocusedRowIndex(0);
            scrollFocusedRowIntoView(0);
          }
          break;

        // Navigation: End (jump to last row)
        case 'End':
          e.preventDefault();
          if (installations.length > 0) {
            const lastIndex = installations.length - 1;
            setFocusedRowIndex(lastIndex);
            scrollFocusedRowIntoView(lastIndex);
          }
          break;

        // Selection: Toggle selection
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (focusedRowIndex >= 0 && focusedRowIndex < installations.length) {
            const installation = installations[focusedRowIndex];
            if (installation) {
              toggleInstallation(installation.id);
            }
          }
          break;

        // Actions: Delete selected installations
        case 'Delete':
        case 'Backspace':
          if (hasSelection()) {
            e.preventDefault();
            options?.onDelete?.();
          }
          break;

        // Actions: Select all
        case 'a':
        case 'A':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            selectAll(installationIds);
          }
          break;

        // Actions: Clear selection
        case 'Escape':
          e.preventDefault();
          clearSelection();
          break;

        // Help: Show keyboard shortcuts
        case '?':
          e.preventDefault();
          setShowHelpDialog(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    installations,
    installationIds,
    focusedRowIndex,
    setFocusedRowIndex,
    toggleInstallation,
    selectAll,
    clearSelection,
    hasSelection,
    scrollFocusedRowIntoView,
    options,
  ]);

  // Reset focus when installations list changes
  useEffect(() => {
    setFocusedRowIndex(-1);
  }, [installations.length, setFocusedRowIndex]);

  return {
    showHelpDialog,
    setShowHelpDialog,
  };
}
