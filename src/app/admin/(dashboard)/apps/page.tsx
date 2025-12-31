'use client';

import { useState } from 'react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminApps, useDeleteApp, type App } from '@/hooks/use-admin';
import { ColumnDef } from '@tanstack/react-table';

export default function AppsPage() {
  const router = useRouter();
  const { data: apps = [], isLoading: loading } = useAdminApps();
  const deleteAppMutation = useDeleteApp();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingApp, setDeletingApp] = useState<App | null>(null);

  const handleEdit = (app: App) => {
    router.push(`/admin/apps/${app.id}/edit`);
  };

  const handleDelete = (app: App) => {
    setDeletingApp(app);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingApp) return;

    deleteAppMutation.mutate(deletingApp.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingApp(null);
      },
    });
  };

  const columns: ColumnDef<App>[] = [
    {
      accessorKey: 'displayName',
      header: 'Name',
      enableSorting: true,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      enableSorting: true,
    },
    {
      id: 'category',
      header: 'Category',
      accessorFn: (row) => row.category?.name || '-',
      enableSorting: true,
    },
    {
      id: 'tags',
      header: 'Tags',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.isPopular && <Badge variant="default">Popular</Badge>}
          {row.original.isFoss && <Badge variant="secondary">FOSS</Badge>}
        </div>
      ),
      enableSorting: false,
    },
    {
      id: 'description',
      header: 'Description',
      accessorFn: (row) => row.description || '-',
      cell: ({ row }) => (
        <span className="line-clamp-1">{row.original.description || '-'}</span>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Apps' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Applications</h1>
          <p className="text-muted-foreground mt-2">Manage application catalog</p>
        </div>
        <Link href="/admin/apps/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add App
          </Button>
        </Link>
      </div>

      <AdvancedDataTable
        data={apps}
        columns={columns}
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(row) => row.id}
        enableGlobalFilter={true}
        globalFilterPlaceholder="Search apps by name, slug, category, or description..."
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingApp?.displayName}&quot;? This will
              also delete all associated packages. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
