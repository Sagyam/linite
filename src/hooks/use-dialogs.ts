/**
 * Custom hook for managing dialog and drawer state
 *
 * Extracted from home-page-client.tsx to reduce complexity
 * Consolidates dialog state and toggle handlers into a single hook
 */

import { useState, useCallback } from 'react';
import { useSelectionStore } from '@/stores/selection-store';

export interface UseDialogsReturn {
  // Selection drawer state
  selectionDrawerOpen: boolean;
  setSelectionDrawerOpen: (open: boolean) => void;
  toggleSelectionDrawer: () => void;

  // Command dialog state
  commandDialogOpen: boolean;
  setCommandDialogOpen: (open: boolean) => void;

  // Save dialog state
  saveDialogOpen: boolean;
  setSaveDialogOpen: (open: boolean) => void;

  // Handlers
  handleGenerateCommand: () => void;
  handleToggleGenerateCommand: () => void;
  handleToggleSelectionDrawer: () => void;
  handleSaveInstallation: () => void;
}

/**
 * Hook to manage dialog and drawer state for the home page
 */
export function useDialogs(): UseDialogsReturn {
  const [selectionDrawerOpen, setSelectionDrawerOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Get selection state from Zustand store
  const selectedAppsSize = useSelectionStore((state) => state.selectedApps.size);
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);

  /**
   * Open command dialog if apps and distro selected, otherwise open selection drawer
   */
  const handleGenerateCommand = useCallback(() => {
    if (selectedAppsSize > 0 && selectedDistro) {
      setCommandDialogOpen(true);
    } else {
      // If distro not selected, open selection drawer to prompt user
      setSelectionDrawerOpen(true);
    }
  }, [selectedAppsSize, selectedDistro]);

  /**
   * Toggle command dialog (close if open, otherwise open via handleGenerateCommand)
   */
  const handleToggleGenerateCommand = useCallback(() => {
    if (commandDialogOpen) {
      setCommandDialogOpen(false);
    } else {
      handleGenerateCommand();
    }
  }, [commandDialogOpen, handleGenerateCommand]);

  /**
   * Toggle selection drawer
   */
  const handleToggleSelectionDrawer = useCallback(() => {
    setSelectionDrawerOpen((prev) => !prev);
  }, []);

  const toggleSelectionDrawer = handleToggleSelectionDrawer;

  /**
   * Open save installation dialog if apps and distro selected
   */
  const handleSaveInstallation = useCallback(() => {
    if (selectedAppsSize > 0 && selectedDistro) {
      setSaveDialogOpen(true);
    }
  }, [selectedAppsSize, selectedDistro]);

  return {
    selectionDrawerOpen,
    setSelectionDrawerOpen,
    toggleSelectionDrawer,
    commandDialogOpen,
    setCommandDialogOpen,
    saveDialogOpen,
    setSaveDialogOpen,
    handleGenerateCommand,
    handleToggleGenerateCommand,
    handleToggleSelectionDrawer,
    handleSaveInstallation,
  };
}