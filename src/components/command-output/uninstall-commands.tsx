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
  // Group breakdown by source to match commands array
  // The breakdown array has one entry per package, but commands array groups packages by source
  const groupedBreakdown: Array<{ source: string; packageCount: number; commandIndex: number }> = [];
  const sourceIndexMap = new Map<string, number>();

  breakdown.forEach((item) => {
    if (!sourceIndexMap.has(item.source)) {
      sourceIndexMap.set(item.source, groupedBreakdown.length);
      groupedBreakdown.push({
        source: item.source,
        packageCount: item.packages.length,
        commandIndex: groupedBreakdown.length,
      });
    } else {
      // Increment package count for existing source
      const index = sourceIndexMap.get(item.source)!;
      groupedBreakdown[index].packageCount += item.packages.length;
    }
  });

  // Filter out entries with empty commands
  const validEntries = groupedBreakdown.filter((item) => {
    const command = commands[item.commandIndex];
    return command && command.trim().length > 0;
  });

  return (
    <div className="space-y-3">
      {validEntries.map((item, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{item.source}</Badge>
              <span className="text-xs text-muted-foreground">
                {item.packageCount}{' '}
                {item.packageCount === 1 ? 'package' : 'packages'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyCommand(item.commandIndex)}
              className="h-8 px-2 gap-1.5"
            >
              {copiedItems[item.commandIndex] ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span className="text-xs">
                {copiedItems[item.commandIndex] ? 'Copied' : 'Copy'}
              </span>
            </Button>
          </div>
          <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
            <div className="whitespace-pre-wrap">{commands[item.commandIndex]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
