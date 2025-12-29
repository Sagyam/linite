'use client';

import { useState } from 'react';
import { DataTable, Column } from '@/components/admin/data-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAdminSources, useDeleteSource } from '@/hooks/use-admin';
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
import { toast } from 'sonner';

interface Source {
  id: string;
  name: string;
  slug: string;
  installCommand: string;
  requiresSudo: boolean;
  setupCommand: string | null;
  priority: number;
  apiEndpoint: string | null;
}

export default function SourcesPage() {
  const { data: sources = [], isLoading: loading } = useAdminSources();
  const deleteSourceMutation = useDeleteSource();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [deletingSource, setDeletingSource] = useState<Source | null>(null);

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
    setEditingSource(null);
    setFormData({
      name: '',
      slug: '',
      installCommand: '',
      requiresSudo: true,
      setupCommand: '',
      priority: 50,
      apiEndpoint: '',
    });
    setDialogOpen(true);
  };

  const handleEdit = (source: Source) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      slug: source.slug,
      installCommand: source.installCommand,
      requiresSudo: source.requiresSudo,
      setupCommand: source.setupCommand || '',
      priority: source.priority,
      apiEndpoint: source.apiEndpoint || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = (source: Source) => {
    setDeletingSource(source);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingSource
        ? `/api/sources/${editingSource.id}`
        : '/api/sources';
      const method = editingSource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          setupCommand: formData.setupCommand || null,
          apiEndpoint: formData.apiEndpoint || null,
        }),
      });

      if (response.ok) {
        toast.success(`Source ${editingSource ? 'updated' : 'created'} successfully`);
        setDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save source');
      }
    } catch (error) {
      console.error('Failed to save source:', error);
      toast.error('Failed to save source');
    }
  };

  const confirmDelete = () => {
    if (!deletingSource) return;

    deleteSourceMutation.mutate(deletingSource.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingSource(null);
      },
    });
  };

  const columns: Column<Source>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Slug', accessor: 'slug' },
    {
      header: 'Install Command',
      accessor: (row) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.installCommand}
        </code>
      ),
    },
    {
      header: 'Requires Sudo',
      accessor: (row) => (
        <Badge variant={row.requiresSudo ? 'default' : 'secondary'}>
          {row.requiresSudo ? 'Yes' : 'No'}
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
        onDelete={handleDelete}
        getRowId={(row) => row.id}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingSource ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Source</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingSource?.name}"? This action
              cannot be undone and may affect existing packages.
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
