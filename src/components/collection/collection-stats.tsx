'use client';

import { Package, Eye, Heart } from 'lucide-react';

interface CollectionStatsProps {
  appCount: number;
  viewCount: number;
  likeCount: number;
}

export function CollectionStats({ appCount, viewCount, likeCount }: CollectionStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Package className="w-4 h-4" />
        <span>{appCount} apps</span>
      </div>
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>{viewCount} views</span>
      </div>
      <div className="flex items-center gap-2">
        <Heart className="w-4 h-4" />
        <span>{likeCount} likes</span>
      </div>
    </div>
  );
}
