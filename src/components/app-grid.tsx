'use client';

import { useMemo, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppCard } from '@/components/app-card';
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
}

export function AppGrid({
  categories,
  initialApps,
  totalApps,
  selectedCategory,
  searchQuery,
  showPopular,
  scrollAreaViewportRef,
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

  // Fetch apps with pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useApps(
    {
      category: debouncedCategory === 'all' ? undefined : debouncedCategory,
      popular: showPopular || undefined,
      search: debouncedSearch || undefined,
    },
    initialData
  );

  // Flatten all pages into single array
  const apps = useMemo(() => {
    return data?.pages.flatMap((page) => page.apps) ?? [];
  }, [data]);

  // Total count from first page
  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        threshold: INTERSECTION_OBSERVER.THRESHOLD,
        root: scrollAreaViewportRef?.current ?? null,
        rootMargin: '100px',
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, scrollAreaViewportRef]);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
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
                {isFetchingNextPage ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading more apps...
                    </span>
                  </div>
                ) : hasNextPage ? (
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
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
