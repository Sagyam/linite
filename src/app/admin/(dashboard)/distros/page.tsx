'use client';

import { useState } from 'react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { IconUpload } from '@/components/admin/icon-upload';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAdminDistros, useDeleteDistro, type Distro } from '@/hooks/use-admin';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';

export default function DistrosPage() {
  const { data: distros = [], isLoading: loading } = useAdminDistros();
  const deleteDistroMutation = useDeleteDistro();

  const {
    dialogOpen,
    deleteDialogOpen,
    editingItem: editingDistro,
    deletingItem: deletingDistro,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialog,
    closeDeleteDialog,
    handleSubmit,
    confirmDelete,
  } = useCrudDialogs<Distro>();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    family: '',
    iconUrl: '',
    basedOn: '',
    isPopular: false,
  });

  const handleAdd = () => {
    setFormData({
      name: '',
      slug: '',
      family: '',
      iconUrl: '',
      basedOn: '',
      isPopular: false,
    });
    openCreateDialog();
  };

  const handleEdit = (distro: Distro) => {
    setFormData({
      name: distro.name,
      slug: distro.slug,
      family: distro.family,
      iconUrl: distro.iconUrl || '',
      basedOn: distro.basedOn || '',
      isPopular: distro.isPopular,
    });
    openEditDialog(distro);
  };

  const onSubmit = async () => {
    const url = editingDistro
      ? `/api/distros/${editingDistro.id}`
      : '/api/distros';
    const method = editingDistro ? 'PUT' : 'POST';
    const message = `Distro ${editingDistro ? 'updated' : 'created'} successfully`;

    await handleSubmit(url, method, {
      ...formData,
      iconUrl: formData.iconUrl || null,
      basedOn: formData.basedOn || null,
    }, message);
  };

  const columns: ColumnDef<Distro>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      enableSorting: true,
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
      enableSorting: true,
    },
    {
      accessorKey: 'family',
      header: 'Family',
      enableSorting: true,
    },
    {
      id: 'basedOn',
      header: 'Based On',
      accessorFn: (row) => row.basedOn || '-',
      enableSorting: true,
    },
    {
      id: 'popular',
      header: 'Popular',
      cell: ({ row }) => (
        <Badge variant={row.original.isPopular ? 'default' : 'secondary'}>
          {row.original.isPopular ? 'Yes' : 'No'}
        </Badge>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Distros' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Distributions</h1>
          <p className="mt-2">Manage Linux distributions</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Distro
        </Button>
      </div>

      <AdvancedDataTable
        data={distros}
        columns={columns}
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={openDeleteDialog}
        getRowId={(row) => row.id}
        enableGlobalFilter={true}
        globalFilterPlaceholder="Search distributions by name, slug, family..."
      />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingDistro ? 'Edit Distribution' : 'Add Distribution'}
            </DialogTitle>
            <DialogDescription>
              {editingDistro
                ? 'Update distribution information'
                : 'Create a new Linux distribution'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Ubuntu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g., ubuntu"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="family">Family *</Label>
                <Input
                  id="family"
                  value={formData.family}
                  onChange={(e) => setFormData({ ...formData, family: e.target.value })}
                  placeholder="e.g., debian"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basedOn">Based On</Label>
                <Input
                  id="basedOn"
                  value={formData.basedOn}
                  onChange={(e) => setFormData({ ...formData, basedOn: e.target.value })}
                  placeholder="e.g., debian"
                />
              </div>
            </div>
            <IconUpload
              iconUrl={formData.iconUrl}
              onIconChange={(url) => setFormData({ ...formData, iconUrl: url })}
              label="Distro Icon"
              pathPrefix="distro-icons"
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="isPopular"
                checked={formData.isPopular}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPopular: checked })
                }
              />
              <Label htmlFor="isPopular">Mark as popular</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {editingDistro ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        entityName="Distribution"
        itemName={deletingDistro?.name}
        onConfirm={() => confirmDelete(deleteDistroMutation, (item) => item.id)}
      />
    </div>
  );
}
