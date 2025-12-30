'use client';

import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/data-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAdminSources, useDeleteSource, type Source } from '@/hooks/use-admin';
import { useCrudDialogs } from '@/hooks/use-crud-dialogs';
import { DeleteDialog } from '@/components/admin/delete-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function SourcesPage() {
  const { data: sources = [], isLoading: loading } = useAdminSources();
  const deleteSourceMutation = useDeleteSource();

  const {
    dialogOpen,
    deleteDialogOpen,
    editingItem: editingSource,
    deletingItem: deletingSource,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialog,
    closeDeleteDialog,
    handleSubmit,
    confirmDelete,
  } = useCrudDialogs<Source>();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    installCommand: '',
    requiresSudo: true,
    setupCommand: '',
    priority: 50,
    apiEndpoint: '',
  });

  const handleAdd = () => {
    setFormData({
      name: '',
      slug: '',
      installCommand: '',
      requiresSudo: true,
      setupCommand: '',
      priority: 50,
      apiEndpoint: '',
    });
    openCreateDialog();
  };

  const handleEdit = (source: Source) => {
    setFormData({
      name: source.name,
      slug: source.slug,
      installCommand: source.installCmd,
      requiresSudo: source.requireSudo,
      setupCommand: source.setupCmd || '',
      priority: source.priority,
      apiEndpoint: source.apiEndpoint || '',
    });
    openEditDialog(source);
  };

  const onSubmit = async () => {
    const url = editingSource
      ? `/api/sources/${editingSource.id}`
      : '/api/sources';
    const method = editingSource ? 'PUT' : 'POST';
    const message = `Source ${editingSource ? 'updated' : 'created'} successfully`;

    await handleSubmit(url, method, {
      ...formData,
      setupCommand: formData.setupCommand || null,
      apiEndpoint: formData.apiEndpoint || null,
    }, message);
  };

  const columns: Column<Source>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Slug', accessor: 'slug' },
    {
      header: 'Install Command',
      accessor: (row) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.installCmd}
        </code>
      ),
    },
    {
      header: 'Requires Sudo',
      accessor: (row) => (
        <Badge variant={row.requireSudo ? 'default' : 'secondary'}>
          {row.requireSudo ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    { header: 'Priority', accessor: 'priority' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Sources' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold ">Sources</h1>
          <p className="text-muted-foreground mt-2">Manage package sources</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      <DataTable
        data={sources}
        columns={columns}
        onEdit={handleEdit}
        onDelete={openDeleteDialog}
        getRowId={(row) => row.id}
      />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSource ? 'Edit Source' : 'Add Source'}
            </DialogTitle>
            <DialogDescription>
              {editingSource ? 'Update source information' : 'Create a new package source'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Flatpak"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., flatpak"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="installCommand">Install Command Template *</Label>
              <Input
                id="installCommand"
                value={formData.installCommand}
                onChange={(e) => setFormData({ ...formData, installCommand: e.target.value })}
                placeholder="e.g., flatpak install -y {repo} {packages}"
              />
              <p className="text-xs text-gray-500">
                Use {'{packages}'} as placeholder for package names
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="setupCommand">Setup Command (optional)</Label>
              <Textarea
                id="setupCommand"
                value={formData.setupCommand}
                onChange={(e) => setFormData({ ...formData, setupCommand: e.target.value })}
                placeholder="e.g., flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">API Endpoint (optional)</Label>
              <Input
                id="apiEndpoint"
                value={formData.apiEndpoint}
                onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                placeholder="e.g., https://flathub.org/api/v2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Higher = preferred</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiresSudo">Requires Sudo</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Switch
                    id="requiresSudo"
                    checked={formData.requiresSudo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, requiresSudo: checked })
                    }
                  />
                  <span className="text-sm">
                    {formData.requiresSudo ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {editingSource ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        entityName="Source"
        itemName={deletingSource?.name}
        onConfirm={() => confirmDelete(deleteSourceMutation, (item) => item.id)}
        description={
          deletingSource
            ? `Are you sure you want to delete "${deletingSource.name}"? This action cannot be undone and may affect existing packages.`
            : undefined
        }
      />
    </div>
  );
}
