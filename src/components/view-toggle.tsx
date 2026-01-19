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
        className="rounded-none rounded-l-md h-11 sm:h-9 px-3"
        title="Minimal view (Press 1)"
        aria-label="Minimal view"
        aria-pressed={currentView === 'minimal'}
      >
        <Grid3x3 className="w-4 h-4" />
      </Button>
      <Button
        variant={currentView === 'compact' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('compact')}
        className="rounded-none h-11 sm:h-9 px-3"
        title="Compact view (Press 2)"
        aria-label="Compact view"
        aria-pressed={currentView === 'compact'}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant={currentView === 'detailed' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('detailed')}
        className="rounded-none rounded-r-md h-11 sm:h-9 px-3"
        title="Detailed view (Press 3)"
        aria-label="Detailed view"
        aria-pressed={currentView === 'detailed'}
      >
        <LayoutList className="w-4 h-4" />
      </Button>
    </div>
  );
}
