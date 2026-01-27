'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lock, Package, Eye, Heart, Loader2, Star } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/optimized-image';
import type { CollectionWithRelations } from '@/types/entities';

async function fetchSharedCollection(token: string): Promise<CollectionWithRelations> {
  const response = await fetch(`/api/collections/share/${token}`);
  if (!response.ok) throw new Error('Collection not found or share link is invalid');
  return response.json();
}

export default function SharedCollectionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['shared-collection', token],
    queryFn: () => fetchSharedCollection(token),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="rounded-full bg-muted p-6 inline-block mb-6">
            <Lock className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Collection Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This collection doesn&apos;t exist or the share link is invalid
          </p>
          <Button asChild>
            <Link href="/collections">Browse Collections</Link>
          </Button>
        </div>
      </div>
    );
  }

  const appCount = collection.items?.length || 0;
  const likeCount = collection._count?.likes || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 px-4 max-w-6xl mx-auto">
        {/* Shared Banner */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-primary" />
            <p className="text-primary">
              You&apos;re viewing a shared collection via private link
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold">{collection.name}</h1>
                {collection.iconUrl && (
                  <OptimizedImage
                    src={collection.iconUrl}
                    alt={collection.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-lg"
                  />
                )}
              </div>

              {collection.description && (
                <p className="text-lg text-muted-foreground mb-4">
                  {collection.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {collection.isFeatured && (
                  <Badge variant="default" className="gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </Badge>
                )}
                {collection.isTemplate && (
                  <Badge variant="secondary">Template</Badge>
                )}
                <Badge variant="outline" className="gap-1">
                  <Lock className="w-3 h-3" />
                  Shared via link
                </Badge>
              </div>

              {collection.tags && collection.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {collection.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>{appCount} apps</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{collection.viewCount || 0} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>{likeCount} likes</span>
            </div>
          </div>

          {/* Author */}
          {collection.user && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Avatar className="w-8 h-8">
                <AvatarImage src={collection.user.image || undefined} />
                <AvatarFallback>
                  {collection.user.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{collection.user.name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">Collection author</p>
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="bg-muted rounded-lg p-6 border">
            <h2 className="font-semibold mb-2">Like this collection?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to clone this collection to your account and customize it
            </p>
            <Button asChild>
              <Link href="/login">Sign in to Clone</Link>
            </Button>
          </div>
        </div>

        {/* Apps List */}
        <Card>
          <CardHeader>
            <CardTitle>Apps in this Collection</CardTitle>
            <CardDescription>
              {appCount} {appCount === 1 ? 'app' : 'apps'} selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collection.items?.map((item) => (
                <Card key={item.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {item.app.iconUrl && (
                        <OptimizedImage
                          src={item.app.iconUrl}
                          alt={item.app.displayName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{item.app.displayName}</h3>
                        {item.app.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {item.app.description}
                          </p>
                        )}
                        {item.note && (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            &ldquo;{item.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
