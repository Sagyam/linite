import { AppGridSkeleton, DistroSelectorSkeleton } from '@/components/ui/loading-skeletons';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header placeholder */}
      <div className="h-16 border-b" />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="h-12 bg-muted/20 rounded-lg w-96 mx-auto mb-4 animate-pulse" />
        <div className="h-6 bg-muted/20 rounded-lg w-2/3 mx-auto animate-pulse" />
      </div>

      {/* Distro Bar Skeleton */}
      <div className="border-b bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3">
          <DistroSelectorSkeleton />
        </div>
      </div>

      {/* App Grid Skeleton */}
      <div className="container mx-auto px-4 py-8 pb-24">
        <AppGridSkeleton />
      </div>
    </div>
  );
}
