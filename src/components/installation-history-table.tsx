'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { HelpCircle, Loader2, PackagePlus } from 'lucide-react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { DeviceFilter } from '@/components/device-filter';
import { DeleteDialog } from '@/components/admin/delete-dialog';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { UninstallCommandDialog } from '@/components/uninstall-command-dialog';
import { InstallationKeyboardShortcutsDialog } from '@/components/installation-keyboard-shortcuts-dialog';
import { BulkActionBar } from '@/components/bulk-action-bar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useInstallationSelectionStore } from '@/stores/installation-selection-store';
import { useInstallationKeyboardNavigation } from '@/hooks/use-installation-keyboard-navigation';
import type { InstallationWithRelations } from '@/types/entities';

// Using img elements instead of Next.js Image component for table cells
// to avoid layout shifts and hydration issues with dynamic content

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
  const queryClient = useQueryClient();
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationWithRelations | null>(null);

  // Bulk delete and uninstall dialogs state
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [uninstallCommandDialogOpen, setUninstallCommandDialogOpen] = useState(false);

  // Selection store for bulk operations
  const selectedInstallationIds = useInstallationSelectionStore((state) => state.selectedInstallationIds);
  const focusedRowIndex = useInstallationSelectionStore((state) => state.focusedRowIndex);
  const toggleInstallation = useInstallationSelectionStore((state) => state.toggleInstallation);
  const selectAll = useInstallationSelectionStore((state) => state.selectAll);
  const clearSelection = useInstallationSelectionStore((state) => state.clearSelection);
  const setFocusedRowIndex = useInstallationSelectionStore((state) => state.setFocusedRowIndex);

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
          setBulkDeleteDialogOpen(true);
        }
      },
    }
  );

  // Memoize installation IDs for select all functionality
  const installationIds = useMemo(() => {
    return installations?.map((inst) => inst.id) || [];
  }, [installations]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/installations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete installation');
      }
    },
    onSuccess: () => {
      toast.success('Installation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
      setDeleteDialogOpen(false);
      setSelectedInstallation(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (installationIds: string[]) => {
      const response = await fetch('/api/installations/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installationIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete installations');
      }

      return response.json();
    },
    onSuccess: (data) => {
      const count = data.deletedCount || selectedInstallationIds.size;
      toast.success(`${count} installation${count !== 1 ? 's' : ''} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
      clearSelection();
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      // Keep selection intact on error
    },
  });

  const handleDelete = (installation: InstallationWithRelations) => {
    setSelectedInstallation(installation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedInstallation) {
      deleteMutation.mutate(selectedInstallation.id);
    }
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedInstallationIds);
    bulkDeleteMutation.mutate(ids);
  };

  const handleShowUninstallCommands = () => {
    // Close delete confirmation dialog
    setBulkDeleteDialogOpen(false);
    // Open uninstall command dialog
    setUninstallCommandDialogOpen(true);
  };

  const handleUninstallCommandsComplete = () => {
    // When uninstall dialog closes, delete the installations
    const ids = Array.from(selectedInstallationIds);
    bulkDeleteMutation.mutate(ids);
  };

  // Get selected installations for the delete confirmation dialog
  const selectedInstallations = useMemo(() => {
    if (!installations) return [];
    return installations.filter((inst) => selectedInstallationIds.has(inst.id));
  }, [installations, selectedInstallationIds]);

  const columns: ColumnDef<InstallationWithRelations>[] = [
    {
      accessorKey: 'app.displayName',
      header: 'App',
      cell: ({ row }) => {
        const app = row.original.app;
        return (
          <div className="flex items-center space-x-2">
            {app.iconUrl && (
              <img
                src={app.iconUrl}
                alt={app.displayName}
                className="w-6 h-6 rounded"
              />
            )}
            <span className="font-medium">{app.displayName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'package.identifier',
      header: 'Package',
      cell: ({ row }) => {
        const pkg = row.original.package;
        return (
          <div className="space-y-0.5">
            <div className="font-mono text-sm">{pkg.identifier}</div>
            <div className="text-xs text-muted-foreground">
              {pkg.version && `${pkg.version} · `}
              {pkg.source.name}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'distro.name',
      header: 'Distro',
      cell: ({ row }) => {
        const distro = row.original.distro;
        return (
          <div className="flex items-center space-x-2">
            {distro.iconUrl && (
              <img
                src={distro.iconUrl}
                alt={distro.name}
                className="w-5 h-5 rounded"
              />
            )}
            <span>{distro.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'deviceIdentifier',
      header: 'Device',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.deviceIdentifier}</span>
      ),
    },
    {
      accessorKey: 'installedAt',
      header: 'Installed At',
      cell: ({ row }) => {
        const date = new Date(row.original.installedAt);
        return <span className="text-sm">{format(date, 'PPP')}</span>;
      },
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.notes || '-'}
        </span>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <PackagePlus className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No installations yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Select apps from the{' '}
          <a href="/" className="text-primary hover:underline font-medium">
            main page
          </a>
          , then click "Save as Installation" in the drawer to track them here.
        </p>
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
        onDelete={() => setBulkDeleteDialogOpen(true)}
        onClearSelection={clearSelection}
        isDeleting={bulkDeleteMutation.isPending}
      />

      <div data-installation-table>
        <AdvancedDataTable
          columns={columns}
          data={installations}
          onDelete={handleDelete}
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

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="installation"
        itemName={selectedInstallation?.app.displayName}
        onConfirm={handleConfirmDelete}
      />

      <DeleteConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        installations={selectedInstallations}
        onConfirmDelete={handleBulkDelete}
        onShowUninstallCommands={handleShowUninstallCommands}
      />

      <UninstallCommandDialog
        open={uninstallCommandDialogOpen}
        onOpenChange={setUninstallCommandDialogOpen}
        installations={selectedInstallations}
        onComplete={handleUninstallCommandsComplete}
      />

      <InstallationKeyboardShortcutsDialog
        open={showHelpDialog}
        onOpenChange={setShowHelpDialog}
      />
    </div>
  );
}
