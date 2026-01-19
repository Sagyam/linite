'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

export interface Distro {
  id: string;
  name: string;
  slug: string;
  family: string;
  iconUrl: string | null;
  basedOn: string | null;
  isPopular: boolean;
  themeColorLight: string | null;
  themeColorDark: string | null;
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
  const { data } = useSuspenseQuery({
    queryKey: ['distros'],
    queryFn: fetchDistros,
  });

  return {
    distros: data,
  };
}
