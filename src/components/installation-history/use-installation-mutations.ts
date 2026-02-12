/**
 * Custom hook for managing installation mutations (delete, bulk delete)
 *
 * Extracted from installation-history-table.tsx to reduce complexity
 * Consolidates mutation logic and error handling
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface UseInstallationMutationsReturn {
  deleteMutation: ReturnType<typeof useMutation<void, Error, string>>;
  bulkDeleteMutation: ReturnType<typeof useMutation<{ deletedCount: number }, Error, string[]>>;
}

/**
 * Hook to manage installation mutations (delete, bulk delete)
 */
export function useInstallationMutations(): UseInstallationMutationsReturn {
  const queryClient = useQueryClient();

  /**
   * Delete single installation
   */
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/installations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete installation');
      }
    },
    onSuccess: () => {
      toast.success('Installation deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  /**
   * Delete multiple installations
   */
  const bulkDeleteMutation = useMutation({
    mutationFn: async (installationIds: string[]) => {
      const response = await fetch('/api/installations/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installationIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete installations');
      }

      return response.json();
    },
    onSuccess: (data, installationIds) => {
      const count = data.deletedCount || installationIds.length;
      toast.success(`${count} installation${count !== 1 ? 's' : ''} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      queryClient.invalidateQueries({ queryKey: ['user-devices'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      // Keep selection intact on error
    },
  });

  return {
    deleteMutation,
    bulkDeleteMutation,
  };
}
