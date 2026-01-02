import { Skeleton } from './skeleton';
import { Card, CardContent, CardHeader } from './card';

/**
 * Skeleton for app cards in the grid
 */
export function AppCardSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Icon skeleton */}
          <Skeleton className="h-10 w-10 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            {/* App name skeleton */}
            <Skeleton className="h-5 w-3/4" />
            {/* Category skeleton */}
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        {/* Button skeleton */}
        <Skeleton className="h-9 w-full mt-auto" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for app grid - shows multiple app cards
 */
export function AppGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AppCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton for distro selector dropdown
 */
export function DistroSelectorSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

/**
 * Skeleton for command output card
 */
export function CommandOutputSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full rounded-md" />
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton for data table rows
 */
export function DataTableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3 border-b">
      <Skeleton className="h-4 w-4" /> {/* Checkbox */}
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-16" /> {/* Actions */}
    </div>
  );
}

/**
 * Skeleton for entire data table
 */
export function DataTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-64" /> {/* Search */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Table header */}
      <div className="border rounded-md">
        <div className="flex items-center gap-4 p-3 border-b bg-muted/50">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <DataTableRowSkeleton key={i} />
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

/**
 * Simple text with spinner skeleton
 */
export function InlineLoadingSkeleton({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-4 rounded-full" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

/**
 * Centered loading skeleton for full-page loading
 */
export function CenteredLoadingSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      {children || (
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      )}
    </div>
  );
}
