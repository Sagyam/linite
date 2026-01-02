'use client';

import { useState, Suspense } from 'react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAdminCategories, useDeleteCategory, type Category } from '@/hooks/use-admin';
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
import { QueryErrorBoundary } from '@/components/error-boundary';
import { DataTableSkeleton } from '@/components/ui/loading-skeletons';

function CategoriesTable() {
  const { data: categories } = useAdminCategories();
  const deleteCategoryMutation = useDeleteCategory();

  const {
    dialogOpen,
    deleteDialogOpen,
    editingItem: editingCategory,
    deletingItem: deletingCategory,
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeDialog,
    closeDeleteDialog,
    handleSubmit,
    confirmDelete,
  } = useCrudDialogs<Category>();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    description: '',
    displayOrder: 0,
  });

  const handleAdd = () => {
    setFormData({
      name: '',
      slug: '',
      icon: '',
      description: '',
      displayOrder: categories.length,
    });
    openCreateDialog();
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || '',
      description: category.description || '',
      displayOrder: category.displayOrder,
    });
    openEditDialog(category);
  };

  const onSubmit = async () => {
    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : '/api/categories';
    const method = editingCategory ? 'PUT' : 'POST';
    const message = `Category ${editingCategory ? 'updated' : 'created'} successfully`;

    await handleSubmit(url, method, formData, message);
  };

  const columns: ColumnDef<Category>[] = [
    { accessorKey: 'name', header: 'Name', enableSorting: true },
    { accessorKey: 'slug', header: 'Slug', enableSorting: true },
    {
      id: 'icon',
      header: 'Icon',
      accessorFn: (row) => row.icon || '-',
      enableSorting: false,
    },
    { accessorKey: 'displayOrder', header: 'Display Order', enableSorting: true },
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
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Categories' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-2">Manage application categories</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <AdvancedDataTable
        data={categories}
        columns={columns}
        onEdit={handleEdit}
        onDelete={openDeleteDialog}
        getRowId={(row) => row.id}
        enableGlobalFilter={true}
        globalFilterPlaceholder="Search categories by name, slug, description..."
      />

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category information'
                : 'Create a new category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Browsers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="e.g., browsers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji or icon name)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="e.g., 🌐"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Category description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        entityName="Category"
        itemName={deletingCategory?.name}
        onConfirm={() => confirmDelete(deleteCategoryMutation, (item) => item.id)}
      />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <QueryErrorBoundary>
      <Suspense fallback={<DataTableSkeleton />}>
        <CategoriesTable />
      </Suspense>
    </QueryErrorBoundary>
  );
}
