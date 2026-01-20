'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface App {
  id: string;
  displayName: string;
}

interface Package {
  id: string;
  identifier: string;
  version: string | null;
  source: {
    name: string;
  };
}

interface Distro {
  id: string;
  name: string;
  slug: string;
}

interface AddInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddInstallationDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddInstallationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    appId: '',
    packageId: '',
    distroId: '',
    deviceIdentifier: '',
    notes: '',
  });

  const [apps, setApps] = useState<App[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [distros, setDistros] = useState<Distro[]>([]);
  const [devices, setDevices] = useState<string[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);

  const fetchApps = useCallback(async () => {
    try {
      const response = await fetch('/api/apps?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setApps(data);
        setFilteredApps(data);
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    }
  }, []);

  const fetchDistros = useCallback(async () => {
    try {
      const response = await fetch('/api/distros');
      if (response.ok) {
        const data = await response.json();
        setDistros(data);
      }
    } catch (error) {
      console.error('Failed to fetch distros:', error);
    }
  }, []);

  const fetchPackages = useCallback(async (appId: string) => {
    try {
      const response = await fetch(`/api/apps/${appId}/packages`);
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  }, []);

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch('/api/installations/devices');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  }, []);

  useEffect(() => {
    fetchApps();
    fetchDistros();
    fetchDevices();
  }, [fetchApps, fetchDistros, fetchDevices]);

  useEffect(() => {
    if (formData.appId) {
      fetchPackages(formData.appId);
      setPackages([]);
      setFormData((prev) => ({ ...prev, packageId: '' }));
    }
  }, [formData.appId, fetchPackages]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = apps.filter((app) =>
        app.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(apps);
    }
  }, [searchQuery, apps]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/installations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: formData.appId,
          packageId: formData.packageId,
          distroId: formData.distroId,
          deviceIdentifier: formData.deviceIdentifier,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        toast.success('Installation added successfully');
        setFormData({
          appId: '',
          packageId: '',
          distroId: '',
          deviceIdentifier: '',
          notes: '',
        });
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to add installation');
      }
    } catch (error) {
      console.error('Failed to add installation:', error);
      toast.error('Failed to add installation');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      appId: '',
      packageId: '',
      distroId: '',
      deviceIdentifier: '',
      notes: '',
    });
    setSearchQuery('');
    setPackages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Installation</DialogTitle>
          <DialogDescription>
            Track an app installation manually (for apps installed outside Linite)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="app">App *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search apps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 mb-2"
                />
              </div>
              <Select
                value={formData.appId}
                onValueChange={(value) =>
                  setFormData({ ...formData, appId: value })
                }
              >
                <SelectTrigger id="app">
                  <SelectValue placeholder="Select an app" />
                </SelectTrigger>
                <SelectContent>
                  {filteredApps.map((app) => (
                    <SelectItem key={app.id} value={app.id}>
                      {app.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package">Package *</Label>
              <Select
                value={formData.packageId}
                onValueChange={(value) =>
                  setFormData({ ...formData, packageId: value })
                }
                disabled={!formData.appId}
              >
                <SelectTrigger id="package">
                  <SelectValue
                    placeholder={
                      !formData.appId
                        ? 'Select an app first'
                        : 'Select a package'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.identifier}
                      {pkg.version && ` (${pkg.version})`} -{' '}
                      {pkg.source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="distro">Distro *</Label>
              <Select
                value={formData.distroId}
                onValueChange={(value) =>
                  setFormData({ ...formData, distroId: value })
                }
              >
                <SelectTrigger id="distro">
                  <SelectValue placeholder="Select a distro" />
                </SelectTrigger>
                <SelectContent>
                  {distros.map((distro) => (
                    <SelectItem key={distro.id} value={distro.id}>
                      {distro.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="device">Device *</Label>
              <Select
                value={formData.deviceIdentifier}
                onValueChange={(value) =>
                  setFormData({ ...formData, deviceIdentifier: value })
                }
              >
                <SelectTrigger id="device">
                  <SelectValue placeholder="Select or enter device" />
                </SelectTrigger>
                <SelectContent>
                  {devices.map((device) => (
                    <SelectItem key={device} value={device}>
                      {device}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {devices.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No devices found. Enter a new device name above or add
                  installations first.
                </p>
              )}
              {!formData.deviceIdentifier && (
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    placeholder="Or type a new device name..."
                    value={formData.deviceIdentifier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deviceIdentifier: e.target.value,
                      })
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Optional notes about this installation"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.appId ||
                !formData.packageId ||
                !formData.distroId ||
                !formData.deviceIdentifier
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Installation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
