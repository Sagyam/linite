'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Package } from '@/hooks/use-admin';

interface App {
  id: string;
  displayName: string;
}

interface Source {
  id: string;
  name: string;
  slug: string;
}

interface PackageFormData {
  appId: string;
  sourceId: string;
  identifier: string;
  version: string;
  size: string;
  maintainer: string;
  isAvailable: boolean;
}

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPackage: Package | null;
  apps: App[];
  sources: Source[];
  initialFormData: PackageFormData;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  editingPackage,
  apps,
  sources,
  initialFormData,
}: PackageFormDialogProps) {
  const [formData, setFormData] = useState<PackageFormData>(initialFormData);
  const [appSelectorOpen, setAppSelectorOpen] = useState(false);

  const selectedApp = apps.find((app) => app.id === formData.appId);

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
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save package');
      }
    } catch (error) {
      console.error('Failed to save package:', error);
      toast.error('Failed to save package');
    }
  };

  // Update form data when initialFormData changes
  if (open && JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
    setFormData(initialFormData);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <PopoverContent className="w-125 p-0">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingPackage ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
