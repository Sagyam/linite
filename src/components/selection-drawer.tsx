'use client';

import Image from 'next/image';
import { Package2, Trash2, X } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSelectionStore } from '@/stores/selection-store';
import type { AppWithRelations } from '@/types';

interface SelectionDrawerProps {
  apps: AppWithRelations[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelectionDrawer({ apps, open, onOpenChange }: SelectionDrawerProps) {
  const { selectedApps, clearApps, deselectApp } = useSelectionStore();

  const selectedAppsList = apps.filter((app) => selectedApps.has(app.id));

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader>
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="flex items-center gap-2">
                  <Package2 className="w-5 h-5" />
                  Your Selection
                </DrawerTitle>
                <DrawerDescription>
                  {selectedApps.size}{' '}
                  {selectedApps.size === 1 ? 'app' : 'apps'} ready to install
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          <div className="px-4 pb-8 overflow-y-auto max-h-[60vh]">
            <div className="space-y-6">
              {/* Selected Apps List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Selected Applications</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearApps}
                    className="gap-2"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </Button>
                </div>

                <div className="space-y-2">
                  {selectedAppsList.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {app.iconUrl && (
                        <Image
                          src={app.iconUrl}
                          alt={app.displayName}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded flex-shrink-0 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium">{app.displayName}</h4>
                            {app.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {app.description}
                              </p>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deselectApp(app.id)}
                            className="flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {app.isFoss && (
                            <Badge variant="secondary" className="text-xs">
                              FOSS
                            </Badge>
                          )}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
