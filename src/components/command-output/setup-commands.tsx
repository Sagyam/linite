'use client';

import { Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SetupCommandsProps {
  commands: string[];
  copied: boolean;
  onCopy: () => void;
}

export function SetupCommands({ commands, copied, onCopy }: SetupCommandsProps) {
  if (!commands || commands.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Setup</Badge>
          <span className="text-sm text-muted-foreground">
            Run these first
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-8 px-2 gap-1.5"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="text-xs">
            {copied ? 'Copied' : 'Copy'}
          </span>
        </Button>
      </div>
      <div className="bg-muted rounded-md p-4 font-mono text-sm overflow-x-auto">
        {commands.map((cmd, i) => (
          <div key={i} className="whitespace-pre-wrap">
            {cmd}
          </div>
        ))}
      </div>
    </div>
  );
}
