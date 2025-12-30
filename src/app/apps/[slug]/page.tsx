'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Package, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorDisplay } from '@/components/error-display';
import { useSelectionStore } from '@/stores/selection-store';
import { toast } from 'sonner';
import type { App } from '@/hooks/use-apps';

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { selectedApps, toggleApp } = useSelectionStore();
  const isSelected = app ? selectedApps.has(app.id) : false;

  useEffect(() => {
    const fetchApp = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all apps and find the one with matching slug
        const response = await fetch('/api/apps');
        if (!response.ok) {
          throw new Error('Failed to fetch app details');
        }

        const apps: App[] = await response.json();
        const foundApp = apps.find((a) => a.slug === slug);

        if (!foundApp) {
          setError('App not found');
          return;
        }

        setApp(foundApp);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApp();
  }, [slug]);

  const handleToggleSelection = () => {
    if (!app) return;
    toggleApp(app.id);
    if (isSelected) {
      toast.info(`${app.displayName} removed from selection`);
    } else {
      toast.success(`${app.displayName} added to selection`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Apps
          </Button>
          <ErrorDisplay
            title="App Not Found"
            message={error || 'The requested app could not be found'}
            onRetry={() => router.push('/')}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Apps
        </Button>

        {/* App Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            {app.iconUrl && (
              <Image
                src={app.iconUrl}
                alt={app.displayName}
                width={96}
                height={96}
                className="w-24 h-24 rounded-lg shadow-md object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}

            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold mb-2">{app.displayName}</h1>
                  <p className="text-lg text-muted-foreground mb-3">
                    {app.description || 'No description available'}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{app.category.name}</Badge>
                    {app.isFoss && (
                      <Badge variant="default" className="bg-green-600">
                        FOSS
                      </Badge>
                    )}
                    {app.isPopular && (
                      <Badge variant="default">Popular</Badge>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleToggleSelection}
                  size="lg"
                  variant={isSelected ? 'secondary' : 'default'}
                  className="gap-2"
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      Add to Selection
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        {/* App Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Links */}
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
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Available Packages ({app.packages.length})
              </h2>

              {app.packages.length === 0 ? (
                <p className="text-muted-foreground">
                  No packages available for this app
                </p>
              ) : (
                <div className="space-y-3">
                  {app.packages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {pkg.source.name}
                          </Badge>
                          {pkg.version && (
                            <span className="text-sm text-muted-foreground">
                              v{pkg.version}
                            </span>
                          )}
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Identifier:</span>{' '}
                          <code className="bg-muted px-2 py-0.5 rounded text-xs">
                            {pkg.identifier}
                          </code>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {pkg.isAvailable ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button
                  onClick={handleToggleSelection}
                  variant={isSelected ? 'secondary' : 'default'}
                  className="w-full gap-2"
                >
                  {isSelected ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Remove from Selection
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      Add to Selection
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  className="w-full"
                >
                  Browse More Apps
                </Button>
              </div>
            </Card>

            {/* Metadata */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Information</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium">{app.category.name}</p>
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground">Available Sources:</span>
                  <p className="font-medium">{app.packages.length}</p>
                </div>

                <Separator />

                <div>
                  <span className="text-muted-foreground">License:</span>
                  <p className="font-medium">
                    {app.isFoss ? 'Free & Open Source' : 'Proprietary'}
                  </p>
                </div>

                {app.packages.some(p => p.version) && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground">Latest Version:</span>
                      <p className="font-medium">
                        {app.packages.find(p => p.version)?.version || 'Unknown'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
