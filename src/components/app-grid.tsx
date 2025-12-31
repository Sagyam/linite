'use client';

import { useState } from 'react';
import { Search, X, LayoutGrid, List, Grid3x3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorDisplay } from '@/components/error-display';
import { AppCard } from '@/components/app-card';
import { useApps } from '@/hooks/use-apps';
import { useCategories } from '@/hooks/use-categories';
import { getCategoryIcon } from '@/lib/category-icons';

type LayoutType = 'compact' | 'detailed';

export function AppGrid() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPopular, setShowPopular] = useState(false);
  const [layout, setLayout] = useState<LayoutType>('detailed');

  const { categories, loading: categoriesLoading } = useCategories();
  const { apps, loading: appsLoading, error } = useApps({
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    popular: showPopular || undefined,
    search: searchQuery || undefined,
  });

  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setShowPopular(false);
  };

  const hasFilters = selectedCategory !== 'all' || searchQuery || showPopular;

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to load apps"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

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
        {!categoriesLoading && categories.length > 0 && (
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

      {/* Apps Grid */}
      <ScrollArea className="h-[calc(100vh-28rem)]">
        {appsLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No applications found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pr-4">
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

            <div className="text-center text-sm text-muted-foreground pb-4">
              Showing {apps.length} {apps.length === 1 ? 'app' : 'apps'}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
