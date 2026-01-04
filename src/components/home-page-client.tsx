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
import type { AppWithRelations, Category } from '@/types';
import type { Distro } from '@/hooks/use-distros';

interface HomePageClientProps {
  categories: Category[];
  distros: Distro[];
}

export function HomePageClient({ categories, distros }: HomePageClientProps) {
  const [selectionDrawerOpen, setSelectionDrawerOpen] = useState(false);
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const { selectedApps, selectedDistro } = useSelectionStore();

  const handleGenerateCommand = () => {
    if (selectedApps.size > 0 && selectedDistro) {
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
          {/* Hero Section - Compact */}
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Bulk Install Apps on Linux
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select apps from our curated catalog, choose your distribution,
              and get a single command to install everything.
            </p>
          </div>

          {/* Persistent Distro Bar - Always Visible */}
          <PersistentDistroBar distros={distros} />

          {/* App Selection Section - Primary Focus */}
          <div className="container mx-auto px-4 py-8 pb-24">
            <AppGrid categories={categories} />
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
