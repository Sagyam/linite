'use client';

import { useQuery } from '@tanstack/react-query';

export interface Distro {
  id: string;
  name: string;
  slug: string;
  family: string;
  iconUrl: string | null;
  basedOn: string | null;
  isPopular: boolean;
  distroSources?: Array<{
    sourceId: string;
    priority: number;
    isDefault: boolean;
    source: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

async function fetchDistros(): Promise<Distro[]> {
  const response = await fetch('/api/distros');

  if (!response.ok) {
    throw new Error('Failed to fetch distributions');
  }

  return response.json();
}

export function useDistros() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['distros'],
    queryFn: fetchDistros,
  });

  return {
    distros: data ?? [],
    loading: isLoading,
    error: error?.message ?? null,
  };
}
