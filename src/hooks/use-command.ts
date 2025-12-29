'use client';

import { useState } from 'react';
import { useSelectionStore } from '@/stores/selection-store';

interface GenerateCommandResponse {
  commands: string[];
  setupCommands: string[];
  warnings: string[];
  breakdown: Array<{
    source: string;
    packages: string[];
  }>;
}

export function useCommand() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateCommandResponse | null>(null);

  const { getSelectedAppIds, selectedDistro, sourcePreference } = useSelectionStore();

  const generate = async () => {
    const appIds = getSelectedAppIds();

    if (appIds.length === 0) {
      setError('Please select at least one app');
      return;
    }

    if (!selectedDistro) {
      setError('Please select a distribution');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distroSlug: selectedDistro,
          appIds,
          sourcePreference: sourcePreference || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate commands');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResult(null);
    setError(null);
  };

  return {
    generate,
    clear,
    loading,
    error,
    result,
  };
}
