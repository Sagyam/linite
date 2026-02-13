/**
 * Custom hook for managing installation dialog states
 *
 * Extracted from installation-history-table.tsx to reduce complexity
 * Manages delete confirmation and uninstall command dialogs
 */

import { useState, useCallback } from 'react';
import type { InstallationWithRelations } from '@/types/entities';

export interface UseInstallationDialogsReturn {
  // Delete confirmation dialog (used for both single and bulk delete)
  deleteConfirmDialogOpen: boolean;
  setDeleteConfirmDialogOpen: (open: boolean) => void;

  // Single installation selected for delete (null means bulk delete mode)
  selectedInstallation: InstallationWithRelations | null;
  setSelectedInstallation: (installation: InstallationWithRelations | null) => void;

  // Legacy alias for bulk delete dialog state (backwards compatibility)
  bulkDeleteDialogOpen: boolean;
  setBulkDeleteDialogOpen: (open: boolean) => void;

  // Uninstall command dialog
  uninstallCommandDialogOpen: boolean;
  setUninstallCommandDialogOpen: (open: boolean) => void;

  // Handlers
  handleDelete: (installation: InstallationWithRelations) => void;
  handleShowUninstallCommands: () => void;
}

/**
 * Hook to manage installation dialog states
 */
export function useInstallationDialogs(): UseInstallationDialogsReturn {
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationWithRelations | null>(null);
  const [uninstallCommandDialogOpen, setUninstallCommandDialogOpen] = useState(false);

  /**
   * Open delete confirmation dialog for a single installation
   */
  const handleDelete = useCallback((installation: InstallationWithRelations) => {
    setSelectedInstallation(installation);
    setDeleteConfirmDialogOpen(true);
  }, []);

  /**
   * Close delete confirmation dialog and open uninstall command dialog
   */
  const handleShowUninstallCommands = useCallback(() => {
    setDeleteConfirmDialogOpen(false);
    setUninstallCommandDialogOpen(true);
  }, []);

  // Legacy aliases for backwards compatibility
  const bulkDeleteDialogOpen = deleteConfirmDialogOpen;
  const setBulkDeleteDialogOpen = setDeleteConfirmDialogOpen;

  return {
    deleteConfirmDialogOpen,
    setDeleteConfirmDialogOpen,
    selectedInstallation,
    setSelectedInstallation,
    bulkDeleteDialogOpen,
    setBulkDeleteDialogOpen,
    uninstallCommandDialogOpen,
    setUninstallCommandDialogOpen,
    handleDelete,
    handleShowUninstallCommands,
  };
}
