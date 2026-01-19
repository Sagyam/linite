'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { forwardRef } from 'react';

interface AppFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showPopular: boolean;
  onTogglePopular: () => void;
  onClearFilters: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function AppFilters({
  searchQuery,
  onSearchChange,
  showPopular,
  onTogglePopular,
  onClearFilters,
  searchInputRef,
}: AppFiltersProps) {
  const hasFilters = searchQuery || showPopular;

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground pointer-events-none" />
        <Input
          ref={searchInputRef}
          type="search"
          placeholder="Search applications..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-11 sm:h-10 text-base sm:text-sm"
          aria-label="Search applications"
        />
      </div>

      {/* Popular Toggle - Hidden on mobile */}
      <Button
        variant={showPopular ? 'default' : 'outline'}
        onClick={onTogglePopular}
        className="shrink-0 hidden sm:flex"
        aria-pressed={showPopular}
        aria-label="Show popular apps only"
      >
        Popular Apps
      </Button>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          onClick={onClearFilters}
          className="gap-2 shrink-0"
          size="sm"
          aria-label="Clear filters"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline">Clear</span>
        </Button>
      )}
    </div>
  );
}
