'use client';

import { Badge } from '@/components/ui/badge';

interface CommandWarningsProps {
  warnings: string[];
}

export function CommandWarnings({ warnings }: CommandWarningsProps) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Badge variant="outline" className="border-amber/30 text-amber">Warnings</Badge>
      <div className="bg-amber/10 border border-amber/25 rounded-lg p-4 text-sm space-y-1">
        {warnings.map((warning, i) => (
          <p key={i} className="text-foreground">
            • {warning}
          </p>
        ))}
      </div>
    </div>
  );
}
