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
      className="fixed bottom-24 right-4 z-40 shadow-lg hidden sm:flex"
      title="Show keyboard shortcuts (Press ?)"
      aria-label="Show keyboard shortcuts"
    >
      <Keyboard className="w-4 h-4 mr-1" />
      <span className="hidden sm:inline">Shortcuts</span>
    </Button>
  );
}
