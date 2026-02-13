'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SelectedAppsList } from '@/components/selection/selected-apps-list';
import { queryKeys } from '@/lib/query-keys';
import { apps as appsApi } from '@/lib/api-client';
import { useSelectionStore } from '@/stores/selection-store';

export function SelectionSummary() {
  const { selectedApps, selectedDistro, clearApps, deselectApp } =
    useSelectionStore();

  // Fetch only selected apps by their IDs (efficient batch fetch)
  const selectedAppIds = Array.from(selectedApps);
  const { data: selectedAppsList = [] } = useQuery({
    queryKey: queryKeys.apps.byIds(selectedAppIds),
    queryFn: () => appsApi.getByIds(selectedAppIds),
    enabled: selectedApps.size > 0,
  });

  if (selectedApps.size === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No apps selected</p>
          <p className="text-sm mt-1">
            Select apps from the grid to add them to your installation list
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              Selected Apps
            </h3>
            <p className="text-sm text-muted-foreground">
              {selectedApps.size} {selectedApps.size === 1 ? 'app' : 'apps'} ready to
              install
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={clearApps}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </Button>
        </div>

        <Separator />

        {/* Selected Apps List */}
        <div className="max-h-[400px] overflow-y-auto">
          <SelectedAppsList
            apps={selectedAppsList}
            onRemove={deselectApp}
            variant="compact"
          />
        </div>

        {!selectedDistro && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-sm text-amber-700 dark:text-amber-400">
            Select a distribution above to generate the install command
          </div>
        )}
      </div>
    </Card>
  );
}
