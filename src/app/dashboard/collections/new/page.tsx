import { CollectionForm } from '@/components/collection/collection-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewCollectionPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Collection</h1>
          <p className="text-muted-foreground mt-1">
            Build your custom app collection
          </p>
        </div>
      </div>

      <CollectionForm mode="create" />
    </div>
  );
}
