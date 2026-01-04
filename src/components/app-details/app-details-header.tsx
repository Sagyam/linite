'use client';

import { Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppIcon } from '@/components/ui/app-icon';
import type { AppWithRelations } from '@/types';

interface AppDetailsHeaderProps {
  app: AppWithRelations;
  isSelected: boolean;
  onToggleSelection: () => void;
}

export function AppDetailsHeader({
  app,
  isSelected,
  onToggleSelection,
}: AppDetailsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start gap-6">
        <AppIcon
          iconUrl={app.iconUrl}
          displayName={app.displayName}
          size={96}
          rounded="lg"
          className="w-24 h-24 shadow-md"
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
                {app.isPopular && <Badge variant="default">Popular</Badge>}
              </div>
            </div>

            <Button
              onClick={onToggleSelection}
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
  );
}
