'use client';

import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { PackageBreakdown } from '@/types';

interface SaveInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  appCount: number;
  selectedAppIds: string[];
  selectedDistro: string | null;
  sourcePreference: string | null;
  nixosInstallMethod: 'nix-shell' | 'nix-env' | 'nix-flakes' | null;
}

export function SaveInstallationDialog({
  open,
  onOpenChange,
  onSuccess,
  appCount,
  selectedAppIds,
  selectedDistro,
  sourcePreference,
  nixosInstallMethod,
}: SaveInstallationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!deviceIdentifier.trim()) {
      toast.error('Please enter a device name');
      return;
    }

    if (!selectedDistro) {
      toast.error('Please select a distribution first');
      return;
    }

    if (selectedAppIds.length === 0) {
      toast.error('No apps selected');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Generate commands to get package breakdown
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distroSlug: selectedDistro,
          appIds: selectedAppIds,
          sourcePreference,
          nixosInstallMethod,
        }),
      });

      if (!generateResponse.ok) {
        const error = await generateResponse.json();
        throw new Error(error.error || 'Failed to determine packages');
      }

      const { breakdown } = await generateResponse.json();

      console.log('Breakdown from /api/generate:', breakdown);

      // Step 2: Create installations for each package in the breakdown
      const installationPromises = breakdown.map(async (item: PackageBreakdown) => {
        // These fields are guaranteed to exist in breakdown from /api/generate
        if (!item.appId || !item.packageId || !item.distroId) {
          throw new Error('Invalid breakdown data: missing required fields');
        }

        const payload: {
          appId: string;
          packageId: string;
          distroId: string;
          deviceIdentifier: string;
          notes?: string;
        } = {
          appId: item.appId,
          packageId: item.packageId,
          distroId: item.distroId,
          deviceIdentifier: deviceIdentifier.trim(),
        };

        // Only include notes if they're not empty
        if (notes.trim()) {
          payload.notes = notes.trim();
        }

        console.log('Creating installation with payload:', payload);

        const response = await fetch('/api/installations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Installation creation failed:', {
            status: response.status,
            error,
            payload,
          });
          throw new Error(error.error || `Failed to save ${item.appName || 'app'}`);
        }

        return response.json();
      });

      const results = await Promise.allSettled(installationPromises);

      // Count successes and failures (actually checking HTTP status)
      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      // Log failures for debugging
      const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
      if (failures.length > 0) {
        console.error('Failed installations:', failures);
      }

      if (successful > 0) {
        toast.success(
          `${successful} app${successful === 1 ? '' : 's'} saved to "${deviceIdentifier.trim()}"${
            failed > 0 ? ` (${failed} failed)` : ''
          }`
        );
      } else {
        // Show the actual error message from the first failure
        const firstError = failures[0]?.reason?.message || 'All installations failed';
        throw new Error(firstError);
      }

      // Reset form
      setDeviceIdentifier('');
      setNotes('');

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save installations:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to save installations'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setDeviceIdentifier('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Installation</DialogTitle>
          <DialogDescription>
            Track {appCount} {appCount === 1 ? 'app' : 'apps'} as installed on this device
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="device">Device Name *</Label>
              <Input
                id="device"
                placeholder="My Laptop"
                value={deviceIdentifier}
                onChange={(e) => setDeviceIdentifier(e.target.value)}
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !deviceIdentifier.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
