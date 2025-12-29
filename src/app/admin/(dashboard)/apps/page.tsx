'use client';

import { useState, useMemo } from 'react';
import { DataTable, Column } from '@/components/admin/data-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAdminApps, useDeleteApp } from '@/hooks/use-admin';

interface App {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  isPopular: boolean;
  isFoss: boolean;
  category: {
    name: string;
  } | null;
}

export default function AppsPage() {
  const router = useRouter();
  const { data: apps = [], isLoading: loading } = useAdminApps();
  const deleteAppMutation = useDeleteApp();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingApp, setDeletingApp] = useState<App | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredApps = useMemo(() => {
    if (!searchTerm) return apps;

    return apps.filter(
      (app) =>
        app.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, apps]);

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

  const columns: Column<App>[] = [
    { header: 'Name', accessor: 'displayName' },
    { header: 'Slug', accessor: 'slug' },
    {
      header: 'Category',
      accessor: (row) => row.category?.name || '-',
    },
    {
      header: 'Tags',
      accessor: (row) => (
        <div className="flex gap-1">
          {row.isPopular && <Badge variant="default">Popular</Badge>}
          {row.isFoss && <Badge variant="secondary">FOSS</Badge>}
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: (row) => (
        <span className="line-clamp-1">{row.description || '-'}</span>
      ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

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

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search apps..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <DataTable
        data={filteredApps}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(row) => row.id}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingApp?.displayName}"? This will
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
