'use client';

import { useMutation } from '@tanstack/react-query';
import { useSelectionStore } from '@/stores/selection-store';

interface GenerateUninstallCommandResponse {
  commands: string[];
  cleanupCommands: string[];
  dependencyCleanupCommands: string[];
  warnings: string[];
  breakdown: Array<{
    source: string;
    packages: string[];
  }>;
  manualSteps: Array<{
    appName: string;
    instructions: string;
  }>;
}

interface GenerateUninstallCommandParams {
  distroSlug: string;
  appIds: string[];
  sourcePreference?: string;
  nixosInstallMethod?: 'nix-shell' | 'nix-env' | 'nix-flakes';
  includeDependencyCleanup?: boolean;
  includeSetupCleanup?: boolean;
}

async function generateUninstallCommand(
  params: GenerateUninstallCommandParams
): Promise<GenerateUninstallCommandResponse> {
  const response = await fetch('/api/uninstall', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to generate uninstall commands');
  }

  return response.json();
}

export function useUninstallCommand() {
  const { getSelectedAppIds, selectedDistro, sourcePreference, nixosInstallMethod } =
    useSelectionStore();

  const mutation = useMutation({
    mutationFn: generateUninstallCommand,
  });

  const generate = (includeDependencyCleanup = false, includeSetupCleanup = false) => {
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
      includeDependencyCleanup,
      includeSetupCleanup,
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
