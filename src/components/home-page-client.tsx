'use client';

import { useState, useRef } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppGrid } from '@/components/app-grid';
import { AppFilters } from '@/components/app-filters';
import { CategorySidebar } from '@/components/category-sidebar';
import { ViewToggle } from '@/components/view-toggle';
import { KeyboardIndicator } from '@/components/keyboard-indicator';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { PersistentDistroBar } from '@/components/persistent-distro-bar';
import { FloatingActionBar } from '@/components/floating-action-bar';
import { SelectionDrawer } from '@/components/selection-drawer';
import { CommandDialog } from '@/components/command-dialog';
import { StructuredData } from '@/components/structured-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSelectionStore } from '@/stores/selection-store';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useApps } from '@/hooks/use-apps';
import { TIMEOUTS } from '@/lib/constants';
import type { Category, AppWithRelations } from '@/types';
import type { Distro } from '@/hooks/use-distros';

interface HomePageClientProps {
  categories: Category[];
  distros: Distro[];
  initialApps: AppWithRelations[];
  totalApps: number;
  isAuthenticated?: boolean;
}

export function HomePageClient({ categories, distros, initialApps, totalApps, isAuthenticated = false }: HomePageClientProps) {
  // Dialog/drawer state
  const [selectionDrawerOpen, setSelectionDrawerOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopular, setShowPopular] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const distroTriggerRef = useRef<HTMLButtonElement>(null);
  const sourceTriggerRef = useRef<HTMLButtonElement>(null);

  // Debounced search for better UX
  const debouncedSearch = useDebounce(searchQuery, TIMEOUTS.DEBOUNCE_SEARCH);

  // Get state from Zustand store
  const selectedAppsSize = useSelectionStore((state) => state.selectedApps.size);
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);
  const viewMode = useSelectionStore((state) => state.viewMode);
  const setViewMode = useSelectionStore((state) => state.setViewMode);
  const isCategoryNavOpen = useSelectionStore((state) => state.isCategoryNavOpen);
  const toggleCategoryNav = useSelectionStore((state) => state.toggleCategoryNav);

  // Get apps for keyboard navigation
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useApps({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    popular: showPopular || undefined,
    search: debouncedSearch || undefined,
  });

  const displayedApps = data?.pages.flatMap((page) => page.apps) ?? [];

  const handleGenerateCommand = () => {
    if (selectedAppsSize > 0 && selectedDistro) {
      setCommandDialogOpen(true);
    } else {
      // If distro not selected, open selection drawer to prompt user
      setSelectionDrawerOpen(true);
    }
  };

  const handleToggleGenerateCommand = () => {
    // If dialog is already open, close it (toggle behavior)
    if (commandDialogOpen) {
      setCommandDialogOpen(false);
    } else {
      handleGenerateCommand();
    }
  };

  const handleToggleSelectionDrawer = () => {
    // Toggle the selection drawer
    setSelectionDrawerOpen(!selectionDrawerOpen);
  };

  // Keyboard navigation
  const { showShortcuts, setShowShortcuts } = useKeyboardNavigation({
    apps: displayedApps,
    categories,
    selectedCategory,
    onCategoryChange: setSelectedCategory,
    searchInputRef,
    distroTriggerRef,
    sourceTriggerRef,
    onGenerateCommand: handleToggleGenerateCommand,
    onViewSelection: handleToggleSelectionDrawer,
  });

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setShowPopular(false);
  };

  return (
    <>
      <StructuredData />
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col">
          {/* Hero Section - Compact and Responsive */}
          <div className="container mx-auto px-4 py-6 sm:py-8 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
              Bulk Install Apps on Linux
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              Select apps from our curated catalog, choose your distribution,
              and get a single command to install everything.
            </p>
          </div>

          {/* Persistent Distro Bar - Always Visible */}
          <PersistentDistroBar
            distros={distros}
            distroTriggerRef={distroTriggerRef}
            sourceTriggerRef={sourceTriggerRef}
          />

          {/* Main Content Area - Two-column layout */}
          <div className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-28">
            <div className="flex gap-6">
              {/* Category Sidebar - Desktop only */}
              <div className="hidden lg:block">
                <CategorySidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
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
                      onCategoryChange={setSelectedCategory}
                      isOpen={isCategoryNavOpen}
                      onToggle={toggleCategoryNav}
                    />

                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <AppFilters
                          searchQuery={searchQuery}
                          onSearchChange={setSearchQuery}
                          showPopular={showPopular}
                          onTogglePopular={() => setShowPopular(!showPopular)}
                          onClearFilters={handleClearFilters}
                          searchInputRef={searchInputRef}
                        />
                      </div>
                      <ViewToggle
                        currentView={viewMode}
                        onViewChange={setViewMode}
                      />
                    </div>
                  </div>

                  <ScrollArea className="h-[calc(100vh-21rem)]" viewportRef={scrollAreaViewportRef}>
                    <div className="space-y-4 pr-4 pb-4">
                      {/* App Grid */}
                      <AppGrid
                        categories={categories}
                        initialApps={initialApps}
                        totalApps={totalApps}
                        selectedCategory={selectedCategory}
                        searchQuery={debouncedSearch}
                        showPopular={showPopular}
                        scrollAreaViewportRef={scrollAreaViewportRef}
                        apps={displayedApps}
                        totalCount={data?.pages[0]?.pagination.total ?? totalApps ?? 0}
                        isLoading={false}
                        isError={false}
                        hasNextPage={hasNextPage ?? false}
                        isFetchingNextPage={isFetchingNextPage ?? false}
                        fetchNextPage={fetchNextPage}
                      />
                    </div>
                  </ScrollArea>
                </div>

                {/* Desktop: No ScrollArea, normal flow */}
                <div className="hidden lg:block space-y-4">
                  {/* Filters + View Toggle Row */}
                  <div className="flex gap-3 items-start">
                    <div className="flex-1">
                      <AppFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        showPopular={showPopular}
                        onTogglePopular={() => setShowPopular(!showPopular)}
                        onClearFilters={handleClearFilters}
                        searchInputRef={searchInputRef}
                      />
                    </div>
                    <ViewToggle
                      currentView={viewMode}
                      onViewChange={setViewMode}
                    />
                  </div>

                  {/* App Grid */}
                  <AppGrid
                    categories={categories}
                    initialApps={initialApps}
                    totalApps={totalApps}
                    selectedCategory={selectedCategory}
                    searchQuery={debouncedSearch}
                    showPopular={showPopular}
                    apps={displayedApps}
                    totalCount={data?.pages[0]?.pagination.total ?? totalApps ?? 0}
                    isLoading={false}
                    isError={false}
                    hasNextPage={hasNextPage ?? false}
                    isFetchingNextPage={isFetchingNextPage ?? false}
                    fetchNextPage={fetchNextPage}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />

        {/* Floating Components */}
        <FloatingActionBar
          distros={distros}
          onViewSelection={() => setSelectionDrawerOpen(true)}
          onGenerateCommand={handleGenerateCommand}
        />

        <SelectionDrawer
          open={selectionDrawerOpen}
          onOpenChange={setSelectionDrawerOpen}
          isAuthenticated={isAuthenticated}
        />

        <CommandDialog
          open={commandDialogOpen}
          onOpenChange={setCommandDialogOpen}
        />

        <KeyboardIndicator onClick={() => setShowShortcuts(true)} />

        <KeyboardShortcutsDialog
          open={showShortcuts}
          onOpenChange={setShowShortcuts}
        />
      </div>
    </>
  );
}
