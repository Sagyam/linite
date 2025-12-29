'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useSelectionStore } from '@/stores/selection-store';
import type { App } from '@/hooks/use-apps';

interface AppCardProps {
  app: App;
}

export function AppCard({ app }: AppCardProps) {
  const { selectedApps, toggleApp } = useSelectionStore();
  const isSelected = selectedApps.has(app.id);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on the info button
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    toggleApp(app.id);
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Checkbox checked={isSelected} className="mt-1" />
        </div>

        {app.iconUrl && (
          <img
            src={app.iconUrl}
            alt={app.displayName}
            className="w-12 h-12 rounded-md flex-shrink-0"
            onError={(e) => {
              // Hide broken images
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{app.displayName}</h3>
            <div className="flex gap-1 flex-shrink-0">
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
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {app.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex flex-wrap gap-1">
              {app.packages.slice(0, 3).map((pkg) => (
                <Badge key={pkg.id} variant="outline" className="text-xs">
                  {pkg.source.name}
                </Badge>
              ))}
              {app.packages.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{app.packages.length - 3}
                </Badge>
              )}
            </div>

            <Link href={`/apps/${app.slug}`} onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 gap-1 text-xs"
              >
                <Info className="w-3 h-3" />
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
