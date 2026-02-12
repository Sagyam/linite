/**
 * Custom hook for managing installation dialog states
 *
 * Extracted from installation-history-table.tsx to reduce complexity
 * Manages 3 dialog states and their handlers
 */

import { useState, useCallback } from 'react';
import type { InstallationWithRelations } from '@/types/entities';

export interface UseInstallationDialogsReturn {
  // Delete dialog
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (open: boolean) => void;
  selectedInstallation: InstallationWithRelations | null;
  setSelectedInstallation: (installation: InstallationWithRelations | null) => void;

  // Bulk delete dialog
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationWithRelations | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [uninstallCommandDialogOpen, setUninstallCommandDialogOpen] = useState(false);

  /**
   * Open delete dialog for a single installation
   */
  const handleDelete = useCallback((installation: InstallationWithRelations) => {
    setSelectedInstallation(installation);
    setDeleteDialogOpen(true);
  }, []);

  /**
   * Close bulk delete dialog and open uninstall command dialog
   */
  const handleShowUninstallCommands = useCallback(() => {
    setBulkDeleteDialogOpen(false);
    setUninstallCommandDialogOpen(true);
  }, []);

  return {
    deleteDialogOpen,
    setDeleteDialogOpen,
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
