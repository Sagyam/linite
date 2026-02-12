'use client';

import { useRef } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppGrid } from '@/components/app-grid';
import { KeyboardIndicator } from '@/components/keyboard-indicator';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { PersistentDistroBar } from '@/components/persistent-distro-bar';
import { FloatingActionBar } from '@/components/floating-action-bar';
import { SelectionDrawer } from '@/components/selection-drawer';
import { CommandDialog } from '@/components/command-dialog';
import { StructuredData } from '@/components/structured-data';
import { HomePageLayout } from '@/components/home-page-layout';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useApps } from '@/hooks/use-apps';
import { useFilters } from '@/hooks/use-filters';
import { useDialogs } from '@/hooks/use-dialogs';
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
  // Custom hooks for state management (EXTRACTED)
  const filters = useFilters();
  const dialogs = useDialogs();

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const distroTriggerRef = useRef<HTMLButtonElement>(null);
  const sourceTriggerRef = useRef<HTMLButtonElement>(null);

  // Debounced search for better UX
  const debouncedSearch = useDebounce(filters.searchQuery, TIMEOUTS.DEBOUNCE_SEARCH);

  // Get apps for display and keyboard navigation
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useApps({
    category: filters.selectedCategory === 'all' ? undefined : filters.selectedCategory,
    popular: filters.showPopular || undefined,
    search: debouncedSearch || undefined,
  });

  const displayedApps = data?.pages.flatMap((page) => page.apps) ?? [];

  // Keyboard navigation
  const { showShortcuts, setShowShortcuts } = useKeyboardNavigation({
    apps: displayedApps,
    categories,
    selectedCategory: filters.selectedCategory,
    onCategoryChange: filters.setSelectedCategory,
    searchInputRef,
    distroTriggerRef,
    sourceTriggerRef,
    onGenerateCommand: dialogs.handleToggleGenerateCommand,
    onViewSelection: dialogs.handleToggleSelectionDrawer,
  });

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

          {/* Main Content Area - Responsive Layout (EXTRACTED) */}
          <HomePageLayout
            categories={categories}
            selectedCategory={filters.selectedCategory}
            onCategoryChange={filters.setSelectedCategory}
            searchQuery={filters.searchQuery}
            onSearchChange={filters.setSearchQuery}
            showPopular={filters.showPopular}
            onTogglePopular={filters.togglePopular}
            onClearFilters={filters.clearFilters}
            searchInputRef={searchInputRef}
            scrollAreaViewportRef={scrollAreaViewportRef}
          >
            <AppGrid
              categories={categories}
              initialApps={initialApps}
              totalApps={totalApps}
              selectedCategory={filters.selectedCategory}
              searchQuery={debouncedSearch}
              showPopular={filters.showPopular}
              scrollAreaViewportRef={scrollAreaViewportRef}
              apps={displayedApps}
              totalCount={data?.pages[0]?.pagination.total ?? totalApps ?? 0}
              isLoading={false}
              isError={false}
              hasNextPage={hasNextPage ?? false}
              isFetchingNextPage={isFetchingNextPage ?? false}
              fetchNextPage={fetchNextPage}
            />
          </HomePageLayout>
        </main>

        <Footer />

        {/* Floating Components */}
        <FloatingActionBar
          distros={distros}
          onViewSelection={() => dialogs.setSelectionDrawerOpen(true)}
          onGenerateCommand={dialogs.handleGenerateCommand}
        />

        <SelectionDrawer
          open={dialogs.selectionDrawerOpen}
          onOpenChange={dialogs.setSelectionDrawerOpen}
          isAuthenticated={isAuthenticated}
        />

        <CommandDialog
          open={dialogs.commandDialogOpen}
          onOpenChange={dialogs.setCommandDialogOpen}
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
