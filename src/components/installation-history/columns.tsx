/**
 * Column definitions for installation history table
 *
 * Extracted from installation-history-table.tsx to reduce complexity
 * Defines the structure and rendering of table columns
 */

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import type { InstallationWithRelations } from '@/types/entities';
import { OptimizedImage } from '@/components/ui/optimized-image';

/**
 * Create column definitions for the installation history table
 *
 * @param handleDelete - Callback for delete action (optional, for future actions column)
 * @returns Array of column definitions
 */
export function createInstallationColumns(
  _handleDelete?: (installation: InstallationWithRelations) => void
): ColumnDef<InstallationWithRelations>[] {
  return [
    {
      accessorKey: 'app.displayName',
      header: 'App',
      cell: ({ row }) => {
        const app = row.original.app;
        return (
          <div className="flex items-center space-x-3">
            {app.iconUrl && (
              <OptimizedImage
                src={app.iconUrl}
                alt={app.displayName}
                width={32}
                height={32}
                className="w-8 h-8 rounded object-contain"
              />
            )}
            <span className="font-semibold text-base">{app.displayName}</span>
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
              <OptimizedImage
                src={distro.iconUrl}
                alt={distro.name}
                width={20}
                height={20}
                className="w-5 h-5 rounded object-contain"
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
}
