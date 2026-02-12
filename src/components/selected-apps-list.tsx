'use client';

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';

interface App {
  id: string;
  displayName: string;
  description?: string | null;
  iconUrl?: string | null;
  isFoss: boolean | null;
  packages: Array<{
    id: string;
    source: {
      name: string;
    };
  }>;
}

interface SelectedAppsListProps {
  apps: App[];
  onRemove: (appId: string) => void;
  variant?: 'default' | 'compact';
}

export function SelectedAppsList({ apps, onRemove, variant = 'default' }: SelectedAppsListProps) {
  const isCompact = variant === 'compact';

  const iconSize = isCompact ? 'w-10 h-10' : 'w-12 h-12';
  const textSize = isCompact ? 'text-sm' : 'text-base';
  const descriptionSize = isCompact ? 'text-xs' : 'text-sm';
  const maxPackageBadges = isCompact ? 2 : 3;

  return (
    <div className="space-y-2">
      {apps.map((app) => (
        <div
          key={app.id}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
        >
          <AppIcon
            iconUrl={app.iconUrl ?? null}
            displayName={app.displayName}
            size="md"
            className={iconSize}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={`font-medium ${textSize}`}>{app.displayName}</h4>
                {app.description && (
                  <p className={`${descriptionSize} text-muted-foreground ${isCompact ? 'line-clamp-1 mt-0.5' : 'line-clamp-2 mt-1'}`}>
                    {app.description}
                  </p>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(app.id)}
                className={isCompact ? 'h-8 w-8 p-0 flex-shrink-0' : 'shrink-0'}
              >
                <Trash2 className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {app.isFoss && (
                <Badge variant="secondary" className="text-xs">
                  FOSS
                </Badge>
              )}
              {app.packages.slice(0, maxPackageBadges).map((pkg) => (
                <Badge key={pkg.id} variant="outline" className="text-xs">
                  {pkg.source.name}
                </Badge>
              ))}
              {app.packages.length > maxPackageBadges && (
                <Badge variant="outline" className="text-xs">
                  +{app.packages.length - maxPackageBadges}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
