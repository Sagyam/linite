'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { AppGrid } from '@/components/app-grid';
import { PersistentDistroBar } from '@/components/persistent-distro-bar';
import { FloatingActionBar } from '@/components/floating-action-bar';
import { SelectionDrawer } from '@/components/selection-drawer';
import { CommandDialog } from '@/components/command-dialog';
import { StructuredData } from '@/components/structured-data';
import { useSelectionStore } from '@/stores/selection-store';
import type { Category, AppWithRelations } from '@/types';
import type { Distro } from '@/hooks/use-distros';

interface HomePageClientProps {
  categories: Category[];
  distros: Distro[];
  initialApps: AppWithRelations[];
  totalApps: number;
}

export function HomePageClient({ categories, distros, initialApps, totalApps }: HomePageClientProps) {
  const [selectionDrawerOpen, setSelectionDrawerOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);

  // Optimize: Use selectors to subscribe only to needed state
  const selectedAppsSize = useSelectionStore((state) => state.selectedApps.size);
  const selectedDistro = useSelectionStore((state) => state.selectedDistro);

  const handleGenerateCommand = () => {
    if (selectedAppsSize > 0 && selectedDistro) {
      setCommandDialogOpen(true);
    } else {
      // If distro not selected, open selection drawer to prompt user
      setSelectionDrawerOpen(true);
    }
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
          <PersistentDistroBar distros={distros} />

          {/* App Selection Section - Primary Focus */}
          <div className="container mx-auto px-4 py-6 sm:py-8 pb-24 sm:pb-28">
            <AppGrid
              categories={categories}
              initialApps={initialApps}
              totalApps={totalApps}
            />
          </div>
        </main>

        <Footer />

        {/* Floating Action Bar - Shows when apps are selected */}
        <FloatingActionBar
          distros={distros}
          onViewSelection={() => setSelectionDrawerOpen(true)}
          onGenerateCommand={handleGenerateCommand}
        />

        {/* Selection Drawer - Bottom drawer for reviewing selection */}
        <SelectionDrawer
          open={selectionDrawerOpen}
          onOpenChange={setSelectionDrawerOpen}
        />

        {/* Command Dialog - Modal for showing generated command */}
        <CommandDialog
          open={commandDialogOpen}
          onOpenChange={setCommandDialogOpen}
        />
      </div>
    </>
  );
}
