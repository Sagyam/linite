'use client';

import { memo, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { AppIcon } from '@/components/ui/app-icon';
import { useSelectionStore } from '@/stores/selection-store';
import { cn } from '@/lib/utils';
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
    // Don't toggle if clicking on the homepage link
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    toggleApp(app.id, app.categoryId);
  };

  // One look for every layout: a hairline card, primary ring and tint when picked, outline when focused by keyboard.
  const cardClass = cn(
    'cursor-pointer rounded-xl border border-edge/10 bg-card shadow-xs transition-all hover:border-edge/20 hover:shadow-md',
    isSelected && 'border-primary/40 bg-primary/[0.04] ring-2 ring-primary/60',
    isFocused && 'outline-2 outline-offset-2 outline-ring'
  );

  // Minimal view
  if (layout === 'minimal') {
    return (
      <div
        ref={cardRef}
        className={cn(cardClass, 'p-2 sm:p-3 hover:-translate-y-0.5')}
        onClick={handleCardClick}
        data-app-index={index}
        tabIndex={isFocused ? 0 : -1}
      >
        <div className="group flex flex-col items-center gap-1.5 sm:gap-2 relative">
          <div className="absolute top-0 right-0 z-10">
            <Checkbox
              checked={isSelected}
              className={cn('size-4 transition-opacity', !isSelected && 'opacity-50 group-hover:opacity-100')}
              aria-label={`Select ${app.displayName}`}
            />
          </div>
          <AppIcon
            iconUrl={app.iconUrl}
            displayName={app.displayName}
            size="lg"
            className="w-12 h-12 sm:w-14 sm:h-14"
          />
          <h3 className="text-xs font-medium text-center line-clamp-2 w-full px-1 leading-snug">
            {app.displayName}
          </h3>
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <Card
        ref={cardRef}
        className={cn(cardClass, 'p-2 sm:p-3')}
        onClick={handleCardClick}
        data-app-index={index}
        tabIndex={isFocused ? 0 : -1}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            className="shrink-0"
          />

          <AppIcon
            iconUrl={app.iconUrl}
            displayName={app.displayName}
            size="sm"
            className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-xs sm:text-sm truncate">{app.displayName}</h3>
              <div className="flex gap-1 shrink-0">
                {app.isFoss && (
                  <Badge variant="outline" className="px-1.5 py-0 hidden sm:inline-flex">
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

          {app.homepage && (
            <a
              href={app.homepage}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="sm" className="size-8 p-0 shrink-0 text-muted-foreground" aria-label={`${app.displayName} website`}>
                <ExternalLink className="size-3.5" />
              </Button>
            </a>
          )}
        </div>
      </Card>
    );
  }

  // Detailed view
  return (
    <Card
      ref={cardRef}
      className={cn(cardClass, 'p-3 sm:p-4')}
      onClick={handleCardClick}
      data-app-index={index}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="shrink-0 flex items-start gap-2">
          <Checkbox
            checked={isSelected}
            className="mt-1"
          />
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
            <h3 className="font-heading font-semibold text-sm sm:text-base">{app.displayName}</h3>
            <div className="flex gap-1 shrink-0">
              {app.isFoss && (
                <Badge variant="outline">
                  FOSS
                </Badge>
              )}
              {app.isPopular && (
                <Badge variant="outline" className="hidden sm:inline-flex border-amber/30 text-amber">
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
                <Badge key={pkg.id} variant="secondary" className="font-mono text-[11px]">
                  {pkg.source.name}
                </Badge>
              ))}
              {app.packages.length > 6 && (
                <Badge variant="secondary" className="font-mono text-[11px]">
                  +{app.packages.length - 6}
                </Badge>
              )}
            </div>

            {app.homepage && (
              <a
                href={app.homepage}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full sm:w-auto">
                  <ExternalLink className="size-3.5" />
                  Website
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
});
