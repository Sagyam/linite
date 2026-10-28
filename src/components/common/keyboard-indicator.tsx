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
      className="fixed bottom-28 right-5 z-40 hidden rounded-full bg-background/85 text-muted-foreground shadow-lg backdrop-blur-md lg:flex"
      title="Show keyboard shortcuts"
      aria-label="Show keyboard shortcuts"
    >
      <Keyboard className="w-4 h-4" />
      <span>Shortcuts</span>
      <kbd className="kbd">?</kbd>
    </Button>
  );
}
