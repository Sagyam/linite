'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getCategoryIcon } from '@/lib/category-icons';
import { useSelectionStore } from '@/stores/selection-store';
import { cn } from '@/lib/utils';
import type { Category } from '@/types';

/**
 * Hook to ensure we only render after client-side hydration
 * Prevents hydration errors when using persisted state
 */
function useClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Intentionally set state on mount to handle SSR/CSR hydration
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  return isClient;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

/** A row of the list: quiet until it is the current category. */
function itemClass(active: boolean) {
  return cn(
    'h-8 w-full justify-start pr-10 font-normal',
    active ? 'bg-edge/5 font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
  );
}

interface CategoryListProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryCountsMap: Map<string, number>;
  totalSelectedCount: number;
  onToggle?: () => void;
  isOpen?: boolean;
}

function CategoryList({
  categories,
  selectedCategory,
  onCategoryChange,
  categoryCountsMap,
  totalSelectedCount,
  onToggle,
  isOpen,
}: CategoryListProps) {
  return (
    <nav className="space-y-0.5 p-1" role="navigation" aria-label="Category navigation">
      <div className="relative">
        <Button
          variant="ghost"
          className={itemClass(selectedCategory === 'all')}
          onClick={() => {
            onCategoryChange('all');
            if (onToggle && isOpen) onToggle();
          }}
          data-category-id="all"
          aria-current={selectedCategory === 'all' ? 'page' : undefined}
        >
          <LayoutGrid />
          All Apps
        </Button>
        {totalSelectedCount > 0 && (
          <Badge
            variant="default"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-5 min-w-5 px-1.5 font-mono"
          >
            {totalSelectedCount}
          </Badge>
        )}
      </div>
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.icon);
        const count = categoryCountsMap.get(category.id) || 0;
        const categoryColor = category.colorLight || category.colorDark;

        return (
          <div key={category.id} className="relative">
            <Button
              variant="ghost"
              className={itemClass(selectedCategory === category.id)}
              onClick={() => {
                onCategoryChange(category.id);
                if (onToggle && isOpen) onToggle();
              }}
              data-category-id={category.id}
              aria-current={selectedCategory === category.id ? 'page' : undefined}
            >
              <Icon style={categoryColor && count > 0 ? { color: categoryColor } : undefined} />
              {category.name}
            </Button>
            {count > 0 && (
              <Badge
                variant="secondary"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 min-w-5 px-1.5 font-mono"
                style={categoryColor ? { backgroundColor: categoryColor, color: 'white' } : undefined}
              >
                {count}
              </Badge>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  isOpen = false,
  onToggle,
}: CategorySidebarProps) {
  const isClient = useClientOnly();

  const getCategoryCounts = useSelectionStore((state) => state.getCategoryCounts);
  const totalSelectedCount = useSelectionStore((state) => state.selectedApps.size);

  const categoryCountsMap = isClient ? getCategoryCounts() : new Map();

  const selectedCategoryName =
    selectedCategory === 'all'
      ? 'All Apps'
      : categories.find((c) => c.id === selectedCategory)?.name || 'All Apps';

  return (
    <>
      {/* Mobile: Collapsible dropdown */}
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={onToggle}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start h-11 sm:h-10"
              aria-label={selectedCategoryName}
            >
              <Menu className="w-4 h-4 mr-2" />
              <span className="truncate">{selectedCategoryName}</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle>Categories</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-full mt-4">
              {isClient ? (
                <CategoryList
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={onCategoryChange}
                  categoryCountsMap={categoryCountsMap}
                  totalSelectedCount={totalSelectedCount}
                  onToggle={onToggle}
                  isOpen={isOpen}
                />
              ) : null}
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Vertical sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <p className="mb-2 flex items-center gap-2 px-3 text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Categories
          <span className="ml-auto flex items-center gap-1 font-normal tracking-normal normal-case">
            <kbd className="kbd">h</kbd>
            <kbd className="kbd">l</kbd>
          </span>
        </p>
        <ScrollArea className="h-[calc(100vh-18rem)]">
          {isClient ? (
            <CategoryList
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              categoryCountsMap={categoryCountsMap}
              totalSelectedCount={totalSelectedCount}
            />
          ) : null}
        </ScrollArea>
      </aside>
    </>
  );
}
