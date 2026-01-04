'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, ExternalLink, CheckCircle, XCircle, Download, User, FileText, Calendar, Clock } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScreenshotsGallery } from '@/components/screenshots-gallery';
import { useSelectionStore } from '@/stores/selection-store';
import { toast } from 'sonner';
import { formatBytes, formatRelativeTime, formatDate } from '@/lib/format';
import type { AppWithRelations } from '@/types';

interface AppDetailsClientProps {
  app: AppWithRelations;
}

export function AppDetailsClient({ app }: AppDetailsClientProps) {
  const { selectedApps, toggleApp } = useSelectionStore();
  const isSelected = selectedApps.has(app.id);

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
        {/* Back Button - Use Link for better performance */}
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Apps
          </Link>
        </Button>

        {/* App Header */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            <Image
              src={app.iconUrl || '/fallback-app-icon.svg'}
              alt={app.displayName}
              width={96}
              height={96}
              className="w-24 h-24 rounded-lg shadow-md object-cover"
              onError={(e) => {
                e.currentTarget.src = '/fallback-app-icon.svg';
              }}
            />

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
            {/* Screenshots */}
            {(() => {
              const screenshots = app.packages
                .flatMap(pkg => {
                  const metadata = pkg.metadata as any;
                  return metadata?.screenshots || [];
                })
                .filter((url, index, self) => self.indexOf(url) === index);
              return screenshots.length > 0 ? (
                <ScreenshotsGallery screenshots={screenshots} appName={app.displayName} />
              ) : null;
            })()}

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
                <div className="space-y-4">
                  {app.packages.map((pkg) => {
                    const metadata = pkg.metadata as any;
                    const license = metadata?.license || null;
                    const releaseDate = metadata?.releaseDate || null;

                    return (
                      <div
                        key={pkg.id}
                        className="p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="font-mono">
                                {pkg.source.name}
                              </Badge>
                              {pkg.version && (
                                <span className="text-sm font-medium">
                                  v{pkg.version}
                                </span>
                              )}
                              {pkg.isAvailable ? (
                                <Badge variant="default" className="bg-green-600 gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Available
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Unavailable
                                </Badge>
                              )}
                            </div>

                            <div className="text-sm space-y-1">
                              <div>
                                <span className="text-muted-foreground">Identifier:</span>{' '}
                                <code className="bg-muted px-2 py-0.5 rounded text-xs">
                                  {pkg.identifier}
                                </code>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Package Details Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {pkg.size && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Download className="w-4 h-4" />
                              <span>{formatBytes(pkg.size)}</span>
                            </div>
                          )}
                          {pkg.maintainer && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="w-4 h-4" />
                              <span className="truncate" title={pkg.maintainer}>
                                {pkg.maintainer}
                              </span>
                            </div>
                          )}
                          {license && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="w-4 h-4" />
                              <span className="truncate" title={license}>
                                {license}
                              </span>
                            </div>
                          )}
                          {releaseDate && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              <span className="truncate" title={formatDate(releaseDate)}>
                                {formatDate(releaseDate)}
                              </span>
                            </div>
                          )}
                          {pkg.lastChecked && (
                            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                              <Clock className="w-4 h-4" />
                              <span>
                                Verified {formatRelativeTime(pkg.lastChecked)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/">Browse More Apps</Link>
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

                {(() => {
                  const totalSize = app.packages.reduce((sum, pkg) => sum + (pkg.size || 0), 0);
                  const avgSize = totalSize / app.packages.filter(p => p.size).length;
                  return avgSize > 0 ? (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground">Average Size:</span>
                        <p className="font-medium">{formatBytes(avgSize)}</p>
                      </div>
                    </>
                  ) : null;
                })()}

                {(() => {
                  const maintainers = app.packages
                    .map(p => p.maintainer)
                    .filter((m, i, arr) => m && arr.indexOf(m) === i);
                  return maintainers.length > 0 ? (
                    <>
                      <Separator />
                      <div>
                        <span className="text-muted-foreground">Maintainers:</span>
                        <div className="space-y-1 mt-1">
                          {maintainers.map((maintainer, i) => (
                            <p key={i} className="font-medium text-xs">
                              {maintainer}
                            </p>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
