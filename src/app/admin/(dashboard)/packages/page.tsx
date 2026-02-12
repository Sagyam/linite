'use client';

import { useState, useMemo, Suspense } from 'react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { useAdminPackages, useDeletePackage, useAdminApps, useAdminSources, type Package } from '@/hooks/use-admin';
import { DeleteDialog } from '@/components/admin/delete-dialog';
import { PackageSearchDialog, type SearchResult } from '@/components/admin/package-search-dialog';
import { PackageFormDialog } from '@/components/admin/package-form-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QueryErrorBoundary } from '@/components/error-boundary';
import { DataTableSkeleton } from '@/components/ui/loading-skeletons';

function PackagesTable() {
  const { data: packages } = useAdminPackages();
  const { data: apps } = useAdminApps();
  const { data: sources } = useAdminSources();
  const deletePackageMutation = useDeletePackage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<Package | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');

  const [formData, setFormData] = useState({
    appId: '',
    sourceId: '',
    identifier: '',
    version: '',
    size: '',
    maintainer: '',
    isAvailable: true,
  });

  const handleAdd = () => {
    setEditingPackage(null);
    setFormData({
      appId: '',
      sourceId: '',
      identifier: '',
      version: '',
      size: '',
      maintainer: '',
      isAvailable: true,
    });
    setDialogOpen(true);
  };

  const handleAddFromSearch = (result: SearchResult) => {
    // Map external API source names to database source slugs
    const sourceMapping: Record<string, string> = {
      'flatpak': 'flatpak',
      'snap': 'snap',
      'aur': 'aur',
      'homebrew': 'homebrew',
      'winget': 'winget',
      'repology': 'flatpak', // Repology aggregates multiple sources, default to flatpak
    };

    const sourceSlug = sourceMapping[result.source] || result.source;
    const source = sources.find((s) => s.slug === sourceSlug);

    if (!source) {
      toast.error(`Source "${result.source}" (${sourceSlug}) not found in database. Please add it to Sources first.`);
      return;
    }

    setEditingPackage(null);
    setFormData({
      appId: '',
      sourceId: source.id,
      identifier: result.identifier,
      version: result.version || '',
      size: '',
      maintainer: result.maintainer || '',
      isAvailable: true,
    });
    setSearchDialogOpen(false);
    setDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      appId: pkg.appId,
      sourceId: pkg.sourceId,
      identifier: pkg.identifier,
      version: pkg.version || '',
      size: pkg.size?.toString() || '',
      maintainer: pkg.maintainer || '',
      isAvailable: pkg.isAvailable ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = (pkg: Package) => {
    setDeletingPackage(pkg);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingPackage) return;

    deletePackageMutation.mutate(deletingPackage.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setDeletingPackage(null);
      },
    });
  };

  const filteredPackages = useMemo(() => {
    if (filterSource === 'all') return packages;
    return packages.filter((pkg) => pkg.source.slug === filterSource);
  }, [packages, filterSource]);

  const columns: ColumnDef<Package>[] = [
    {
      id: 'app',
      header: 'App',
      accessorFn: (row) => row.app.displayName,
      enableSorting: true,
    },
    {
      id: 'source',
      header: 'Source',
      accessorFn: (row) => row.source.name,
      enableSorting: true,
    },
    {
      id: 'identifier',
      header: 'Identifier',
      accessorFn: (row) => row.identifier,
      cell: ({ row }) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.original.identifier}
        </code>
      ),
      enableSorting: true,
    },
    {
      id: 'version',
      header: 'Version',
      accessorFn: (row) => row.version || '-',
      enableSorting: true,
    },
    {
      id: 'size',
      header: 'Size',
      accessorFn: (row) => row.size || '-',
      enableSorting: false,
    },
    {
      id: 'available',
      header: 'Available',
      cell: ({ row }) => (
        <Badge variant={row.original.isAvailable ? 'default' : 'destructive'}>
          {row.original.isAvailable ? 'Yes' : 'No'}
        </Badge>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Packages' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Packages</h1>
          <p className="text-muted-foreground mt-2">Manage application packages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSearchDialogOpen(true)}>
            <SearchIcon className="h-4 w-4 mr-2" />
            Search External APIs
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Package
          </Button>
        </div>
      </div>

      <Tabs value={filterSource} onValueChange={setFilterSource} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All Sources</TabsTrigger>
          {sources.map((source) => (
            <TabsTrigger key={source.id} value={source.slug}>
              {source.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AdvancedDataTable
        data={filteredPackages}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(row) => row.id}
        enableGlobalFilter={true}
        globalFilterPlaceholder="Search packages by app, source, identifier..."
      />

      <PackageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingPackage={editingPackage}
        apps={apps}
        sources={sources}
        initialFormData={formData}
      />

      <PackageSearchDialog
        open={searchDialogOpen}
        onOpenChange={setSearchDialogOpen}
        onAddResult={handleAddFromSearch}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Package"
        itemName={deletingPackage ? deletingPackage.identifier : undefined}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function PackagesPage() {
  return (
    <QueryErrorBoundary>
      <Suspense fallback={<DataTableSkeleton />}>
        <PackagesTable />
      </Suspense>
    </QueryErrorBoundary>
  );
}
