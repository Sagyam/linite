'use client';

import { CrudPage } from '@/components/admin/crud-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ColumnDef } from '@tanstack/react-table';
import { useAdminCategories, useDeleteCategory, type Category } from '@/hooks/use-admin';

interface CategoryFormData {
  name: string;
  slug: string;
  icon: string;
  description: string;
  displayOrder: number;
}

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

export default function CategoriesPage() {
  return (
    <CrudPage<Category, CategoryFormData>
      entityName="Category"
      entityNamePlural="Categories"
      entitySlug="categories"
      apiEndpoint="/api/categories"
      useData={useAdminCategories}
      useDelete={useDeleteCategory}
      columns={columns}
      getRowId={(row) => row.id}
      globalFilterPlaceholder="Search categories by name, slug, description..."
      initialFormData={{
        name: '',
        slug: '',
        icon: '',
        description: '',
        displayOrder: 0,
      }}
      getFormDataFromItem={(category) => ({
        name: category.name,
        slug: category.slug,
        icon: category.icon || '',
        description: category.description || '',
        displayOrder: category.displayOrder,
      })}
      renderFormFields={(formData, setFormData) => (
        <>
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
        </>
      )}
    />
  );
}
