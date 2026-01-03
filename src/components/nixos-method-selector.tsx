'use client';

import { Package } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSelectionStore } from '@/stores/selection-store';

const NIXOS_INSTALL_METHODS = [
  {
    value: 'nix-shell',
    label: 'Temporary (nix-shell)',
    description: 'For testing apps - packages disappear after shell exits',
  },
  {
    value: 'nix-env',
    label: 'Traditional (nix-env)',
    description: 'Stable method - works immediately without setup',
  },
  {
    value: 'nix-flakes',
    label: 'Modern (Flakes)',
    description: 'Recommended for 2025+ - requires experimental features enabled',
  },
] as const;

export function NixosMethodSelector() {
  const { nixosInstallMethod, setNixosInstallMethod } = useSelectionStore();

  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Package className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">
          Installation Method
        </span>
      </div>
      <Select
        value={nixosInstallMethod || 'nix-shell'}
        onValueChange={(value) =>
          setNixosInstallMethod(
            value as 'nix-shell' | 'nix-env' | 'nix-flakes'
          )
        }
      >
        <SelectTrigger id="nixos-method-select" className="h-9 bg-background">
          <SelectValue placeholder="Select installation method" />
        </SelectTrigger>
        <SelectContent>
          {NIXOS_INSTALL_METHODS.map((method) => (
            <SelectItem key={method.value} value={method.value}>
              <div className="flex flex-col items-start gap-0.5">
                <span>{method.label}</span>

              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
