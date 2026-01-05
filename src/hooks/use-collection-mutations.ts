'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import type { CollectionWithRelations } from '@/types/entities';

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

interface UseCollectionMutationsOptions {
  collectionId: string;
  slug: string;
  onShareSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
}

export function useCollectionMutations({
  collectionId,
  slug,
  onShareSuccess,
  onDeleteSuccess,
}: UseCollectionMutationsOptions) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const shareMutation = useMutation({
    mutationFn: () => generateShareLink(collectionId),
    onSuccess: (url) => {
      onShareSuccess?.(url);
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
    mutationFn: () => toggleLike(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection', slug] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: () => cloneCollection(collectionId),
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
    mutationFn: () => deleteCollection(collectionId),
    onSuccess: async () => {
      // Invalidate all collection-related queries
      await queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      await queryClient.invalidateQueries({ queryKey: ['collection'] });
      await queryClient.invalidateQueries({ queryKey: ['public-collections'] });

      toast({
        title: 'Collection deleted',
        description: 'Your collection has been permanently deleted',
      });

      onDeleteSuccess?.();
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

  return {
    shareMutation,
    likeMutation,
    cloneMutation,
    deleteMutation,
  };
}
