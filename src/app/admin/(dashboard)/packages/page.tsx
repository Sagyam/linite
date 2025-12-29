'use client';

import { useState, useMemo } from 'react';
import { DataTable, Column } from '@/components/admin/data-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { useAdminPackages, useDeletePackage, useAdminApps, useAdminSources } from '@/hooks/use-admin';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Package {
  id: string;
  identifier: string;
  version: string | null;
  size: string | null;
  maintainer: string | null;
  isAvailable: boolean;
  app: {
    displayName: string;
  };
  source: {
    name: string;
    slug: string;
  };
}

interface App {
  id: string;
  displayName: string;
}

interface Source {
  id: string;
  name: string;
  slug: string;
}

export default function PackagesPage() {
  const { data: packages = [], isLoading: packagesLoading } = useAdminPackages();
  const { data: apps = [] } = useAdminApps();
  const { data: sources = [] } = useAdminSources();
  const deletePackageMutation = useDeletePackage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [deletingPackage, setDeletingPackage] = useState<Package | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');

  const loading = packagesLoading;

  const [formData, setFormData] = useState({
    appId: '',
    sourceId: '',
    identifier: '',
    version: '',
    size: '',
    maintainer: '',
    isAvailable: true,
  });

  const [searchData, setSearchData] = useState({
    sourceSlug: '',
    query: '',
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

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      appId: '', // We don't have app.id in the package response
      sourceId: '', // We don't have source.id in the package response
      identifier: pkg.identifier,
      version: pkg.version || '',
      size: pkg.size || '',
      maintainer: pkg.maintainer || '',
      isAvailable: pkg.isAvailable,
    });
    setDialogOpen(true);
  };

  const handleDelete = (pkg: Package) => {
    setDeletingPackage(pkg);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingPackage
        ? `/api/packages/${editingPackage.id}`
        : '/api/packages';
      const method = editingPackage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          version: formData.version || null,
          size: formData.size || null,
          maintainer: formData.maintainer || null,
        }),
      });

      if (response.ok) {
        toast.success(`Package ${editingPackage ? 'updated' : 'created'} successfully`);
        setDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save package');
      }
    } catch (error) {
      console.error('Failed to save package:', error);
      toast.error('Failed to save package');
    }
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

  const handleSearch = async () => {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: searchData.sourceSlug,
          query: searchData.query,
        }),
      });

      if (response.ok) {
        const results = await response.json();
        toast.success(`Found ${results.length} results`);
        console.log('Search results:', results);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    }
  };

  const filteredPackages = useMemo(() => {
    if (filterSource === 'all') return packages;
    return packages.filter((pkg) => pkg.source.slug === filterSource);
  }, [packages, filterSource]);

  const columns: Column<Package>[] = [
    { header: 'App', accessor: (row) => row.app.displayName },
    { header: 'Source', accessor: (row) => row.source.name },
    {
      header: 'Identifier',
      accessor: (row) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">
          {row.identifier}
        </code>
      ),
    },
    { header: 'Version', accessor: (row) => row.version || '-' },
    { header: 'Size', accessor: (row) => row.size || '-' },
    {
      header: 'Available',
      accessor: (row) => (
        <Badge variant={row.isAvailable ? 'default' : 'destructive'}>
          {row.isAvailable ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

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

      <DataTable
        data={filteredPackages}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(row) => row.id}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Package' : 'Add Package'}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? 'Update package information'
                : 'Add a new package to an app'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="appId">App *</Label>
              <Select
                value={formData.appId}
                onValueChange={(value) =>
                  setFormData({ ...formData, appId: value })
                }
                disabled={!!editingPackage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  {apps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceId">Source *</Label>
              <Select
                value={formData.sourceId}
                onValueChange={(value) =>
                  setFormData({ ...formData, sourceId: value })
                }
                disabled={!!editingPackage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="identifier">Package Identifier *</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) =>
                  setFormData({ ...formData, identifier: e.target.value })
                }
                placeholder="e.g., org.mozilla.firefox"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) =>
                    setFormData({ ...formData, version: e.target.value })
                  }
                  placeholder="e.g., 120.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) =>
                    setFormData({ ...formData, size: e.target.value })
                  }
                  placeholder="e.g., 150 MB"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintainer">Maintainer</Label>
              <Input
                id="maintainer"
                value={formData.maintainer}
                onChange={(e) =>
                  setFormData({ ...formData, maintainer: e.target.value })
                }
                placeholder="e.g., Flathub Team"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAvailable: checked })
                }
              />
              <Label htmlFor="isAvailable">Package is available</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPackage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search External APIs</DialogTitle>
            <DialogDescription>
              Search for packages from external package sources
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="searchSource">Source *</Label>
              <Select
                value={searchData.sourceSlug}
                onValueChange={(value) =>
                  setSearchData({ ...searchData, sourceSlug: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flatpak">Flatpak</SelectItem>
                  <SelectItem value="snap">Snap</SelectItem>
                  <SelectItem value="aur">AUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchQuery">Search Query *</Label>
              <Input
                id="searchQuery"
                value={searchData.query}
                onChange={(e) =>
                  setSearchData({ ...searchData, query: e.target.value })
                }
                placeholder="e.g., firefox"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSearch}>Search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this package? This action cannot be
              undone.
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
