'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CollectionCard } from '@/components/collection/collection-card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Search, Star, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import type { CollectionWithRelations } from '@/types/entities';

async function fetchPublicCollections(params: {
  featured?: boolean;
  search?: string;
}): Promise<{ collections: CollectionWithRelations[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params.featured) searchParams.set('featured', 'true');
  if (params.search) searchParams.set('search', params.search);
  searchParams.set('limit', '50');

  const response = await fetch(`/api/collections?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch collections');
  return response.json();
}

export default function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['public-collections', showFeaturedOnly, searchQuery],
    queryFn: () => fetchPublicCollections({ featured: showFeaturedOnly || undefined, search: searchQuery || undefined }),
  });

  const collections = data?.collections || [];
  const total = data?.total || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto py-16 px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Discover Collections
            </h1>
            <p className="text-xl text-muted-foreground">
              Browse community-curated app collections for Linux
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={showFeaturedOnly ? 'default' : 'outline'}
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className="gap-2"
            >
              <Star className={`w-4 h-4 ${showFeaturedOnly ? 'fill-current' : ''}`} />
              Featured
            </Button>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-6 mb-6">
                <Package className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">No collections found</h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Be the first to create a public collection!'}
              </p>
              <Button asChild>
                <Link href="/login">Create a Collection</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {total} {total === 1 ? 'collection' : 'collections'} found
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    showAuthor={true}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
