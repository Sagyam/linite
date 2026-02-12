'use client';

import { CrudPage } from '@/components/admin/crud-page';
import { IconUpload } from '@/components/admin/icon-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { useAdminDistros, useDeleteDistro, type Distro } from '@/hooks/use-admin';

interface DistroFormData {
  name: string;
  slug: string;
  family: string;
  iconUrl: string;
  basedOn: string;
  isPopular: boolean;
}

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

export default function DistrosPage() {
  return (
    <CrudPage<Distro, DistroFormData>
      entityName="Distribution"
      entityNamePlural="Distributions"
      entitySlug="distros"
      apiEndpoint="/api/distros"
      useData={useAdminDistros}
      useDelete={useDeleteDistro}
      columns={columns}
      getRowId={(row) => row.id}
      globalFilterPlaceholder="Search distributions by name, slug, family..."
      initialFormData={{
        name: '',
        slug: '',
        family: '',
        iconUrl: '',
        basedOn: '',
        isPopular: false,
      }}
      getFormDataFromItem={(distro) => ({
        name: distro.name,
        slug: distro.slug,
        family: distro.family,
        iconUrl: distro.iconUrl || '',
        basedOn: distro.basedOn || '',
        isPopular: distro.isPopular ?? false,
      })}
      renderFormFields={(formData, setFormData) => (
        <>
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
        </>
      )}
    />
  );
}
