'use client';

import { useQuery } from '@tanstack/react-query';

export interface App {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  iconUrl: string | null;
  homepage: string | null;
  isPopular: boolean;
  isFoss: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  packages: Array<{
    id: string;
    sourceId: string;
    identifier: string;
    version: string | null;
    isAvailable?: boolean;
    source: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

interface UseAppsOptions {
  category?: string;
  popular?: boolean;
  search?: string;
}

async function fetchApps(options: UseAppsOptions = {}): Promise<App[]> {
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
  const { data, isLoading, error } = useQuery({
    queryKey: ['apps', options],
    queryFn: () => fetchApps(options),
  });

  return {
    apps: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
