'use client';

import { useState, useEffect } from 'react';

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

export function useApps(options: UseAppsOptions = {}) {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.category) params.set('category', options.category);
        if (options.popular) params.set('popular', 'true');
        if (options.search) params.set('search', options.search);

        const response = await fetch(`/api/apps?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch apps');
        }

        const data = await response.json();
        setApps(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApps();
  }, [options.category, options.popular, options.search]);

  return { apps, loading, error };
}
