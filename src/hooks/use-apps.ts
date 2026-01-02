'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import type { AppWithRelations } from '@/types';

interface UseAppsOptions {
  category?: string;
  popular?: boolean;
  search?: string;
}

async function fetchApps(options: UseAppsOptions = {}): Promise<AppWithRelations[]> {
  const params = new URLSearchParams();
  if (options.category) params.set('category', options.category);
  if (options.popular) params.set('popular', 'true');
  if (options.search) params.set('search', options.search);

  const response = await fetch(`/api/apps?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch apps');
  }

  return response.json();
}

export function useApps(options: UseAppsOptions = {}) {
  const { data } = useSuspenseQuery({
    queryKey: ['apps', options],
    queryFn: () => fetchApps(options),
  });

  return {
    apps: data,
  };
}

// Re-export type for convenience
export type { AppWithRelations as App };
