'use client';

import { Search, X, List, Grid3x3, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCategoryIcon } from '@/lib/category-icons';
import type { Category } from '@/types';

type LayoutType = 'compact' | 'detailed';

interface AppFiltersProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showPopular: boolean;
  onTogglePopular: () => void;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onClearFilters: () => void;
}

export function AppFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  showPopular,
  onTogglePopular,
  layout,
  onLayoutChange,
  onClearFilters,
}: AppFiltersProps) {
  const hasFilters = selectedCategory !== 'all' || searchQuery || showPopular;

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Popular Toggle */}
        <Button
          variant={showPopular ? 'default' : 'outline'}
          onClick={onTogglePopular}
          className="shrink-0"
        >
          <span className="hidden xs:inline">Popular Apps</span>
          <span className="xs:hidden">Popular</span>
        </Button>

        {/* Layout Switcher */}
        <div className="hidden sm:flex border rounded-md shrink-0">
          <Button
            variant={layout === 'compact' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLayoutChange('compact')}
            className="rounded-r-none"
          >
            <List className="w-4 h-4" />
            <span className="hidden md:inline ml-1">Compact</span>
          </Button>
          <Button
            variant={layout === 'detailed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLayoutChange('detailed')}
            className="rounded-l-none"
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="hidden md:inline ml-1">Detailed</span>
          </Button>
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={onClearFilters}
            className="gap-2 shrink-0"
            size="sm"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <Tabs value={selectedCategory} onValueChange={onCategoryChange}>
          <TabsList className="w-full justify-start overflow-x-auto h-auto flex-wrap sm:flex-nowrap">
            <TabsTrigger value="all" className="gap-1.5 shrink-0">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden xs:inline">All Apps</span>
              <span className="xs:hidden">All</span>
            </TabsTrigger>
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.icon);
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="gap-1.5 shrink-0"
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      )}

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {selectedCategory !== 'all' && (
            <Badge variant="secondary">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </Badge>
          )}
          {showPopular && <Badge variant="secondary">Popular</Badge>}
          {searchQuery && (
            <Badge variant="secondary" className="max-w-[200px] truncate">
              Search: {searchQuery}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
