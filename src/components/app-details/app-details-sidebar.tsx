'use client';

import Link from 'next/link';
import { Package, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatBytes } from '@/lib/format';
import type { AppWithRelations } from '@/types';
import type { AppMetadata } from '@/hooks/use-app-metadata';

interface AppDetailsSidebarProps {
  app: AppWithRelations;
  metadata: AppMetadata;
  isSelected: boolean;
  onToggleSelection: () => void;
}

export function AppDetailsSidebar({
  app,
  metadata,
  isSelected,
  onToggleSelection,
}: AppDetailsSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <Button
            onClick={onToggleSelection}
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

          {app.packages.some((p) => p.version) && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">Latest Version:</span>
                <p className="font-medium">
                  {app.packages.find((p) => p.version)?.version || 'Unknown'}
                </p>
              </div>
            </>
          )}

          {metadata.averageSize > 0 && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">Average Size:</span>
                <p className="font-medium">{formatBytes(metadata.averageSize)}</p>
              </div>
            </>
          )}

          {metadata.maintainers.length > 0 && (
            <>
              <Separator />
              <div>
                <span className="text-muted-foreground">Maintainers:</span>
                <div className="space-y-1 mt-1">
                  {metadata.maintainers.map((maintainer, i) => (
                    <p key={i} className="font-medium text-xs">
                      {maintainer}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
