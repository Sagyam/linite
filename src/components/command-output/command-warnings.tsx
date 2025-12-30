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
      <Badge variant="destructive">Warnings</Badge>
      <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm space-y-1">
        {warnings.map((warning, i) => (
          <p key={i} className="text-destructive">
            • {warning}
          </p>
        ))}
      </div>
    </div>
  );
}
