'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CollectionForm } from '@/components/collection/collection-form';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { CollectionWithRelations } from '@/types/entities';

async function fetchCollection(collectionId: string): Promise<CollectionWithRelations> {
  const response = await fetch(`/api/user/collections/${collectionId}`);
  if (!response.ok) throw new Error('Collection not found');
  return response.json();
}

export default function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data: collection, isLoading, error } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => fetchCollection(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Collection not found</h1>
          <p className="text-muted-foreground mb-6">
            The collection you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have permission to edit it.
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Edit Collection</h1>
        <p className="text-muted-foreground">
          Update your collection&apos;s details and manage apps
        </p>
      </div>

      <CollectionForm
        mode="edit"
        initialData={{
          id: collection.id,
          name: collection.name,
          description: collection.description || undefined,
          isPublic: collection.isPublic,
          tags: collection.tags || undefined,
          appIds: collection.items.map((item) => item.appId),
        }}
      />
    </div>
  );
}
