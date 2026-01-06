'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { PAGINATION } from '@/lib/constants';
import { queryKeys } from '@/lib/query-keys';
import type { AppWithRelations } from '@/types';

export interface AppsQueryParams {
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

interface InitialData {
  pages: AppsResponse[];
  pageParams: number[];
}

export function useApps(params: AppsQueryParams = {}, initialData?: InitialData) {
  return useInfiniteQuery({
    queryKey: queryKeys.apps.list(params),
    queryFn: async ({ pageParam = 0 }) => {
      const searchParams = new URLSearchParams({
        offset: pageParam.toString(),
        limit: PAGINATION.DEFAULT_LIMIT.toString(),
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
    initialData,
  });
}

// Re-export type for convenience
export type { AppWithRelations as App };
