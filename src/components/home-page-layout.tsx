/**
 * Responsive layout component for home page
 *
 * Extracted from home-page-client.tsx to eliminate mobile/desktop duplication
 * Handles the different layouts for mobile and desktop views
 */

import { RefObject, ReactNode } from 'react';
import { AppFilters } from '@/components/app-filters';
import { CategorySidebar } from '@/components/category-sidebar';
import { ViewToggle } from '@/components/view-toggle';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSelectionStore } from '@/stores/selection-store';
import type { Category } from '@/types';

export interface HomePageLayoutProps {
  // Categories
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;

  // Filters
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showPopular: boolean;
  onTogglePopular: () => void;
  onClearFilters: () => void;

  // Refs
  searchInputRef: RefObject<HTMLInputElement | null>;
  scrollAreaViewportRef?: RefObject<HTMLDivElement | null>;

  // Content
  children: ReactNode;
}

/**
 * Layout component that handles responsive rendering
 */
export function HomePageLayout({
  categories,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  showPopular,
  onTogglePopular,
  onClearFilters,
  searchInputRef,
  scrollAreaViewportRef,
  children,
}: HomePageLayoutProps) {
  // Get view state from store
  const viewMode = useSelectionStore((state) => state.viewMode);
  const setViewMode = useSelectionStore((state) => state.setViewMode);
  const isCategoryNavOpen = useSelectionStore((state) => state.isCategoryNavOpen);
  const toggleCategoryNav = useSelectionStore((state) => state.toggleCategoryNav);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-28">
      <div className="flex gap-6">
        {/* Category Sidebar - Desktop only */}
        <div className="hidden lg:block">
          <CategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            isOpen={isCategoryNavOpen}
            onToggle={toggleCategoryNav}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Mobile/Tablet: ScrollArea wrapper */}
          <div className="lg:hidden">
            {/* Sticky Filters + View Toggle Row */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-3 mb-1 space-y-2">
              {/* Category Sidebar Toggle - Mobile only */}
              <CategorySidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
                isOpen={isCategoryNavOpen}
                onToggle={toggleCategoryNav}
              />

              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <AppFilters
                    searchQuery={searchQuery}
                    onSearchChange={onSearchChange}
                    showPopular={showPopular}
                    onTogglePopular={onTogglePopular}
                    onClearFilters={onClearFilters}
                    searchInputRef={searchInputRef}
                  />
                </div>
                <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
              </div>
            </div>

            <ScrollArea
              className="h-[calc(100vh-21rem)]"
              viewportRef={scrollAreaViewportRef}
            >
              <div className="space-y-4 pr-4 pb-4">{children}</div>
            </ScrollArea>
          </div>

          {/* Desktop: No ScrollArea, normal flow */}
          <div className="hidden lg:block space-y-4">
            {/* Filters + View Toggle Row */}
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <AppFilters
                  searchQuery={searchQuery}
                  onSearchChange={onSearchChange}
                  showPopular={showPopular}
                  onTogglePopular={onTogglePopular}
                  onClearFilters={onClearFilters}
                  searchInputRef={searchInputRef}
                />
              </div>
              <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
            </div>

            {/* Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}