'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppIcon } from '@/components/ui/app-icon';
import { Heart, Package, Eye, Lock, Globe, Star } from 'lucide-react';
import Link from 'next/link';
import type { CollectionWithRelations } from '@/types/entities';

interface CollectionCardProps {
  collection: CollectionWithRelations;
  showAuthor?: boolean;
  onLike?: (collectionId: string) => void;
  isLiked?: boolean;
}

export function CollectionCard({
  collection,
  showAuthor = true,
  onLike,
  isLiked = false,
}: CollectionCardProps) {
  const appCount = collection.items?.length || 0;
  const likeCount = collection._count?.likes || 0;

  const handleLikeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onLike) {
      onLike(collection.id);
    }
  };

  return (
    <Link href={`/collections/${collection.slug}`}>
      <Card className="h-full hover:shadow-lg transition-all duration-200 hover:border-primary/50 cursor-pointer group">
        <CardHeader className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl line-clamp-1 group-hover:text-primary transition-colors">
                {collection.name}
              </CardTitle>
              {collection.description && (
                <CardDescription className="line-clamp-2 mt-2">
                  {collection.description}
                </CardDescription>
              )}
            </div>
            <AppIcon
              iconUrl={collection.iconUrl}
              displayName={collection.name}
              size="md"
              rounded="lg"
              className="w-12 h-12"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {collection.isFeatured && (
              <Badge variant="default" className="gap-1">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            )}
            {collection.isTemplate && (
              <Badge variant="secondary">Template</Badge>
            )}
            {!collection.isPublic ? (
              <Badge variant="outline" className="gap-1">
                <Lock className="w-3 h-3" />
                Private
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Globe className="w-3 h-3" />
                Public
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              <span>{appCount} {appCount === 1 ? 'app' : 'apps'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>{collection.viewCount || 0}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className={`h-auto p-0 hover:bg-transparent gap-1.5 ${
                isLiked ? 'text-red-500' : 'text-muted-foreground'
              }`}
              onClick={handleLikeClick}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </Button>
          </div>

          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {collection.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {collection.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{collection.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {showAuthor && collection.user && (
          <CardFooter className="border-t pt-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={collection.user.image || undefined} />
                <AvatarFallback className="text-xs">
                  {collection.user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {collection.user.name || 'Anonymous'}
              </span>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
