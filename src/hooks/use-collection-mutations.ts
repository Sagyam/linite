'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

async function generateShareLink(collectionId: string): Promise<string> {
  const response = await fetch(`/api/user/collections/${collectionId}/share`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to generate share link');
  const data = await response.json();
  return data.shareUrl;
}

async function deleteCollection(collectionId: string): Promise<void> {
  const response = await fetch(`/api/user/collections/${collectionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete collection');
}

interface UseCollectionMutationsOptions {
  collectionId: string;
  onShareSuccess?: (url: string) => void;
  onDeleteSuccess?: () => void;
}

export function useCollectionMutations({
  collectionId,
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
    deleteMutation,
  };
}
