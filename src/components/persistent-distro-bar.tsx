'use client';

import { useEffect, useMemo, memo } from 'react';
import Image from 'next/image';
import { Monitor, HelpCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSelectionStore } from '@/stores/selection-store';
import { NixosMethodSelector } from '@/components/nixos-method-selector';
import type { Distro } from '@/hooks/use-distros';

interface PersistentDistroBarProps {
  distros: Distro[];
  distroTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  sourceTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const PersistentDistroBar = memo(function PersistentDistroBar({
  distros,
  distroTriggerRef,
  sourceTriggerRef
}: PersistentDistroBarProps) {
  // Optimize: Use selectors to subscribe only to needed state
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);
  const setDistro = useSelectionStore((state) => state.setDistro);
  const sourcePreference = useSelectionStore((state) => state.sourcePreference);
  const setSourcePreference = useSelectionStore((state) => state.setSourcePreference);
  const nixosInstallMethod = useSelectionStore((state) => state.nixosInstallMethod);
  const setNixosInstallMethod = useSelectionStore((state) => state.setNixosInstallMethod);

  // Memoize: Cache expensive find operation
  const selectedDistroObj = useMemo(
    () => distros.find((d) => d.slug === selectedDistro),
    [distros, selectedDistro]
  );

  const availableSources = useMemo(
    () => selectedDistroObj?.distroSources || [],
    [selectedDistroObj]
  );

  // Memoize: Cache Nix source lookup
  const nixSource = useMemo(
    () => availableSources.find((s) => s.source.slug === 'nix'),
    [availableSources]
  );

  const isNixSelected = useMemo(
    () => selectedDistro === 'nixos' &&
      (sourcePreference === 'nix' || (!sourcePreference && nixSource?.isDefault)),
    [selectedDistro, sourcePreference, nixSource]
  );

  // Memoize: Cache sorted distros
  const sortedDistros = useMemo(
    () => [...distros].sort((a, b) => a.name.localeCompare(b.name)),
    [distros]
  );

  // Set the default NixOS installation method when Nix is selected
  useEffect(() => {
    if (isNixSelected && !nixosInstallMethod) {
      setNixosInstallMethod('nix-shell');
    } else if (!isNixSelected && nixosInstallMethod) {
      // Clear NixOS method when switching away from Nix
      setNixosInstallMethod(null);
    }
  }, [isNixSelected, nixosInstallMethod, setNixosInstallMethod]);

  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Distro Selection - More prominent */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2 mb-1.5">
              <Monitor className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Your Distribution</span>
              {!selectedDistro && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs font-mono font-semibold bg-muted/50 border border-border/50 rounded ml-auto">
                d
              </kbd>
            </div>
            <Select value={selectedDistro || ''} onValueChange={setDistro}>
              <SelectTrigger ref={distroTriggerRef} className="h-9 bg-background">
                <SelectValue placeholder="Choose your Linux distribution" />
              </SelectTrigger>
              <SelectContent>
                {sortedDistros.map((distro) => {
                  const themeColor = distro.themeColorLight || distro.themeColorDark;
                  const isSelected = selectedDistro === distro.slug;

                  return (
                    <SelectItem
                      key={distro.id}
                      value={distro.slug}
                      className={isSelected && themeColor ? 'relative' : ''}
                    >
                      {isSelected && themeColor && (
                        <div
                          className="absolute inset-0 opacity-10 rounded"
                          style={{ backgroundColor: themeColor }}
                        />
                      )}
                      <div className="flex items-center gap-2 relative z-10">
                        {distro.iconUrl && (
                          <Image
                            src={distro.iconUrl}
                            alt={distro.name}
                            width={24}
                            height={24}
                            className="w-4 h-4 object-cover"
                          />
                        )}
                        <span>{distro.name}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Source Preference - Compact */}
          {selectedDistro && availableSources.length > 0 && (
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <div className="flex items-center gap-2 mb-1.5">
                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Package Source
                </span>
                <span className="text-xs text-muted-foreground">(optional)</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-xs font-mono font-semibold bg-muted/50 border border-border/50 rounded ml-auto">
                  s
                </kbd>
              </div>
              <Select
                value={sourcePreference || 'auto'}
                onValueChange={(value) =>
                  setSourcePreference(value === 'auto' ? null : value)
                }
              >
                <SelectTrigger ref={sourceTriggerRef} className="h-9 bg-background">
                  <SelectValue placeholder="Auto-select best source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">
                    <span className="text-muted-foreground">
                      Auto (recommended)
                    </span>
                  </SelectItem>
                  {availableSources
                    .sort((a, b) => b.priority - a.priority)
                    .map((ds) => (
                      <SelectItem key={ds.sourceId} value={ds.source.slug}>
                        <div className="flex items-center gap-2">
                          <span>{ds.source.name}</span>
                          {ds.isDefault && (
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* NixOS Installation Method - only show when Nix is selected */}
          {isNixSelected && (
            <div className="flex-1 min-w-0 w-full sm:w-auto animate-in fade-in slide-in-from-top-2 duration-200">
              <NixosMethodSelector />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
