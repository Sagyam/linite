'use client';

import { useMemo, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/apps/app-card';
import { useApps } from '@/hooks/use-apps';
import { useDebounce } from '@/hooks/use-debounce';
import { useSelectionStore } from '@/stores/selection-store';
import { TIMEOUTS, INTERSECTION_OBSERVER, PAGINATION } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Category, AppWithRelations } from '@/types';

interface AppGridProps {
  categories: Category[];
  initialApps?: AppWithRelations[];
  totalApps?: number;
  selectedCategory: string;
  searchQuery: string;
  showPopular: boolean;
  scrollAreaViewportRef?: React.RefObject<HTMLDivElement | null>;
  apps?: AppWithRelations[];
  totalCount?: number;
  isLoading?: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  fetchNextPage?: () => void;
}

export function AppGrid({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  categories: _categories,
  initialApps,
  totalApps,
  selectedCategory,
  searchQuery,
  showPopular,
  scrollAreaViewportRef,
  apps: appsProp,
  totalCount: totalCountProp,
  isLoading: isLoadingProp,
  isError: isErrorProp,
  hasNextPage: hasNextPageProp,
  isFetchingNextPage: isFetchingNextPageProp,
  fetchNextPage: fetchNextPageProp,
}: AppGridProps) {
  // Get viewMode and focusedIndex from Zustand store
  const viewMode = useSelectionStore((state) => state.viewMode);
  const focusedAppIndex = useSelectionStore((state) => state.focusedAppIndex);

  // Debounce search and category to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, TIMEOUTS.DEBOUNCE_SEARCH);
  const debouncedCategory = useDebounce(selectedCategory, 150); // Shorter delay for better UX

  // Infinite scroll observer ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Prepare initial data for React Query (only for default filters)
  const hasFiltersApplied = debouncedCategory !== 'all' || showPopular || debouncedSearch;
  const initialData = useMemo(() => {
    if (!initialApps || hasFiltersApplied) return undefined;

    return {
      pages: [
        {
          apps: initialApps,
          pagination: {
            total: totalApps ?? initialApps.length,
            limit: PAGINATION.DEFAULT_LIMIT,
            offset: 0,
            hasMore: (totalApps ?? 0) > PAGINATION.DEFAULT_LIMIT,
          },
        },
      ],
      pageParams: [0],
    };
  }, [initialApps, totalApps, hasFiltersApplied]);

  // Determine if we should use props or fetch data internally
  const useProps = appsProp !== undefined;

  // Fetch apps with pagination (only if not provided via props)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useApps(
    useProps ? undefined : {
      category: debouncedCategory === 'all' ? undefined : debouncedCategory,
      popular: showPopular || undefined,
      search: debouncedSearch || undefined,
    },
    useProps ? undefined : initialData
  );

  // Flatten all pages into single array
  const apps = useMemo(() => {
    return useProps ? (appsProp ?? []) : (data?.pages.flatMap((page) => page.apps) ?? []);
  }, [useProps, appsProp, data]);

  // Total count from first page
  const totalCount = useMemo(() => {
    if (useProps) {
      return totalCountProp ?? apps.length;
    }
    return data?.pages[0]?.pagination.total ?? 0;
  }, [useProps, totalCountProp, apps, data]);

  // Intersection observer callback with stable reference to latest fetchNextPage
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const hasMore = useProps ? (hasNextPageProp ?? false) : (hasNextPage ?? false);
    const isFetching = useProps ? (isFetchingNextPageProp ?? false) : (isFetchingNextPage ?? false);
    const fetchFn = useProps ? fetchNextPageProp : fetchNextPage;

    if (entry.isIntersecting && hasMore && !isFetching && fetchFn) {
      fetchFn();
    }
  }, [useProps, hasNextPage, isFetchingNextPage, hasNextPageProp, isFetchingNextPageProp, fetchNextPage, fetchNextPageProp]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: INTERSECTION_OBSERVER.THRESHOLD,
      root: scrollAreaViewportRef?.current ?? null,
      rootMargin: '100px',
    });

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [handleIntersection, scrollAreaViewportRef]);

  return (
    <div className="space-y-6">
      {/* Keyboard hints for desktop */}
      <div className="hidden lg:flex items-center justify-end gap-4 px-2 py-1.5 bg-muted/30 rounded-md border border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Navigate:</span>
          <kbd className="px-1.5 py-0.5 font-mono font-semibold bg-background border border-border/50 rounded">
            j
          </kbd>
          <kbd className="px-1.5 py-0.5 font-mono font-semibold bg-background border border-border/50 rounded">
            k
          </kbd>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Select:</span>
          <kbd className="px-1.5 py-0.5 font-mono font-semibold bg-background border border-border/50 rounded">
            Space
          </kbd>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>View:</span>
          <kbd className="px-1.5 py-0.5 font-mono font-semibold bg-background border border-border/50 rounded">
            Tab
          </kbd>
        </div>
      </div>

      {/* Loading State */}
      {(useProps ? isLoadingProp : isLoading) && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      )}

      {/* Error State */}
      {(useProps ? isErrorProp : isError) && (
        <div className="text-center py-12">
          <p className="text-destructive mb-2">Failed to load applications</p>
          <p className="text-sm text-muted-foreground">
            Please try again later or contact support
          </p>
        </div>
      )}

      {/* Apps Grid */}
      {!isLoading && !isError && (
        <>
          {apps.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No applications found. Try adjusting your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={cn(
                  'grid gap-3',
                  viewMode === 'minimal' && 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8',
                  viewMode === 'compact' && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
                  viewMode === 'detailed' && 'grid-cols-1 lg:grid-cols-2'
                )}
              >
                {apps.map((app, index) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    layout={viewMode}
                    index={index}
                    isFocused={focusedAppIndex === index}
                  />
                ))}
              </div>

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="py-8 text-center">
                {(useProps ? isFetchingNextPageProp : isFetchingNextPage) ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading more apps...
                    </span>
                  </div>
                ) : (useProps ? hasNextPageProp : hasNextPage) ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const fetchFn = useProps ? fetchNextPageProp : fetchNextPage;
                      if (fetchFn) fetchFn();
                    }}
                    className="gap-2"
                  >
                    Load More Apps
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Showing {apps.length} of {totalCount} apps
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
