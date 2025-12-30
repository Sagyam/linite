'use client';

import { Terminal, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CommandHeaderProps {
  appCount: number;
  sourcePreference: string | null;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

export function CommandHeader({
  appCount,
  sourcePreference,
  copied,
  onCopy,
  onDownload,
}: CommandHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Terminal className="w-5 h-5" />
          Install Command
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {appCount} {appCount === 1 ? 'app' : 'apps'} selected
          {sourcePreference && ` • Preferring ${sourcePreference}`}
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onCopy}
          className="gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
