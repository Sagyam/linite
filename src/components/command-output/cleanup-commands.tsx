'use client';

import { Copy, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CleanupCommandsProps {
  commands: string[];
  label: string;
  description?: string;
  copied: boolean;
  onCopy: () => void;
}

export function CleanupCommands({
  commands,
  label,
  description,
  copied,
  onCopy,
}: CleanupCommandsProps) {
  if (commands.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h4 className="font-medium">{label}</h4>
        {description && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            <span>{description}</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        {commands.map((cmd, i) => (
          <div key={i} className="bg-muted/50 rounded-md p-3">
            <div className="flex justify-end mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                className="h-7 px-2 gap-1.5"
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
            <div className="font-mono text-sm overflow-x-auto">
              <div className="whitespace-pre-wrap">{cmd}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
