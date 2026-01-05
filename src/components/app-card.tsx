'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { useSelectionStore } from '@/stores/selection-store';
import type { App } from '@/hooks/use-apps';

interface AppCardProps {
  app: App;
  layout?: 'compact' | 'detailed';
}

export function AppCard({ app, layout = 'detailed' }: AppCardProps) {
  const { selectedApps, toggleApp } = useSelectionStore();
  const isSelected = selectedApps.has(app.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on the info button
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    toggleApp(app.id);
  };

  if (layout === 'compact') {
    return (
      <Card
        className={`p-3 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-2">
          <Checkbox checked={isSelected} />

          <AppIcon
            iconUrl={app.iconUrl}
            displayName={app.displayName}
            size="sm"
            className="w-8 h-8"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm truncate">{app.displayName}</h3>
              <div className="flex gap-1 shrink-0">
                {app.isFoss && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    FOSS
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {app.packages.length} source{app.packages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <Link href={`/apps/${app.slug}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Info className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Detailed view
  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <Checkbox checked={isSelected} className="mt-1" />
        </div>

        <AppIcon
          iconUrl={app.iconUrl}
          displayName={app.displayName}
          size="lg"
          rounded="lg"
          className="w-16 h-16"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-base">{app.displayName}</h3>
            <div className="flex gap-1 shrink-0">
              {app.isFoss && (
                <Badge variant="secondary" className="text-xs">
                  FOSS
                </Badge>
              )}
              {app.isPopular && (
                <Badge variant="default" className="text-xs">
                  Popular
                </Badge>
              )}
            </div>
          </div>

          {app.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {app.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {app.packages.map((pkg) => (
                <Badge key={pkg.id} variant="outline" className="text-xs">
                  {pkg.source.name}
                </Badge>
              ))}
            </div>

            <Link href={`/apps/${app.slug}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="gap-1">
                <Info className="w-4 h-4" />
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
