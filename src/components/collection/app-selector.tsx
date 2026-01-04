'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppIcon } from '@/components/ui/app-icon';
import { PAGINATION } from '@/lib/constants';
import { queryKeys } from '@/lib/query-keys';
import { apps as appsApi } from '@/lib/api-client';
import { Search, X, Plus, Check } from 'lucide-react';
import type { AppWithRelations } from '@/types/entities';

interface AppSelectorProps {
  selectedAppIds: string[];
  onAppToggle: (appId: string) => void;
}

export function AppSelector({ selectedAppIds, onAppToggle }: AppSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: appsResponse, isLoading } = useQuery({
    queryKey: queryKeys.apps.list({ search: searchQuery || undefined }),
    queryFn: () =>
      appsApi.getAll({
        search: searchQuery || undefined,
        limit: PAGINATION.SELECTION_LIMIT,
      }),
  });

  const apps = appsResponse?.apps || [];

  const selectedApps = apps.filter((app) => selectedAppIds.includes(app.id));
  const availableApps = apps.filter((app) => !selectedAppIds.includes(app.id));

  return (
    <div className="space-y-4">
      {/* Selected Apps */}
      {selectedApps.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Selected Apps ({selectedApps.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedApps.map((app) => (
              <Badge
                key={app.id}
                variant="secondary"
                className="pl-2 pr-1 py-1.5 gap-1"
              >
                <AppIcon
                  iconUrl={app.iconUrl}
                  displayName={app.displayName}
                  size={16}
                  className="w-4 h-4"
                />
                <span>{app.displayName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onAppToggle(app.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Available Apps */}
      <div className="border rounded-lg">
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Loading apps...
            </div>
          ) : availableApps.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {searchQuery ? 'No apps found' : 'All apps selected'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {availableApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => onAppToggle(app.id)}
                  className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <AppIcon
                    iconUrl={app.iconUrl}
                    displayName={app.displayName}
                    size="sm"
                    className="w-8 h-8"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{app.displayName}</p>
                    {app.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {app.description}
                      </p>
                    )}
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {selectedAppIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Maximum 100 apps per collection
        </p>
      )}
    </div>
  );
}
