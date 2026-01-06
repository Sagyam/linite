'use client';

import { useQuery } from '@tanstack/react-query';
import { Package2, Trash2, X, Loader2 } from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { SelectedAppsList } from '@/components/selected-apps-list';
import { queryKeys } from '@/lib/query-keys';
import { apps as appsApi } from '@/lib/api-client';
import { useSelectionStore } from '@/stores/selection-store';

interface SelectionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SelectionDrawer({ open, onOpenChange }: SelectionDrawerProps) {
  // Optimize: Use selectors to subscribe only to needed state
  const selectedApps = useSelectionStore((state) => state.selectedApps);
  const clearApps = useSelectionStore((state) => state.clearApps);
  const deselectApp = useSelectionStore((state) => state.deselectApp);

  // Fetch only the selected apps by their IDs (efficient batch fetch)
  const selectedAppIds = Array.from(selectedApps);
  const { data: selectedAppsList = [], isLoading } = useQuery({
    queryKey: queryKeys.apps.byIds(selectedAppIds),
    queryFn: () => appsApi.getByIds(selectedAppIds),
    enabled: open && selectedApps.size > 0,
  });

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
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
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

                  <SelectedAppsList
                    apps={selectedAppsList}
                    onRemove={deselectApp}
                    variant="default"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
