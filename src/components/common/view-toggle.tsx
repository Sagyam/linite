'use client';

import { Grid3x3, List, LayoutList } from 'lucide-react';
import type { ViewMode } from '@/stores/selection-store';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const views = [
  { value: 'minimal', label: 'Minimal', key: '1', icon: Grid3x3 },
  { value: 'compact', label: 'Compact', key: '2', icon: List },
  { value: 'detailed', label: 'Detailed', key: '3', icon: LayoutList },
] as const;

/** A segmented control, styled like the theme switch in the footer. */
export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div
      className="inline-flex shrink-0 rounded-lg border border-edge/10 bg-edge/[0.03] p-0.5"
      role="group"
      aria-label="View mode toggle"
    >
      {views.map(({ value, label, key, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onViewChange(value)}
          title={`${label} view (Press ${key})`}
          aria-label={`${label} view`}
          aria-pressed={currentView === value}
          className="inline-flex h-10 items-center gap-1.5 rounded-md px-3 text-xs text-muted-foreground transition-colors hover:text-foreground sm:h-8 aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm aria-pressed:ring-1 aria-pressed:ring-edge/10"
        >
          <Icon className="size-4" />
          <span className="hidden lg:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
