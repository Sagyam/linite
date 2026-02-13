'use client';

import { Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
  isDeleting?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onDelete,
  onClearSelection,
  isDeleting = false,
}: BulkActionBarProps) {
  // Don't render if no items selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-auto animate-in slide-in-from-bottom-5 duration-300"
      data-testid="bulk-action-bar"
    >
      <Card className="backdrop-blur-lg bg-background/95 border-t shadow-lg">
        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-foreground" data-testid="selected-count">
              {selectedCount} installation{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              disabled={isDeleting}
              className="gap-2"
              data-testid="clear-selection-button"
            >
              <X className="w-4 h-4" />
              Clear Selection
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeleting}
              className="gap-2"
              data-testid="delete-button"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Selected
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
