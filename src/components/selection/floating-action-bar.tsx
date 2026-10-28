'use client';

import { useMemo, memo } from 'react';
import {
  Package2,
  ArrowRight,
  ChevronUp,
  Settings2,
  AlertCircle,
  Monitor,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelectionStore } from '@/stores/selection-store';
import type { Distro } from '@/hooks/use-distros';

interface FloatingActionBarProps {
  distros: Distro[];
  onViewSelection: () => void;
  onGenerateCommand: () => void;
  onSaveInstallation?: () => void;
  isAuthenticated?: boolean;
}

export const FloatingActionBar = memo(function FloatingActionBar({
  distros,
  onViewSelection,
  onGenerateCommand,
  onSaveInstallation,
  isAuthenticated = false,
}: FloatingActionBarProps) {
  // Optimize: Use selectors to subscribe only to needed state
  const selectedAppsSize = useSelectionStore((state) => state.selectedApps.size);
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);
  const mode = useSelectionStore((state) => state.mode);

  // Memoize: Cache expensive find operation (must be before early return)
  const selectedDistroObj = useMemo(
    () => distros.find((d) => d.slug === selectedDistro),
    [distros, selectedDistro]
  );

  // Don't show if no apps selected
  if (selectedAppsSize === 0) {
    return null;
  }

  const distroName = selectedDistroObj?.name || 'Select distribution';
  const canGenerate = selectedAppsSize > 0 && selectedDistro;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-50 px-3 sm:bottom-5 sm:px-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl border border-edge/10 bg-background/85 p-2 shadow-2xl shadow-black/15 ring-1 ring-edge/5 backdrop-blur-md dark:shadow-black/50 sm:p-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          {/* Left: Selection info */}
          <button
            onClick={onViewSelection}
            className="flex items-center gap-3.5 hover:bg-edge/5 px-2.5 py-1.5 rounded-lg transition-colors min-w-0"
          >
            <div className="relative shrink-0">
              <Package2 className="size-5 text-muted-foreground" />
              <Badge
                variant="default"
                className="absolute -top-2 -right-2.5 h-5 min-w-5 px-1 font-mono"
              >
                {selectedAppsSize}
              </Badge>
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="font-heading text-sm font-semibold truncate flex items-center gap-1.5">
                {selectedAppsSize} {selectedAppsSize === 1 ? 'app' : 'apps'}{' '}
                selected
                <kbd className="kbd hidden sm:inline-flex">b</kbd>
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                {selectedDistro ? (
                  <>
                    <Settings2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{distroName}</span>
                  </>
                ) : (
                  <>
                    View details <ChevronUp className="w-3 h-3 shrink-0" />
                  </>
                )}
              </p>
            </div>
          </button>


          {/* Right: Warning or Action */}
          {!selectedDistro ? (
            /* Show prominent warning when no distro selected */
            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial min-w-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber/10 border border-amber/25 flex-1 sm:flex-initial min-w-0">
                <AlertCircle className="size-4 text-amber shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                    Choose your distribution
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    In the bar above, or press <kbd className="kbd">d</kbd>
                  </p>
                </div>
                <Monitor className="size-4 text-amber/70 hidden sm:block shrink-0" />
              </div>
            </div>
          ) : (
            /* Show Generate and Save buttons when distro is selected */
            <div className="flex items-center gap-2 min-w-0">
              {isAuthenticated && onSaveInstallation && (
                <Button
                  size="lg"
                  onClick={onSaveInstallation}
                  disabled={!canGenerate}
                  variant="outline"
                  className="shrink-0"
                >
                  <kbd className="kbd hidden sm:inline-flex">s</kbd>
                  <Save className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Save</span>
                </Button>
              )}
              <Button
                size="lg"
                onClick={onGenerateCommand}
                disabled={!canGenerate}
                className="w-full sm:w-auto shrink-0"
              >
                <kbd className="kbd hidden sm:inline-flex border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground">c</kbd>
                <span className="hidden xs:inline">Get Commands</span>
                <span className="xs:hidden">Get</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
