'use client';

import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KeyboardIndicatorProps {
  onClick: () => void;
}

export function KeyboardIndicator({ onClick }: KeyboardIndicatorProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 shadow-lg hidden lg:flex gap-1"
      title="Show keyboard shortcuts"
      aria-label="Show keyboard shortcuts"
    >
      <Keyboard className="w-4 h-4" />
      <span>Press</span>
      <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">
        ?
      </kbd>
    </Button>
  );
}
