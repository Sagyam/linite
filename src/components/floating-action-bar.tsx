'use client';

import { useMemo, memo } from 'react';
import {
  Package2,
  ArrowRight,
  ChevronUp,
  Settings2,
  AlertCircle,
  Monitor,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelectionStore } from '@/stores/selection-store';
import type { Distro } from '@/hooks/use-distros';

interface FloatingActionBarProps {
  distros: Distro[];
  onViewSelection: () => void;
  onGenerateCommand: () => void;
}

export const FloatingActionBar = memo(function FloatingActionBar({
  distros,
  onViewSelection,
  onGenerateCommand,
}: FloatingActionBarProps) {
  // Optimize: Use selectors to subscribe only to needed state
  const selectedAppsSize = useSelectionStore((state) => state.selectedApps.size);
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);

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
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 shadow-lg">
      <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          {/* Left: Selection info */}
          <button
            onClick={onViewSelection}
            className="flex items-center gap-2 sm:gap-3 hover:bg-muted/50 px-2 py-2 sm:px-3 rounded-lg transition-colors min-w-0"
          >
            <div className="relative shrink-0">
              <Package2 className="w-5 h-5 sm:w-6 sm:h-6" />
              <Badge
                variant="default"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {selectedAppsSize}
              </Badge>
            </div>
            <div className="text-left min-w-0 flex-1">
              <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                {selectedAppsSize} {selectedAppsSize === 1 ? 'app' : 'apps'}{' '}
                selected
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-muted border border-border rounded">
                  b
                </kbd>
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

          {/* Center/Right: Warning or Action */}
          {!selectedDistro ? (
            /* Show prominent warning when no distro selected */
            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial min-w-0">
              <div className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg bg-destructive/10 border border-destructive/20 flex-1 sm:flex-initial min-w-0">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-destructive truncate">
                    Select your distribution
                  </p>
                  <p className="text-xs text-destructive/80 hidden sm:block">
                    Choose your OS in the bar above to continue
                  </p>
                </div>
                <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-destructive/60 hidden sm:block animate-pulse shrink-0" />
              </div>
            </div>
          ) : (
            /* Show Generate button when distro is selected */
            <div className="flex items-center gap-2 min-w-0">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary whitespace-nowrap">
                  Ready to install
                </span>
              </div>
              <Button
                size="lg"
                onClick={onGenerateCommand}
                disabled={!canGenerate}
                className="gap-2 w-full sm:w-auto text-sm sm:text-base shrink-0"
              >
                <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-semibold bg-primary-foreground text-primary border border-primary/20 rounded">
                  c
                </kbd>
                <span className="hidden xs:inline">Generate Command</span>
                <span className="xs:hidden">Generate</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
