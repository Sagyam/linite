import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { MyCollectionsClient } from './my-collections-client';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Collections</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your app collections
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/collections/new">
            <Plus className="w-5 h-5 mr-2" />
            New Collection
          </Link>
        </Button>
      </div>

      <MyCollectionsClient />
    </div>
  );
}
