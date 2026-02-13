'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { HelpCircle, PackagePlus } from 'lucide-react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { DeviceFilter } from '@/components/distro/device-filter';
import { DeleteConfirmationDialog } from '@/components/dialogs/delete-confirmation-dialog';
import { UninstallCommandDialog } from '@/components/dialogs/uninstall-command-dialog';
import { InstallationKeyboardShortcutsDialog } from '@/components/dialogs/installation-keyboard-shortcuts-dialog';
import { BulkActionBar } from '@/components/selection/bulk-action-bar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useInstallationSelectionStore } from '@/stores/installation-selection-store';
import { useInstallationKeyboardNavigation } from '@/hooks/use-installation-keyboard-navigation';
import { useInstallationMutations } from '@/components/installation-history/use-installation-mutations';
import { useInstallationDialogs } from '@/components/installation-history/use-installation-dialogs';
import { createInstallationColumns } from '@/components/installation-history/columns';
import type { InstallationWithRelations } from '@/types/entities';

async function fetchInstallations(deviceFilter?: string | null): Promise<InstallationWithRelations[]> {
  const params = new URLSearchParams({ limit: '100' });
  if (deviceFilter) {
    params.set('deviceIdentifier', deviceFilter);
  }

  const response = await fetch(`/api/installations?${params}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Failed to fetch installations:', response.status, errorData);
    throw new Error(errorData.error || `Failed to fetch installations (HTTP ${response.status})`);
  }

  const data = await response.json();
  return data || [];
}

export function InstallationHistoryTable() {
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);

  // Custom hooks (EXTRACTED)
  const mutations = useInstallationMutations();
  const dialogs = useInstallationDialogs();

  // Selection store for bulk operations
  const selectedInstallationIds = useInstallationSelectionStore((state) => state.selectedInstallationIds);
  const focusedRowIndex = useInstallationSelectionStore((state) => state.focusedRowIndex);
  const toggleInstallation = useInstallationSelectionStore((state) => state.toggleInstallation);
  const selectAll = useInstallationSelectionStore((state) => state.selectAll);
  const clearSelection = useInstallationSelectionStore((state) => state.clearSelection);

  const { data: installations, isLoading, error } = useQuery({
    queryKey: ['installations', deviceFilter],
    queryFn: () => fetchInstallations(deviceFilter),
    retry: false,
  });

  // Keyboard navigation hook - must come after useQuery since it uses installations data
  const { showHelpDialog, setShowHelpDialog } = useInstallationKeyboardNavigation(
    installations || [],
    {
      onDelete: () => {
        if (selectedInstallationIds.size > 0) {
          dialogs.setBulkDeleteDialogOpen(true);
        }
      },
    }
  );

  // Memoize installation IDs for select all functionality
  const installationIds = useMemo(() => {
    return installations?.map((inst) => inst.id) || [];
  }, [installations]);

  // Handlers (USING EXTRACTED HOOKS)
  const handleConfirmDelete = useCallback(() => {
    if (dialogs.selectedInstallation) {
      // Single delete
      mutations.deleteMutation.mutate(dialogs.selectedInstallation.id);
      dialogs.setDeleteConfirmDialogOpen(false);
      dialogs.setSelectedInstallation(null);
    } else if (selectedInstallationIds.size > 0) {
      // Bulk delete
      const ids = Array.from(selectedInstallationIds);
      mutations.bulkDeleteMutation.mutate(ids);
      clearSelection();
      dialogs.setDeleteConfirmDialogOpen(false);
    }
  }, [dialogs, mutations.deleteMutation, mutations.bulkDeleteMutation, selectedInstallationIds, clearSelection]);

  // handleBulkDelete is now unified with handleConfirmDelete

  const handleUninstallCommandsComplete = useCallback(() => {
    // When uninstall dialog closes, delete the installations
    if (dialogs.selectedInstallation) {
      // Single delete after viewing uninstall commands
      mutations.deleteMutation.mutate(dialogs.selectedInstallation.id);
      dialogs.setSelectedInstallation(null);
    } else if (selectedInstallationIds.size > 0) {
      // Bulk delete after viewing uninstall commands
      const ids = Array.from(selectedInstallationIds);
      mutations.bulkDeleteMutation.mutate(ids);
      clearSelection();
    }
  }, [dialogs, mutations.deleteMutation, mutations.bulkDeleteMutation, selectedInstallationIds, clearSelection]);

  // Get installations for the delete confirmation dialog
  // When a single installation is selected, use that; otherwise use bulk selection
  const installationsForDeleteDialog = useMemo(() => {
    if (dialogs.selectedInstallation) {
      return [dialogs.selectedInstallation];
    }
    if (!installations) return [];
    return installations.filter((inst) => selectedInstallationIds.has(inst.id));
  }, [installations, selectedInstallationIds, dialogs.selectedInstallation]);

  // Column definitions (EXTRACTED)
  const columns = useMemo(
    () => createInstallationColumns(dialogs.handleDelete),
    [dialogs.handleDelete]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <div className="rounded-md border overflow-hidden">
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-red-500 mb-4">
          Failed to load installations: {error.message}
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!installations || installations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="rounded-full bg-muted/50 p-8 mb-6 animate-pulse">
          <PackagePlus className="w-16 h-16 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">No installations yet</h2>
        <p className="text-muted-foreground mb-8 max-w-md leading-relaxed">
          Start tracking your Linux app installations by selecting packages from the home page
          and saving them to your installation history.
        </p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/">
            <PackagePlus className="w-5 h-5" />
            Browse Apps
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <DeviceFilter
          selectedDevice={deviceFilter}
          onDeviceChange={(device) => {
            setDeviceFilter(device);
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowHelpDialog(true)}
          className="text-muted-foreground hover:text-foreground"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle className="w-5 h-5" />
        </Button>
      </div>

      <BulkActionBar
        selectedCount={selectedInstallationIds.size}
        onDelete={() => dialogs.setBulkDeleteDialogOpen(true)}
        onClearSelection={clearSelection}
        isDeleting={mutations.bulkDeleteMutation.isPending}
      />

      <div data-installation-table>
        <AdvancedDataTable
          columns={columns}
          data={installations}
          onDelete={dialogs.handleDelete}
          getRowId={(row) => row.id}
          globalFilterPlaceholder="Search installations..."
          enableRowSelection={true}
          selectedRows={selectedInstallationIds}
          onRowSelectionChange={(newSelection) => {
            // Update the store with the new selection
            clearSelection();
            newSelection.forEach((id) => {
              toggleInstallation(id);
            });
          }}
          onSelectAll={() => selectAll(installationIds)}
          onClearSelection={clearSelection}
          focusedRowIndex={focusedRowIndex}
        />
      </div>

      <DeleteConfirmationDialog
        open={dialogs.deleteConfirmDialogOpen}
        onOpenChange={(open) => {
          dialogs.setDeleteConfirmDialogOpen(open);
          if (!open) {
            dialogs.setSelectedInstallation(null);
          }
        }}
        installations={installationsForDeleteDialog}
        onConfirmDelete={handleConfirmDelete}
        onShowUninstallCommands={dialogs.handleShowUninstallCommands}
        isDeleting={mutations.deleteMutation.isPending || mutations.bulkDeleteMutation.isPending}
      />

      <UninstallCommandDialog
        open={dialogs.uninstallCommandDialogOpen}
        onOpenChange={dialogs.setUninstallCommandDialogOpen}
        installations={installationsForDeleteDialog}
        onComplete={handleUninstallCommandsComplete}
      />

      <InstallationKeyboardShortcutsDialog
        open={showHelpDialog}
        onOpenChange={setShowHelpDialog}
      />
    </div>
  );
}
