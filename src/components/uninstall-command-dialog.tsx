'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Terminal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CommandOutputSkeleton } from '@/components/ui/loading-skeletons';
import { useClipboard, useMultiClipboard } from '@/hooks/use-clipboard';
import { toast } from 'sonner';
import { CommandHeader } from './command-output/command-header';
import { UninstallCommands } from './command-output/uninstall-commands';
import { CleanupCommands } from './command-output/cleanup-commands';
import { ManualUninstallSteps } from './command-output/manual-uninstall-steps';
import { CommandWarnings } from './command-output/command-warnings';
import {
  generateLinuxUninstallScript,
  generateWindowsUninstallScript,
  downloadScript,
} from '@/lib/script-generator';
import type { InstallationWithRelations } from '@/types/entities';

interface UninstallCommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installations: InstallationWithRelations[];
  onComplete?: () => void;
}

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

export function UninstallCommandDialog({
  open,
  onOpenChange,
  installations,
  onComplete,
}: UninstallCommandDialogProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [includeDependencyCleanup, _setIncludeDependencyCleanup] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [includeSetupCleanup, _setIncludeSetupCleanup] = useState(false);

  // Derive data from installations
  const distroSlug = installations[0]?.distro.slug || '';
  const distroName = installations[0]?.distro.name || '';
  const appIds = Array.from(new Set(installations.map((i) => i.appId)));
  const sourcePreference = installations[0]?.package.source.slug;

  // Validate all installations use same distro
  const allSameDistro = installations.every((i) => i.distro.slug === distroSlug);

  const mutation = useMutation({
    mutationFn: generateUninstallCommand,
  });

  const { copied: copiedAll, copy: copyAll } = useClipboard();
  const { copiedItems: copiedCommands, copy: copyCommand } = useMultiClipboard({
    successMessage: 'Command copied!',
  });
  const { copied: copiedCleanup, copy: copyCleanup } = useClipboard({
    successMessage: 'Cleanup commands copied!',
  });
  const { copied: copiedDepCleanup, copy: copyDepCleanup } = useClipboard({
    successMessage: 'Dependency cleanup commands copied!',
  });

  useEffect(() => {
    if (open && installations.length > 0 && allSameDistro) {
      mutation.mutate({
        distroSlug,
        appIds,
        sourcePreference,
        includeDependencyCleanup,
        includeSetupCleanup,
      });
    }
  }, [open, includeDependencyCleanup, includeSetupCleanup, installations.length, allSameDistro, distroSlug, appIds, sourcePreference, mutation]);

  const handleCopyAll = async () => {
    if (!mutation.data) return;

    const fullCommand = [
      ...(mutation.data.cleanupCommands || []),
      ...mutation.data.commands,
      ...(mutation.data.dependencyCleanupCommands || []),
    ].join('\n\n');

    await copyAll(fullCommand);
  };

  const handleCopyCommand = async (index: number) => {
    if (!mutation.data?.commands) return;
    await copyCommand(mutation.data.commands[index], index);
  };

  const handleDownload = () => {
    if (!mutation.data || !distroSlug) return;

    const isWindows = distroSlug === 'windows';
    const script = isWindows
      ? generateWindowsUninstallScript(mutation.data)
      : generateLinuxUninstallScript(distroSlug, mutation.data);

    downloadScript(script.content, script.filename);
    toast.success('Uninstall script downloaded!');
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open && onComplete) {
      onComplete();
    }
  };

  if (!allSameDistro) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cannot Generate Uninstall Commands</DialogTitle>
            <DialogDescription>
              All selected installations must be from the same distribution.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center text-muted-foreground py-12">
            <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Mixed distributions detected</p>
            <p className="text-sm mt-1">
              Please select installations from a single distribution to generate uninstall commands.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Uninstall Commands</DialogTitle>
          <DialogDescription>
            Copy and run these commands to uninstall the selected applications from {distroName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4 min-h-[400px]">
          {mutation.isPending && <CommandOutputSkeleton />}

          {mutation.error && !mutation.isPending && (
            <div className="text-center text-muted-foreground py-12">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Unable to generate uninstall commands</p>
              <p className="text-sm mt-1">
                {mutation.error instanceof Error ? mutation.error.message : 'An error occurred'}
              </p>
            </div>
          )}

          {mutation.data && !mutation.isPending && (
            <div className="space-y-4">
              <CommandHeader
                title="Uninstall Commands"
                appCount={installations.length}
                sourcePreference={sourcePreference || null}
                copied={copiedAll}
                onCopy={handleCopyAll}
                onDownload={handleDownload}
              />

              <div className="space-y-4">
                <CleanupCommands
                  commands={mutation.data.cleanupCommands || []}
                  label="Setup Cleanup"
                  description="These commands remove repositories, remotes, and other setup artifacts. Use with caution as they may affect other packages."
                  copied={copiedCleanup}
                  onCopy={() => copyCleanup(mutation.data.cleanupCommands?.join('\n\n') || '')}
                />

                <UninstallCommands
                  commands={mutation.data.commands}
                  breakdown={mutation.data.breakdown}
                  copiedItems={copiedCommands}
                  onCopyCommand={handleCopyCommand}
                />

                <CleanupCommands
                  commands={mutation.data.dependencyCleanupCommands || []}
                  label="Dependency Cleanup"
                  description="⚠️ This will remove unused dependencies. Only use if you installed these packages via Linite."
                  copied={copiedDepCleanup}
                  onCopy={() => copyDepCleanup(mutation.data.dependencyCleanupCommands?.join('\n\n') || '')}
                />

                <ManualUninstallSteps steps={mutation.data.manualSteps || []} />

                <CommandWarnings warnings={mutation.data.warnings || []} />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
