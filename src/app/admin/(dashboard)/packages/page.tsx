'use client';

import { useState, useMemo } from 'react';
import { AdvancedDataTable } from '@/components/admin/advanced-data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { Plus, Search as SearchIcon } from 'lucide-react';
import { useAdminPackages, useDeletePackage, useAdminApps, useAdminSources, type Package } from '@/hooks/use-admin';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SearchResult {
  identifier: string;
  name: string;
  summary?: string;
  version?: string;
  homepage?: string;
  license?: string;
  maintainer?: string;
  source: string;
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [appSelectorOpen, setAppSelectorOpen] = useState(false);

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
    sourceSlug: 'flatpak',
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
      size: pkg.downloadSize || '',
      maintainer: '',
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
    if (!searchData.query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    setIsSearching(true);
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
        const data = await response.json();
        const count = data.count || data.results?.length || 0;
        setSearchResults(data.results || []);
        toast.success(`Found ${count} result${count !== 1 ? 's' : ''}`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const filteredPackages = useMemo(() => {
    if (filterSource === 'all') return packages;
    return packages.filter((pkg) => pkg.source.slug === filterSource);
  }, [packages, filterSource]);

  const selectedApp = apps.find((app) => app.id === formData.appId);

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
      accessorFn: (row) => row.downloadSize || '-',
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
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        getRowId={(row) => row.id}
        enableGlobalFilter={true}
        globalFilterPlaceholder="Search packages by app, source, identifier..."
      />

      {/* Add/Edit Package Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
              <Popover open={appSelectorOpen} onOpenChange={setAppSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={appSelectorOpen}
                    className="w-full justify-between"
                    disabled={!!editingPackage}
                  >
                    {selectedApp ? selectedApp.displayName : 'Select an app...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0">
                  <Command>
                    <CommandInput placeholder="Search apps..." />
                    <CommandList>
                      <CommandEmpty>No app found.</CommandEmpty>
                      <CommandGroup>
                        {apps.map((app) => (
                          <CommandItem
                            key={app.id}
                            value={app.displayName}
                            onSelect={() => {
                              setFormData({ ...formData, appId: app.id });
                              setAppSelectorOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.appId === app.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {app.displayName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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

      {/* Search External APIs Dialog */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Search External APIs</DialogTitle>
            <DialogDescription>
              Search for packages from external package sources
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 space-y-2">
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
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="flatpak">Flatpak</SelectItem>
                    <SelectItem value="snap">Snap</SelectItem>
                    <SelectItem value="aur">AUR</SelectItem>
                    <SelectItem value="homebrew">Homebrew</SelectItem>
                    <SelectItem value="winget">Winget</SelectItem>
                    <SelectItem value="repology">Repology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="searchQuery">Search Query *</Label>
                <div className="flex gap-2">
                  <Input
                    id="searchQuery"
                    value={searchData.query}
                    onChange={(e) =>
                      setSearchData({ ...searchData, query: e.target.value })
                    }
                    placeholder="e.g., firefox"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                  <Button onClick={handleSearch} disabled={isSearching}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchResults.map((result, index) => (
                        <TableRow key={`${result.source}-${result.identifier}-${index}`}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{result.name}</div>
                              {result.summary && (
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {result.summary}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {result.identifier}
                            </code>
                          </TableCell>
                          <TableCell>{result.version || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.source}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => handleAddFromSearch(result)}
                            >
                              Add
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSearchDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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