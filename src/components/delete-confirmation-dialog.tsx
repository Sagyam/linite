'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { InstallationWithRelations } from '@/types/entities';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installations: InstallationWithRelations[];
  onConfirmDelete: () => void;
  onShowUninstallCommands: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  installations,
  onConfirmDelete,
  onShowUninstallCommands,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const displayCount = Math.min(installations.length, 10);
  const hasMore = installations.length > 10;
  const displayedInstallations = installations.slice(0, displayCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {installations.length} installation{installations.length !== 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-2 text-muted-foreground">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-orange-500" />
                <span>This action cannot be undone. All installation records will be permanently deleted.</span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-md border">
                {displayedInstallations.map((installation) => (
                  <div
                    key={installation.id}
                    className="flex items-center gap-2 p-3 border-b last:border-b-0"
                  >
                    {installation.app.iconUrl && (
                      <img
                        src={installation.app.iconUrl}
                        alt={installation.app.displayName}
                        className="w-6 h-6 rounded"
                      />
                    )}
                    <span className="font-medium">{installation.app.displayName}</span>
                  </div>
                ))}
                {hasMore && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    and {installations.length - displayCount} more...
                  </div>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirmDelete} disabled={isDeleting}>
            Just Delete
          </Button>
          <Button onClick={onShowUninstallCommands} disabled={isDeleting}>
            Show Uninstall Commands
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
