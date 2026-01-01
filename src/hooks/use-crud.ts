'use client';

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface CrudHooks<T> {
  useList: () => UseQueryResult<T[], Error>;
  useDelete: () => UseMutationResult<void, Error, string>;
}

export interface CrudConfig {
  entityName: string;
  pluralName: string;
  endpoint: string;
  queryKey: string;
}

/**
 * Factory function to create standardized CRUD hooks for admin entities
 * @param config - Configuration for the entity (name, endpoint, etc.)
 * @returns Object with useList and useDelete hooks
 */
export function createCrudHooks<T>(config: CrudConfig): CrudHooks<T> {
  const { entityName, pluralName, endpoint, queryKey } = config;

  function useList(): UseQueryResult<T[], Error> {
    return useQuery({
      queryKey: ['admin', queryKey],
      queryFn: async () => {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${pluralName}`);
        }
        return await response.json() as Promise<T[]>;
      },
    });
  }

  function useDelete(): UseMutationResult<void, Error, string> {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`${endpoint}/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to delete ${entityName}`);
        }

        return response.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', queryKey] });
        // Also invalidate public queries if they exist
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(`${entityName} deleted successfully`);
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to delete ${entityName}`);
      },
    });
  }

  return {
    useList,
    useDelete,
  };
}
