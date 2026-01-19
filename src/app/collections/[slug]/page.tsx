'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { DeleteDialog } from '@/components/admin/delete-dialog';
import { ShareDialog } from '@/components/collection/share-dialog';
import { CollectionHeader } from '@/components/collection/collection-header';
import { CollectionStats } from '@/components/collection/collection-stats';
import { CollectionActions } from '@/components/collection/collection-actions';
import { useCollectionMutations } from '@/hooks/use-collection-mutations';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useSelectionStore } from '@/stores/selection-store';
import type { CollectionWithRelations } from '@/types/entities';
import { AppIcon } from "@/components/ui/app-icon";

async function fetchCollection(slug: string): Promise<CollectionWithRelations> {
  const response = await fetch(`/api/collections/by-slug/${slug}`);
  if (!response.ok) throw new Error('Collection not found');
  return response.json();
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
  const { setApps } = useSelectionStore();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const { data: collection, isLoading } = useQuery({
    queryKey: ['collection', slug],
    queryFn: () => fetchCollection(slug),
  });

  const {
    shareMutation,
    deleteMutation,
  } = useCollectionMutations({
    collectionId: collection?.id || '',
    onShareSuccess: (url) => {
      setShareUrl(url);
      setShareDialogOpen(true);
    },
    onDeleteSuccess: () => {
      setDeleteDialogOpen(false);
    },
  });

  const handleApplyCollection = () => {
    if (!collection) return;
    const appIds = collection.items.map((item) => item.appId);
    const categories = new Map(collection.items.map((item) => [item.appId, item.app.categoryId]));
    setApps(appIds, categories);
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
        <CollectionHeader
          name={collection.name}
          iconUrl={collection.iconUrl}
          description={collection.description}
          isFeatured={collection.isFeatured}
          isTemplate={collection.isTemplate}
          isPublic={collection.isPublic}
          tags={collection.tags}
          user={collection.user}
        />

        {/* Stats and Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <CollectionStats
            appCount={appCount}
            viewCount={collection.viewCount || 0}
            likeCount={likeCount}
          />

          <div className="flex-1" />

          <CollectionActions
            collectionId={collection.id}
            isOwner={isOwner}
            onApply={handleApplyCollection}
            onShare={() => shareMutation.mutate()}
            onDelete={() => setDeleteDialogOpen(true)}
            isSharePending={shareMutation.isPending}
            isDeletePending={deleteMutation.isPending}
          />
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
        onConfirm={() => deleteMutation.mutate()}
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
