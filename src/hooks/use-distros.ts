'use client';

import { useState, useEffect } from 'react';

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

export function useDistros() {
  const [distros, setDistros] = useState<Distro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDistros = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/distros');

        if (!response.ok) {
          throw new Error('Failed to fetch distributions');
        }

        const data = await response.json();
        setDistros(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDistros();
  }, []);

  return { distros, loading, error };
}
