'use client';

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

export function FloatingActionBar({
  distros,
  onViewSelection,
  onGenerateCommand,
}: FloatingActionBarProps) {
  const { selectedApps, selectedDistro } = useSelectionStore();

  // Don't show if no apps selected
  if (selectedApps.size === 0) {
    return null;
  }

  const canGenerate = selectedApps.size > 0 && selectedDistro;
  const selectedDistroObj = distros.find((d) => d.slug === selectedDistro);
  const distroName = selectedDistroObj?.name || 'Select distribution';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Selection info */}
          <button
            onClick={onViewSelection}
            className="flex items-center gap-3 hover:bg-muted/50 px-3 py-2 rounded-lg transition-colors"
          >
            <div className="relative">
              <Package2 className="w-6 h-6" />
              <Badge
                variant="default"
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {selectedApps.size}
              </Badge>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">
                {selectedApps.size} {selectedApps.size === 1 ? 'app' : 'apps'}{' '}
                selected
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                {selectedDistro ? (
                  <>
                    <Settings2 className="w-3 h-3" />
                    {distroName}
                  </>
                ) : (
                  <>
                    View details <ChevronUp className="w-3 h-3" />
                  </>
                )}
              </p>
            </div>
          </button>

          {/* Center/Right: Warning or Action */}
          {!selectedDistro ? (
            /* Show prominent warning when no distro selected */
            <div className="flex items-center gap-3 flex-1 sm:flex-initial">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 border border-destructive/20 flex-1 sm:flex-initial">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-destructive">
                    Select your distribution
                  </p>
                  <p className="text-xs text-destructive/80 hidden sm:block">
                    Choose your OS in the bar above to continue
                  </p>
                </div>
                <Monitor className="w-5 h-5 text-destructive/60 hidden sm:block animate-pulse" />
              </div>
            </div>
          ) : (
            /* Show Generate button when distro is selected */
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">
                  Ready to install
                </span>
              </div>
              <Button
                size="lg"
                onClick={onGenerateCommand}
                disabled={!canGenerate}
                className="gap-2 w-full sm:w-auto"
              >
                Generate Command
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
