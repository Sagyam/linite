'use client';

 import { useState } from 'react';
import { Terminal, Download, Copy, Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommandHeaderProps {
  title?: string;
  appCount: number;
  sourcePreference: string | null;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
  isWindows?: boolean;
}

export function CommandHeader({
  title = 'Install Command',
  appCount,
  sourcePreference,
  copied,
  onCopy,
  onDownload,
  isWindows = false,
}: CommandHeaderProps) {
  const [showDownloadInstructions, setShowDownloadInstructions] = useState(false);

  const handleDownload = () => {
    onDownload();
    setShowDownloadInstructions(true);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            {title}
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
            onClick={handleDownload}
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

      {showDownloadInstructions && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {isWindows ? (
              <>
                <strong>To run the script:</strong> Open PowerShell as Administrator and run:{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  .\linite-install.ps1
                </code>
              </>
            ) : (
              <>
                <strong>To run the script:</strong>{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  chmod +x linite-install.sh && ./linite-install.sh
                </code>{' '}
                or{' '}
                <code className="bg-muted px-1 py-0.5 rounded text-xs">
                  bash linite-install.sh
                </code>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
