'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScreenshotsGallery } from '@/components/screenshots-gallery';
import { AppDetailsHeader } from '@/components/app-details/app-details-header';
import { AppPackagesList } from '@/components/app-details/app-packages-list';
import { AppDetailsSidebar } from '@/components/app-details/app-details-sidebar';
import { useSelectionStore } from '@/stores/selection-store';
import { useAppMetadata } from '@/hooks/use-app-metadata';
import { toast } from 'sonner';
import type { AppWithRelations } from '@/types';

interface AppDetailsClientProps {
  app: AppWithRelations;
}

export function AppDetailsClient({ app }: AppDetailsClientProps) {
  const { selectedApps, toggleApp } = useSelectionStore();
  const isSelected = selectedApps.has(app.id);
  const metadata = useAppMetadata(app);

  const handleToggleSelection = () => {
    toggleApp(app.id);
    if (isSelected) {
      toast.info(`${app.displayName} removed from selection`);
    } else {
      toast.success(`${app.displayName} added to selection`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Apps
          </Link>
        </Button>

        {/* App Header */}
        <AppDetailsHeader
          app={app}
          isSelected={isSelected}
          onToggleSelection={handleToggleSelection}
        />

        <Separator className="my-8" />

        {/* App Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Screenshots */}
            {metadata.screenshots.length > 0 && (
              <ScreenshotsGallery
                screenshots={metadata.screenshots}
                appName={app.displayName}
              />
            )}

            {/* External Links */}
            {app.homepage && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Links</h2>
                <a
                  href={app.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Official Website
                </a>
              </Card>
            )}

            {/* Available Packages */}
            <AppPackagesList app={app} />
          </div>

          {/* Sidebar */}
          <AppDetailsSidebar
            app={app}
            metadata={metadata}
            isSelected={isSelected}
            onToggleSelection={handleToggleSelection}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
