'use client';

import { CrudPage } from '@/components/admin/crud-page';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { useAdminSources, useDeleteSource, type Source } from '@/hooks/use-admin';

interface SourceFormData {
  name: string;
  slug: string;
  installCommand: string;
  requiresSudo: boolean;
  setupCommand: string;
  priority: number;
  apiEndpoint: string;
}

const columns: ColumnDef<Source>[] = [
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
    id: 'installCmd',
    header: 'Install Command',
    cell: ({ row }) => (
      <code className="text-xs bg-muted px-2 py-1 rounded">
        {row.original.installCmd}
      </code>
    ),
    enableSorting: false,
  },
  {
    id: 'requireSudo',
    header: 'Requires Sudo',
    cell: ({ row }) => (
      <Badge variant={row.original.requireSudo ? 'default' : 'secondary'}>
        {row.original.requireSudo ? 'Yes' : 'No'}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    enableSorting: true,
  },
];

export default function SourcesPage() {
  return (
    <CrudPage<Source, SourceFormData>
      entityName="Source"
      entityNamePlural="Sources"
      entitySlug="sources"
      apiEndpoint="/api/sources"
      useData={useAdminSources}
      useDelete={useDeleteSource}
      columns={columns}
      getRowId={(row) => row.id}
      globalFilterPlaceholder="Search sources by name, slug..."
      dialogMaxWidth="max-w-2xl"
      initialFormData={{
        name: '',
        slug: '',
        installCommand: '',
        requiresSudo: true,
        setupCommand: '',
        priority: 50,
        apiEndpoint: '',
      }}
      getFormDataFromItem={(source) => ({
        name: source.name,
        slug: source.slug,
        installCommand: source.installCmd,
        requiresSudo: source.requireSudo ?? false,
        setupCommand: (typeof source.setupCmd === 'string' ? source.setupCmd : JSON.stringify(source.setupCmd || '')) || '',
        priority: source.priority ?? 0,
        apiEndpoint: source.apiEndpoint || '',
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
        </>
      )}
      deleteDescription={(source) =>
        `Are you sure you want to delete "${source.name}"? This action cannot be undone and may affect existing packages.`
      }
    />
  );
}
