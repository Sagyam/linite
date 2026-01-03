'use client';

import { useMutation } from '@tanstack/react-query';
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

interface GenerateCommandParams {
  distroSlug: string;
  appIds: string[];
  sourcePreference?: string;
  nixosInstallMethod?: 'nix-shell' | 'nix-env' | 'nix-flakes';
}

async function generateCommand(params: GenerateCommandParams): Promise<GenerateCommandResponse> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to generate commands');
  }

  return response.json();
}

export function useCommand() {
  const { getSelectedAppIds, selectedDistro, sourcePreference, nixosInstallMethod } =
    useSelectionStore();

  const mutation = useMutation({
    mutationFn: generateCommand,
  });

  const generate = () => {
    const appIds = getSelectedAppIds();

    if (appIds.length === 0) {
      mutation.reset();
      return;
    }

    if (!selectedDistro) {
      mutation.reset();
      return;
    }

    mutation.mutate({
      distroSlug: selectedDistro,
      appIds,
      sourcePreference: sourcePreference || undefined,
      nixosInstallMethod: nixosInstallMethod || undefined,
    });
  };

  const clear = () => {
    mutation.reset();
  };

  return {
    generate,
    clear,
    loading: mutation.isPending,
    error: mutation.error?.message ?? null,
    result: mutation.data ?? null,
  };
}
