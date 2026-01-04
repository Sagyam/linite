'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DeleteDialog } from '@/components/admin/delete-dialog';
import { ShareDialog } from '@/components/collection/share-dialog';
import {
  Heart,
  Share2,
  Lock,
  Globe,
  Star,
  Package,
  Eye,
  Loader2,
  ArrowLeft,
  Edit,
  Files,
  Trash2,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSelectionStore } from '@/stores/selection-store';
import type { CollectionWithRelations } from '@/types/entities';
import {AppIcon} from "@/components/ui/app-icon";

async function fetchCollection(slug: string): Promise<CollectionWithRelations> {
  const response = await fetch(`/api/collections/by-slug/${slug}`);
  if (!response.ok) throw new Error('Collection not found');
  return response.json();
}

async function generateShareLink(collectionId: string): Promise<string> {
  const response = await fetch(`/api/user/collections/${collectionId}/share`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate share link');
  const data = await response.json();
  return data.shareUrl;
}

async function toggleLike(collectionId: string): Promise<{ liked: boolean }> {
  const response = await fetch(`/api/user/collections/${collectionId}/like`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to toggle like');
  return response.json();
}

async function cloneCollection(collectionId: string): Promise<CollectionWithRelations> {
  const response = await fetch(`/api/user/collections/${collectionId}/clone`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to clone collection');
  return response.json();
}

async function deleteCollection(collectionId: string): Promise<void> {
  const response = await fetch(`/api/user/collections/${collectionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete collection');
}

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { setApps } = useSelectionStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collection', slug],
    queryFn: () => fetchCollection(slug),
  });

  const shareMutation = useMutation({
    mutationFn: () => generateShareLink(collection!.id),
    onSuccess: (url) => {
      setShareUrl(url);
      setShareDialogOpen(true);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate share link',
        variant: 'destructive',
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: () => toggleLike(collection!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', slug] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: () => cloneCollection(collection!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['user-collections'] });

      toast({
        title: 'Collection cloned!',
        description: 'The collection has been added to your dashboard',
      });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCollection(collection!.id),
    onSuccess: async () => {
      setDeleteDialogOpen(false);

      // Invalidate all collection-related queries
      await queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      await queryClient.invalidateQueries({ queryKey: ['collection'] });
      await queryClient.invalidateQueries({ queryKey: ['public-collections'] });

      toast({
        title: 'Collection deleted',
        description: 'Your collection has been permanently deleted',
      });
      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleApplyCollection = () => {
    if (!collection) return;
    const appIds = collection.items.map((item) => item.appId);
    setApps(appIds);
    toast({
      title: 'Collection applied!',
      description: `${appIds.length} apps selected. Choose your distro to generate install command.`,
    });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Collection not found</h1>
          <Button asChild>
            <Link href="/collections">Browse Collections</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = session?.user?.id === collection.userId;
  const appCount = collection.items?.length || 0;
  const likeCount = collection._count?.likes || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-6xl flex-1">
        {/* Back Button */}
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link href="/collections">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collections
          </Link>
        </Button>

        {/* Header */}
        <div className="space-y-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold">{collection.name}</h1>
                {collection.iconUrl && (
                  <Image
                    src={collection.iconUrl}
                    alt={collection.name}
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

          {/* Stats and Actions */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
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

            <div className="flex-1" />

            <div className="flex flex-wrap items-center gap-2">
              {/* Primary action - Apply Collection */}
              <Button
                size="sm"
                onClick={handleApplyCollection}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Apply Collection
              </Button>

              {/* Like button for non-owners */}
              {session && !isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => likeMutation.mutate()}
                  disabled={likeMutation.isPending}
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
                    <Link href={`/dashboard/collections/${collection.id}/edit`} className="gap-2">
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareMutation.mutate()}
                    disabled={shareMutation.isPending}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={deleteMutation.isPending}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </>
              )}

              {/* Clone button for non-owners */}
              {session && !isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cloneMutation.mutate()}
                  disabled={cloneMutation.isPending}
                  className="gap-2"
                >
                  <Files className="w-4 h-4" />
                  Clone
                </Button>
              )}
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

                      <AppIcon
                        iconUrl={item.app.iconUrl}
                        displayName={item.app.displayName}
                        size="lg"
                        rounded="lg"
                        className="w-16 h-16"
                    />

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
      <Footer />

      {/* Dialogs */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityName="Collection"
        itemName={collection?.name}
        onConfirm={handleDelete}
        description="Are you sure you want to delete this collection? This action cannot be undone and all collection data will be permanently removed."
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        shareUrl={shareUrl}
      />
    </div>
  );
}
