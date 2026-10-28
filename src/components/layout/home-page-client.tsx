'use client';

import { useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { AppGrid } from '@/components/apps/app-grid';
import { KeyboardIndicator } from '@/components/common/keyboard-indicator';
import { KeyboardShortcutsDialog } from '@/components/dialogs/keyboard-shortcuts-dialog';
import { PersistentDistroBar } from '@/components/distro/persistent-distro-bar';
import { FloatingActionBar } from '@/components/selection/floating-action-bar';
import { SelectionDrawer } from '@/components/selection/selection-drawer';
import { CommandDialog } from '@/components/dialogs/command-dialog';
import { SaveInstallationDialog } from '@/components/dialogs/save-installation-dialog';
import { StructuredData } from '@/components/common/structured-data';
import { HomePageLayout } from '@/components/layout/home-page-layout';
import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { useApps } from '@/hooks/use-apps';
import { useFilters } from '@/hooks/use-filters';
import { useDialogs } from '@/hooks/use-dialogs';
import { useSelectionStore } from '@/stores/selection-store';
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
  const queryClient = useQueryClient();

  // Selection store for save dialog
  const selectedApps = useSelectionStore((state) => state.selectedApps);
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);
  const sourcePreference = useSelectionStore((state) => state.sourcePreference);
  const nixosInstallMethod = useSelectionStore((state) => state.nixosInstallMethod);

  // Memoize selectedAppIds to prevent infinite re-renders
  const selectedAppIds = useMemo(() => Array.from(selectedApps), [selectedApps]);

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
    onSaveInstallation: isAuthenticated ? dialogs.handleSaveInstallation : undefined,
  });

  return (
    <>
      <StructuredData />
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 flex flex-col">
          {/* Hero: kept short, the catalog is the point of the page */}
          <section className="relative isolate overflow-hidden">
            <div className="hero-glow pointer-events-none absolute inset-0 -z-10" />
            <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-10 pb-8 text-center sm:pt-14 sm:pb-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-edge/10 bg-edge/5 px-3 py-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-amber" />
                {totalApps} apps · {distros.length} distros · one command
              </p>
              <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
                Pick your apps. Get <span className="text-primary">one command</span>.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
                Choose your distribution, tick what you want from the catalog, and Linite writes the apt, dnf,
                pacman, Flatpak or Snap command that installs it all.
              </p>
              <ol className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {['Choose your distro', 'Pick apps', 'Copy one command'].map((step, i) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </section>

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
          onSaveInstallation={dialogs.handleSaveInstallation}
          isAuthenticated={isAuthenticated}
        />

        <SelectionDrawer
          open={dialogs.selectionDrawerOpen}
          onOpenChange={dialogs.setSelectionDrawerOpen}
        />

        <CommandDialog
          open={dialogs.commandDialogOpen}
          onOpenChange={dialogs.setCommandDialogOpen}
        />

        <SaveInstallationDialog
          open={dialogs.saveDialogOpen}
          onOpenChange={dialogs.setSaveDialogOpen}
          appCount={selectedApps.size}
          selectedAppIds={selectedAppIds}
          selectedDistro={selectedDistro}
          sourcePreference={sourcePreference}
          nixosInstallMethod={nixosInstallMethod}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['installations'] });
            queryClient.invalidateQueries({ queryKey: ['user-devices'] });
          }}
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
