'use client';

import { Grid3x3, List, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewMode } from '@/stores/selection-store';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex border rounded-md shrink-0" role="group" aria-label="View mode toggle">
      <Button
        variant={currentView === 'minimal' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('minimal')}
        className="rounded-none rounded-l-md"
        title="Minimal view (Press 1)"
        aria-label="Minimal view"
        aria-pressed={currentView === 'minimal'}
      >
        <Grid3x3 className="w-4 h-4" />
        <span className="hidden md:inline ml-1">Minimal</span>
      </Button>
      <Button
        variant={currentView === 'compact' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('compact')}
        className="rounded-none"
        title="Compact view (Press 2)"
        aria-label="Compact view"
        aria-pressed={currentView === 'compact'}
      >
        <List className="w-4 h-4" />
        <span className="hidden md:inline ml-1">Compact</span>
      </Button>
      <Button
        variant={currentView === 'detailed' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('detailed')}
        className="rounded-none rounded-r-md"
        title="Detailed view (Press 3)"
        aria-label="Detailed view"
        aria-pressed={currentView === 'detailed'}
      >
        <LayoutList className="w-4 h-4" />
        <span className="hidden md:inline ml-1">Detailed</span>
      </Button>
    </div>
  );
}
