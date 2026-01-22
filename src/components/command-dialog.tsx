'use client';

import { useEffect, useState } from 'react';
import { Terminal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { useCommand } from '@/hooks/use-command';
import { useUninstallCommand } from '@/hooks/use-uninstall-command';
import { CommandOutputSkeleton } from '@/components/ui/loading-skeletons';
import { useSelectionStore } from '@/stores/selection-store';
import { useClipboard, useMultiClipboard } from '@/hooks/use-clipboard';
import { toast } from 'sonner';
import { CommandHeader } from './command-output/command-header';
import { SetupCommands } from './command-output/setup-commands';
import { InstallCommands } from './command-output/install-commands';
import { CommandWarnings } from './command-output/command-warnings';
import { UninstallCommands } from './command-output/uninstall-commands';
import { CleanupCommands } from './command-output/cleanup-commands';
import { ManualUninstallSteps } from './command-output/manual-uninstall-steps';
import {
  generateLinuxInstallScript,
  generateWindowsInstallScript,
  generateLinuxUninstallScript,
  generateWindowsUninstallScript,
  downloadScript,
} from '@/lib/script-generator';

interface CommandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandDialog({ open, onOpenChange }: CommandDialogProps) {
  const [activeTab, setActiveTab] = useState<'install' | 'uninstall'>('install');
  const [includeDependencyCleanup, setIncludeDependencyCleanup] = useState(false);
  const [includeSetupCleanup, setIncludeSetupCleanup] = useState(false);

  const mode = useSelectionStore((state) => state.mode);

  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  const selectedApps = useSelectionStore((state) => state.selectedApps);
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);
  const sourcePreference = useSelectionStore((state) => state.sourcePreference);

  const { generate: generateInstall, loading: installLoading, error: installError, result: installResult } = useCommand();
  const { generate: generateUninstall, loading: uninstallLoading, error: uninstallError, result: uninstallResult } = useUninstallCommand();

  const loading = activeTab === 'install' ? installLoading : uninstallLoading;
  const error = activeTab === 'install' ? installError : uninstallError;
  const result = activeTab === 'install' ? installResult : uninstallResult;

  const { copied: copiedAll, copy: copyAll } = useClipboard();
  const { copied: copiedSetup, copy: copySetup } = useClipboard({
    successMessage: 'Setup commands copied!',
  });
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
    if (open && selectedApps.size > 0 && selectedDistro) {
      if (activeTab === 'install') {
        generateInstall();
      } else {
        generateUninstall(includeDependencyCleanup, includeSetupCleanup);
      }
    }
  }, [open, activeTab, includeDependencyCleanup, includeSetupCleanup, selectedApps.size, selectedDistro]);

  const handleCopyAll = async () => {
    if (!result) return;

    if (activeTab === 'install' && installResult) {
      const fullCommand = [
        ...(installResult.setupCommands || []),
        ...installResult.commands,
      ].join('\n\n');
      await copyAll(fullCommand);
    } else if (activeTab === 'uninstall' && uninstallResult) {
      const fullCommand = [
        ...(uninstallResult.cleanupCommands || []),
        ...uninstallResult.commands,
        ...(uninstallResult.dependencyCleanupCommands || []),
      ].join('\n\n');
      await copyAll(fullCommand);
    }
  };

  const handleCopySetup = async () => {
    if (!installResult?.setupCommands) return;
    await copySetup(installResult.setupCommands.join('\n\n'));
  };

  const handleCopyCommand = async (index: number) => {
    if (!installResult && !uninstallResult) return;
    const commands = activeTab === 'install' ? installResult?.commands : uninstallResult?.commands;
    if (!commands) return;
    await copyCommand(commands[index], index);
  };

  const handleDownload = () => {
    if (!installResult || !selectedDistro) return;

    const isWindows = selectedDistro === 'windows';
    const script = isWindows
      ? generateWindowsInstallScript(installResult)
      : generateLinuxInstallScript(selectedDistro, installResult);

    downloadScript(script.content, script.filename);
    toast.success('Script downloaded!');
  };

  const handleDownloadUninstall = () => {
    if (!uninstallResult || !selectedDistro) return;

    const isWindows = selectedDistro === 'windows';
    const script = isWindows
      ? generateWindowsUninstallScript(uninstallResult)
      : generateLinuxUninstallScript(selectedDistro, uninstallResult);

    downloadScript(script.content, script.filename);
    toast.success('Uninstall script downloaded!');
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle className="sr-only">Command Dialog</DialogTitle>
           <DialogDescription>
             Copy and run this command in your terminal
           </DialogDescription>
         </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'install' | 'uninstall')} className="w-full">
            <TabsList className="w-full grid grid-cols-2 overflow-hidden">
             <TabsTrigger value="install">Install</TabsTrigger>
             <TabsTrigger value="uninstall">Uninstall</TabsTrigger>
           </TabsList>

           <TabsContent value="install" className="space-y-4 mt-4 h-min data-[state=inactive]:hidden" forceMount>
                {loading && activeTab === 'install' && <CommandOutputSkeleton />}

              {error && !loading && activeTab === 'install' && (
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

              {installResult && !loading && activeTab === 'install' && (
                <div className="space-y-4">
                  <CommandHeader
                    appCount={selectedApps.size}
                    sourcePreference={sourcePreference}
                    copied={copiedAll}
                    onCopy={handleCopyAll}
                    onDownload={handleDownload}
                  />

                  <SetupCommands
                    commands={installResult.setupCommands || []}
                    copied={copiedSetup}
                    onCopy={handleCopySetup}
                  />

                  <InstallCommands
                    commands={installResult.commands}
                    breakdown={installResult.breakdown}
                    copiedItems={copiedCommands}
                    onCopyCommand={handleCopyCommand}
                  />

                  <CommandWarnings warnings={installResult.warnings || []} />
                </div>
              )}
            </TabsContent>

           <TabsContent value="uninstall" className="space-y-4 mt-4 min-h-[400px] data-[state=inactive]:hidden" forceMount>
                 {loading && activeTab === 'uninstall' && <CommandOutputSkeleton />}

               {error && !loading && activeTab === 'uninstall' && (
                 <div className="text-center text-muted-foreground py-12">
                   <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
                   <p className="font-medium">Unable to generate uninstall commands</p>
                   <p className="text-sm mt-1">
                     Some packages may not have uninstall support. Try selecting different apps.
                   </p>
                 </div>
               )}

               {uninstallResult && !loading && activeTab === 'uninstall' && (
               <div className="space-y-4">
                 <CommandHeader
                   title="Uninstall Commands"
                   appCount={selectedApps.size}
                   sourcePreference={sourcePreference}
                   copied={copiedAll}
                   onCopy={handleCopyAll}
                   onDownload={handleDownloadUninstall}
                 />

                 <div className="space-y-4">
                   <CleanupCommands
                     commands={uninstallResult.cleanupCommands || []}
                     label="Setup Cleanup"
                     description="These commands remove repositories, remotes, and other setup artifacts. Use with caution as they may affect other packages."
                     copied={copiedCleanup}
                     onCopy={() => copyCleanup(uninstallResult.cleanupCommands?.join('\n\n') || '')}
                   />

                   <UninstallCommands
                     commands={uninstallResult.commands}
                     breakdown={uninstallResult.breakdown}
                     copiedItems={copiedCommands}
                     onCopyCommand={handleCopyCommand}
                   />

                   <CleanupCommands
                     commands={uninstallResult.dependencyCleanupCommands || []}
                     label="Dependency Cleanup"
                     description="⚠️ This will remove unused dependencies. Only use if you installed these packages via Linite."
                     copied={copiedDepCleanup}
                     onCopy={() => copyDepCleanup(uninstallResult.dependencyCleanupCommands?.join('\n\n') || '')}
                   />

                   <ManualUninstallSteps steps={uninstallResult.manualSteps || []} />

                    <CommandWarnings warnings={uninstallResult.warnings || []} />
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
       </DialogContent>
     </Dialog>
  );
}
