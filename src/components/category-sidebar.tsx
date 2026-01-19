'use client';

import { LayoutGrid, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { getCategoryIcon } from '@/lib/category-icons';
import type { Category } from '@/types';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function CategorySidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  isOpen = false,
  onToggle,
}: CategorySidebarProps) {
  const selectedCategoryName =
    selectedCategory === 'all'
      ? 'All Apps'
      : categories.find((c) => c.id === selectedCategory)?.name || 'All Apps';

  const CategoryList = () => (
    <nav className="space-y-1 p-2" role="navigation" aria-label="Category navigation">
      <Button
        variant={selectedCategory === 'all' ? 'secondary' : 'ghost'}
        className="w-full justify-start"
        onClick={() => {
          onCategoryChange('all');
          if (onToggle && isOpen) onToggle();
        }}
        data-category-id="all"
        aria-current={selectedCategory === 'all' ? 'page' : undefined}
      >
        <LayoutGrid className="w-4 h-4 mr-2" />
        All Apps
      </Button>
      {categories.map((category) => {
        const Icon = getCategoryIcon(category.icon);
        return (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              onCategoryChange(category.id);
              if (onToggle && isOpen) onToggle();
            }}
            data-category-id={category.id}
            aria-current={selectedCategory === category.id ? 'page' : undefined}
          >
            <Icon className="w-4 h-4 mr-2" />
            {category.name}
          </Button>
        );
      })}
    </nav>
  );

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
              <CategoryList />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Vertical sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <div className="mb-2 px-2 py-1.5 bg-muted/30 rounded-md border border-border/50">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Navigate:</span>
            <kbd className="px-1.5 py-0.5 font-mono font-semibold bg-background border border-border/50 rounded">
              h
            </kbd>
            <span>/</span>
            <kbd className="px-1.5 py-0.5 font-mono font-semibold bg-background border border-border/50 rounded">
              l
            </kbd>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <CategoryList />
        </ScrollArea>
      </aside>
    </>
  );
}
