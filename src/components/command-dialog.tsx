'use client';

import { useEffect } from 'react';
import { Terminal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCommand } from '@/hooks/use-command';
import { CommandOutputSkeleton } from '@/components/ui/loading-skeletons';
import { useSelectionStore } from '@/stores/selection-store';
import { useClipboard, useMultiClipboard } from '@/hooks/use-clipboard';
import { toast } from 'sonner';
import { CommandHeader } from './command-output/command-header';
import { SetupCommands } from './command-output/setup-commands';
import { InstallCommands } from './command-output/install-commands';
import { CommandWarnings } from './command-output/command-warnings';

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandDialog({ open, onOpenChange }: CommandDialogProps) {
  const { selectedApps, selectedDistro, sourcePreference } = useSelectionStore();
  const { generate, loading, error, result } = useCommand();

  // Clipboard hooks
  const { copied: copiedAll, copy: copyAll } = useClipboard();
  const { copied: copiedSetup, copy: copySetup } = useClipboard({
    successMessage: 'Setup commands copied!',
  });
  const { copiedItems: copiedCommands, copy: copyCommand } = useMultiClipboard({
    successMessage: 'Command copied!',
  });

  // Generate command when dialog opens
  useEffect(() => {
    if (open && selectedApps.size > 0 && selectedDistro) {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCopyAll = async () => {
    if (!result) return;

    const fullCommand = [
      ...(result.setupCommands || []),
      ...result.commands,
    ].join('\n\n');

    await copyAll(fullCommand);
  };

  const handleCopySetup = async () => {
    if (!result?.setupCommands) return;
    await copySetup(result.setupCommands.join('\n\n'));
  };

  const handleCopyCommand = async (index: number) => {
    if (!result) return;
    await copyCommand(result.commands[index], index);
  };

  const handleDownload = () => {
    if (!result) return;

    const fullCommand = [
      '#!/bin/bash',
      '',
      '# Display colorful banner',
      'echo -e "\\033[1;36m┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[0m                                                                 \\033[1;36m┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;35m  ██╗     ██╗███╗   ██╗██╗████████╗███████╗\\033[1;36m                     ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;35m  ██║     ██║████╗  ██║██║╚══██╔══╝██╔════╝\\033[1;36m                     ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;35m  ██║     ██║██╔██╗ ██║██║   ██║   █████╗\\033[1;36m                       ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;35m  ██║     ██║██║╚██╗██║██║   ██║   ██╔══╝\\033[1;36m                       ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;35m  ███████╗██║██║ ╚████║██║   ██║   ███████╗\\033[1;36m                     ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;35m  ╚══════╝╚═╝╚═╝  ╚═══╝╚═╝   ╚═╝   ╚══════╝\\033[1;36m                     ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[0m                                                                 \\033[1;36m┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;33m  📦 Bulk Linux Package Installer\\033[1;36m                               ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[1;34m  🌐 https://linite.sagyamthapa.com.np\\033[1;36m                          ┃\\033[0m"',
      'echo -e "\\033[1;36m┃\\033[0m                                                                 \\033[1;36m┃\\033[0m"',
      'echo -e "\\033[1;36m┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛\\033[0m"',
      'echo',
      '',
      ...(result.setupCommands || []),
      '',
      ...result.commands,
    ].join('\n');

    const blob = new Blob([fullCommand], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'linite-install.sh';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Script downloaded!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Install Command</DialogTitle>
          <DialogDescription>
            Copy and run this command in your terminal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loading state */}
          {loading && <CommandOutputSkeleton />}

          {/* Error state */}
          {error && !loading && (
            <div className="text-center text-muted-foreground py-12">
              <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Unable to generate install command</p>
              <p className="text-sm mt-1">
                Some packages may not be available for your selected
                distribution. Try selecting different apps or changing your
                distribution.
              </p>
            </div>
          )}

          {/* Success state */}
          {result && !loading && (
            <div className="space-y-4">
              <CommandHeader
                appCount={selectedApps.size}
                sourcePreference={sourcePreference}
                copied={copiedAll}
                onCopy={handleCopyAll}
                onDownload={handleDownload}
              />

              <SetupCommands
                commands={result.setupCommands || []}
                copied={copiedSetup}
                onCopy={handleCopySetup}
              />

              <InstallCommands
                commands={result.commands}
                breakdown={result.breakdown}
                copiedItems={copiedCommands}
                onCopyCommand={handleCopyCommand}
              />

              <CommandWarnings warnings={result.warnings || []} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
