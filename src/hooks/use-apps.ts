'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import type { AppWithRelations } from '@/types';

interface AppsQueryParams {
  category?: string;
  popular?: boolean;
  search?: string;
}

interface AppsResponse {
  apps: AppWithRelations[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function useApps(params: AppsQueryParams = {}) {
  return useInfiniteQuery({
    queryKey: ['apps', params],
    queryFn: async ({ pageParam = 0 }) => {
      const searchParams = new URLSearchParams({
        offset: pageParam.toString(),
        limit: '20',
        ...(params.category && { category: params.category }),
        ...(params.popular && { popular: 'true' }),
        ...(params.search && { search: params.search }),
      });

      const response = await fetch(`/api/apps?${searchParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch apps');
      }

      return (await response.json()) as AppsResponse;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasMore) {
        return lastPage.pagination.offset + lastPage.pagination.limit;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
}

// Re-export type for convenience
export type { AppWithRelations as App };
