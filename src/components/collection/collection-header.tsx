'use client';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Lock, Globe } from 'lucide-react';
import Image from 'next/image';

interface CollectionHeaderProps {
  name: string;
  iconUrl?: string | null;
  description?: string | null;
  isFeatured: boolean;
  isTemplate: boolean;
  isPublic: boolean;
  tags?: string[] | null;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
}

export function CollectionHeader({
  name,
  iconUrl,
  description,
  isFeatured,
  isTemplate,
  isPublic,
  tags,
  user,
}: CollectionHeaderProps) {
  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold">{name}</h1>
            {iconUrl && (
              <Image
                src={iconUrl}
                alt={name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-lg"
              />
            )}
          </div>

          {description && (
            <p className="text-lg text-muted-foreground mb-4">
              {description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {isFeatured && (
              <Badge variant="default" className="gap-1">
                <Star className="w-3 h-3" />
                Featured
              </Badge>
            )}
            {isTemplate && (
              <Badge variant="secondary">Template</Badge>
            )}
            {!isPublic ? (
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

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Author */}
      {user && (
        <div className="flex items-center gap-2 pt-4 border-t">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.image || undefined} />
            <AvatarFallback>
              {user.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{user.name || 'Anonymous'}</p>
            <p className="text-xs text-muted-foreground">Collection author</p>
          </div>
        </div>
      )}
    </div>
  );
}
