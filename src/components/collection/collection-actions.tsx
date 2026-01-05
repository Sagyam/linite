'use client';

import { Button } from '@/components/ui/button';
import { Heart, Share2, Edit, Files, Trash2, Play } from 'lucide-react';
import Link from 'next/link';

interface CollectionActionsProps {
  collectionId: string;
  isOwner: boolean;
  isAuthenticated: boolean;
  onApply: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onClone?: () => void;
  onDelete?: () => void;
  isLikePending?: boolean;
  isSharePending?: boolean;
  isClonePending?: boolean;
  isDeletePending?: boolean;
}

export function CollectionActions({
  collectionId,
  isOwner,
  isAuthenticated,
  onApply,
  onLike,
  onShare,
  onClone,
  onDelete,
  isLikePending,
  isSharePending,
  isClonePending,
  isDeletePending,
}: CollectionActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Primary action - Apply Collection */}
      <Button size="sm" onClick={onApply} className="gap-2">
        <Play className="w-4 h-4" />
        Apply Collection
      </Button>

      {/* Like button for non-owners */}
      {isAuthenticated && !isOwner && onLike && (
        <Button
          variant="outline"
          size="sm"
          onClick={onLike}
          disabled={isLikePending}
          className="gap-2"
        >
          <Heart className="w-4 h-4" />
          Like
        </Button>
      )}

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

      {/* Clone button for non-owners */}
      {isAuthenticated && !isOwner && onClone && (
        <Button
          variant="outline"
          size="sm"
          onClick={onClone}
          disabled={isClonePending}
          className="gap-2"
        >
          <Files className="w-4 h-4" />
          Clone
        </Button>
      )}
    </div>
  );
}
