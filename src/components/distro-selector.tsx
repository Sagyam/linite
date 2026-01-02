'use client';

import Image from 'next/image';
import { Monitor, HelpCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDistros } from '@/hooks/use-distros';
import { useSelectionStore } from '@/stores/selection-store';

export function DistroSelector() {
  const { distros } = useDistros();
  const { selectedDistro, setDistro, sourcePreference, setSourcePreference } =
    useSelectionStore();

  // Get available sources for selected distro
  const selectedDistroObj = distros.find((d) => d.slug === selectedDistro);
  const availableSources = selectedDistroObj?.distroSources || [];

  return (
    <div className="space-y-4">
      {/* Distro Selection */}
      <div className="space-y-2">
        <Label htmlFor="distro-select" className="flex items-center gap-2">
          <Monitor className="w-4 h-4" />
          Select Your Distribution
        </Label>
        <Select value={selectedDistro || ''} onValueChange={setDistro}>
          <SelectTrigger id="distro-select">
            <SelectValue placeholder="Choose your Linux distribution" />
          </SelectTrigger>
          <SelectContent>
            {distros.map((distro) => (
              <SelectItem key={distro.id} value={distro.slug}>
                <div className="flex items-center gap-2">
                  {distro.iconUrl && (
                    <Image
                      src={distro.iconUrl}
                      alt={distro.name}
                      width={16}
                      height={16}
                      className="w-4 h-4 object-cover"
                    />
                  )}
                  <span>{distro.name}</span>
                  {distro.isPopular && (
                    <Badge variant="secondary" className="text-xs ml-1">
                      Popular
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedDistroObj && (
          <p className="text-xs text-muted-foreground">
            Family: {selectedDistroObj.family}
            {selectedDistroObj.basedOn && ` • Based on: ${selectedDistroObj.basedOn}`}
          </p>
        )}
      </div>

      {/* Source Preference */}
      {selectedDistro && availableSources.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="source-select" className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Preferred Package Source
            <span className="text-xs text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Select
            value={sourcePreference || 'auto'}
            onValueChange={(value) =>
              setSourcePreference(value === 'auto' ? null : value)
            }
          >
            <SelectTrigger id="source-select">
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
                      <span className="text-xs text-muted-foreground">
                        (Priority: {ds.priority})
                      </span>
                    </div>
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Override the automatic source selection for packages
          </p>
        </div>
      )}
    </div>
  );
}
