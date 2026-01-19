'use client';

import { memo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { useSelectionStore } from '@/stores/selection-store';
import type { ViewMode } from '@/stores/selection-store';
import type { App } from '@/hooks/use-apps';

interface AppCardProps {
  app: App;
  layout?: ViewMode;
  index?: number;
  isFocused?: boolean;
}

export const AppCard = memo(function AppCard({
  app,
  layout = 'detailed',
  index,
  isFocused = false
}: AppCardProps) {
  // Optimize: Only subscribe to this specific app's selection state
  const isSelected = useSelectionStore((state) => state.selectedApps.has(app.id));
  const toggleApp = useSelectionStore((state) => state.toggleApp);

  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll focused card into view
  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isFocused]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on the info button
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    toggleApp(app.id);
  };

  // Minimal view
  if (layout === 'minimal') {
    return (
      <Card
        ref={cardRef}
        className={`p-2 sm:p-3 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        } ${isFocused ? 'ring-2 ring-ring' : ''}`}
        onClick={handleCardClick}
        data-app-index={index}
        tabIndex={isFocused ? 0 : -1}
      >
        <div className="flex flex-col items-center gap-1.5 sm:gap-2 relative">
          <Checkbox
            checked={isSelected}
            className="absolute top-0 right-0 h-4 w-4 sm:h-5 sm:w-5"
            aria-label={`Select ${app.displayName}`}
          />
          <AppIcon
            iconUrl={app.iconUrl}
            displayName={app.displayName}
            size="lg"
            className="w-12 h-12 sm:w-14 sm:h-14 mt-1"
          />
          <h3 className="text-xs font-medium text-center line-clamp-2 w-full px-1">
            {app.displayName}
          </h3>
        </div>
      </Card>
    );
  }

  if (layout === 'compact') {
    return (
      <Card
        ref={cardRef}
        className={`p-2 sm:p-3 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary' : ''
        } ${isFocused ? 'ring-2 ring-ring' : ''}`}
        onClick={handleCardClick}
        data-app-index={index}
        tabIndex={isFocused ? 0 : -1}
      >
        <div className="flex items-center gap-2">
          <Checkbox checked={isSelected} className="shrink-0" />

          <AppIcon
            iconUrl={app.iconUrl}
            displayName={app.displayName}
            size="sm"
            className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-xs sm:text-sm truncate">{app.displayName}</h3>
              <div className="flex gap-1 shrink-0">
                {app.isFoss && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 hidden sm:inline-flex">
                    FOSS
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
              <span className="text-xs text-muted-foreground">
                {app.packages.length} source{app.packages.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <Link href={`/apps/${app.slug}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
              <Info className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Detailed view
  return (
    <Card
      ref={cardRef}
      className={`p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      } ${isFocused ? 'ring-2 ring-ring' : ''}`}
      onClick={handleCardClick}
      data-app-index={index}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="shrink-0 flex items-start gap-2">
          <Checkbox checked={isSelected} className="mt-1" />
          <AppIcon
            iconUrl={app.iconUrl}
            displayName={app.displayName}
            size="lg"
            rounded="lg"
            className="w-12 h-12 sm:w-16 sm:h-16"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1 sm:mb-2">
            <h3 className="font-semibold text-sm sm:text-base">{app.displayName}</h3>
            <div className="flex gap-1 shrink-0">
              {app.isFoss && (
                <Badge variant="secondary" className="text-xs">
                  FOSS
                </Badge>
              )}
              {app.isPopular && (
                <Badge variant="default" className="text-xs hidden sm:inline-flex">
                  Popular
                </Badge>
              )}
            </div>
          </div>

          {app.description && (
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 sm:line-clamp-3">
              {app.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex flex-wrap gap-1 overflow-hidden">
              {app.packages.slice(0, 6).map((pkg) => (
                <Badge key={pkg.id} variant="outline" className="text-xs">
                  {pkg.source.name}
                </Badge>
              ))}
              {app.packages.length > 6 && (
                <Badge variant="outline" className="text-xs">
                  +{app.packages.length - 6}
                </Badge>
              )}
            </div>

            <Link href={`/apps/${app.slug}`} onClick={(e) => e.stopPropagation()}>
              <Button variant="outline" size="sm" className="gap-1 h-8 text-xs sm:text-sm w-full sm:w-auto">
                <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
});
