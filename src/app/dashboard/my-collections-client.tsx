'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus, Package, Loader2 } from 'lucide-react';
import { CollectionCard } from '@/components/collection/collection-card';
import type { CollectionWithRelations } from '@/types/entities';

async function fetchUserCollections(): Promise<CollectionWithRelations[]> {
  const response = await fetch('/api/user/collections?limit=100');

  if (!response.ok) {
    throw new Error('Failed to fetch collections');
  }

  const data = await response.json();
  return data.collections || [];
}

export function MyCollectionsClient() {
  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['user-collections'],
    queryFn: fetchUserCollections,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-red-500 mb-4">Failed to load collections</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!collections || collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Package className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">No collections yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Create your first collection to organize and share your favorite Linux apps
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard/collections/new">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Collection
          </Link>
        </Button>
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4">Or explore community collections</p>
          <Button asChild variant="outline">
            <Link href="/collections">Browse Collections</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            showAuthor={false}
          />
        ))}
      </div>

      <div className="flex justify-center pt-8">
        <p className="text-sm text-muted-foreground">
          {collections.length} {collections.length === 1 ? 'collection' : 'collections'}
        </p>
      </div>
    </>
  );
}
