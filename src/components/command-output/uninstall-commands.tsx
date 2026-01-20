'use client';

import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PackageBreakdown {
  source: string;
  packages: string[];
}

interface UninstallCommandsProps {
  commands: string[];
  breakdown: PackageBreakdown[];
  copiedItems: Record<number, boolean>;
  onCopyCommand: (index: number) => void;
}

export function UninstallCommands({
  commands,
  breakdown,
  copiedItems,
  onCopyCommand,
}: UninstallCommandsProps) {
  return (
    <div className="space-y-3">
      {breakdown.map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{item.source}</Badge>
              <span className="text-xs text-muted-foreground">
                {item.packages.length}{' '}
                {item.packages.length === 1 ? 'package' : 'packages'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyCommand(i)}
              className="h-8 px-2 gap-1.5"
            >
              {copiedItems[i] ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-xs">
                {copiedItems[i] ? 'Copied' : 'Copy'}
              </span>
            </Button>
          </div>
          <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
            <div className="whitespace-pre-wrap">{commands[i]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
