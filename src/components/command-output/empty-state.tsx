'use client';

import { Terminal } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function EmptyState() {
  return (
    <Card className="p-6">
      <div className="text-center text-muted-foreground">
        <Terminal className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No command generated yet</p>
        <p className="text-sm mt-1">
          Select a distribution and some apps to get started
        </p>
      </div>
    </Card>
  );
}
