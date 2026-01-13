'use client';

import { Button } from '@/components/ui/button';
import { Share2, Edit, Trash2, Play } from 'lucide-react';
import Link from 'next/link';

interface CollectionActionsProps {
  collectionId: string;
  isOwner: boolean;
  onApply: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  isSharePending?: boolean;
  isDeletePending?: boolean;
}

export function CollectionActions({
  collectionId,
  isOwner,
  onApply,
  onShare,
  onDelete,
  isSharePending,
  isDeletePending,
}: CollectionActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary action - Apply Collection */}
      <Button size="sm" onClick={onApply} className="gap-2">
        <Play className="w-4 h-4" />
        Apply Collection
      </Button>

      {/* Owner actions */}
      {isOwner && (
        <>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/collections/${collectionId}/edit`} className="gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
          </Button>
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              disabled={isSharePending}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          )}
          {onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              disabled={isDeletePending}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
        </>
      )}
    </div>
  );
}
