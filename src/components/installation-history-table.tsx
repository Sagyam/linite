'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Loader2, Edit } from 'lucide-react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { DeviceFilter } from '@/components/device-filter';
import { AddInstallationDialog } from '@/components/add-installation-dialog';
import { DeleteDialog } from '@/components/admin/delete-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { InstallationWithRelations } from '@/types/entities';

// Using img elements instead of Next.js Image component for table cells
// to avoid layout shifts and hydration issues with dynamic content

async function fetchInstallations(deviceFilter?: string | null): Promise<InstallationWithRelations[]> {
  const params = new URLSearchParams({ limit: '1000' });
  if (deviceFilter) {
    params.set('deviceIdentifier', deviceFilter);
  }

  const response = await fetch(`/api/installations?${params}`);

  if (!response.ok) {
    throw new Error('Failed to fetch installations');
  }

  const data = await response.json();
  return data || [];
}

export function InstallationHistoryTable() {
  const queryClient = useQueryClient();
  const [deviceFilter, setDeviceFilter] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationWithRelations | null>(null);

  const { data: installations, isLoading, error } = useQuery({
    queryKey: ['installations', deviceFilter],
    queryFn: () => fetchInstallations(deviceFilter),
  });

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

  const handleDelete = (installation: InstallationWithRelations) => {
    setSelectedInstallation(installation);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedInstallation) {
      deleteMutation.mutate(selectedInstallation.id);
    }
  };

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
        <p className="text-red-500 mb-4">Failed to load installations</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!installations || installations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Edit className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No installations yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start tracking your app installations across multiple devices
        </p>
        <Button onClick={() => setAddDialogOpen(true)}>
          Add Your First Installation
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
        <Button onClick={() => setAddDialogOpen(true)}>
          Add Installation
        </Button>
      </div>

      <AdvancedDataTable
        columns={columns}
        data={installations}
        onDelete={handleDelete}
        getRowId={(row) => row.id}
        globalFilterPlaceholder="Search installations..."
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="installation"
        itemName={selectedInstallation?.app.displayName}
        onConfirm={handleConfirmDelete}
      />

      <AddInstallationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['installations'] });
          queryClient.invalidateQueries({ queryKey: ['user-devices'] });
        }}
      />
    </div>
  );
}
