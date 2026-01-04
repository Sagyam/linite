'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, LayoutGrid, List, Grid3x3, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppCard } from '@/components/app-card';
import { getCategoryIcon } from '@/lib/category-icons';
import { useApps } from '@/hooks/use-apps';
import { useDebounce } from '@/hooks/use-debounce';
import type { Category } from '@/types';

type LayoutType = 'compact' | 'detailed';

interface AppGridProps {
  categories: Category[];
}

export function AppGrid({ categories }: AppGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopular, setShowPopular] = useState(false);
  const [layout, setLayout] = useState<LayoutType>('detailed');

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Infinite scroll observer ref
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch apps with pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useApps({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    popular: showPopular || undefined,
    search: debouncedSearch || undefined,
  });

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
      { threshold: 0.1 }
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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setShowPopular(false);
  };

  const hasFilters = selectedCategory !== 'all' || searchQuery || showPopular;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            variant={showPopular ? 'default' : 'outline'}
            onClick={() => setShowPopular(!showPopular)}
          >
            Popular Apps
          </Button>

          {/* Layout Switcher */}
          <div className="flex border rounded-md">
            <Button
              variant={layout === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayout('compact')}
              className="rounded-r-none gap-1"
            >
              <List className="w-4 h-4" />
              Compact
            </Button>
            <Button
              variant={layout === 'detailed' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setLayout('detailed')}
              className="rounded-l-none gap-1"
            >
              <Grid3x3 className="w-4 h-4" />
              Detailed
            </Button>
          </div>

          {hasFilters && (
            <Button variant="ghost" onClick={handleClearFilters} className="gap-2">
              <X className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        {categories.length > 0 && (
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
              <TabsTrigger value="all">
                <LayoutGrid className="w-4 h-4" />
                All Apps
              </TabsTrigger>
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.icon);
                return (
                  <TabsTrigger key={category.id} value={category.id}>
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Active filters:</span>
          {selectedCategory !== 'all' && (
            <Badge variant="secondary">
              {categories.find((c) => c.id === selectedCategory)?.name}
            </Badge>
          )}
          {showPopular && <Badge variant="secondary">Popular</Badge>}
          {searchQuery && (
            <Badge variant="secondary">Search: {searchQuery}</Badge>
          )}
        </div>
      )}

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
                className={`grid gap-3 ${
                  layout === 'compact'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1 lg:grid-cols-2'
                }`}
              >
                {apps.map((app) => (
                  <AppCard key={app.id} app={app} layout={layout} />
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
