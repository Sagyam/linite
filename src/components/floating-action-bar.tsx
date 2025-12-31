'use client';

import { Package2, ArrowRight, ChevronUp, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelectionStore } from '@/stores/selection-store';
import { useDistros } from '@/hooks/use-distros';

interface FloatingActionBarProps {
  onViewSelection: () => void;
  onGenerateCommand: () => void;
}

export function FloatingActionBar({
  onViewSelection,
  onGenerateCommand,
}: FloatingActionBarProps) {
  const { selectedApps, selectedDistro } = useSelectionStore();
  const { distros } = useDistros();

  // Don't show if no apps selected
  if (selectedApps.size === 0) {
    return null;
  }

  const canGenerate = selectedApps.size > 0 && selectedDistro;
  const selectedDistroObj = distros.find((d) => d.slug === selectedDistro);
  const distroName = selectedDistroObj?.name || 'Select distribution';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
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
                    Click to configure <ChevronUp className="w-3 h-3" />
                  </>
                )}
              </p>
            </div>
          </button>

          {/* Center: Distro indicator (mobile) */}
          {!selectedDistro && (
            <div className="flex-1 flex justify-center">
              <Badge variant="outline" className="gap-1">
                <Settings2 className="w-3 h-3" />
                Choose your OS
              </Badge>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="lg"
              onClick={onGenerateCommand}
              disabled={!canGenerate}
              className="gap-2"
            >
              Generate Command
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
