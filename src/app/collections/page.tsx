'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CollectionCard } from '@/components/collection/collection-card';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
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
      <section className="relative isolate overflow-hidden">
        <div className="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-10 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-edge/10 bg-edge/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-amber" />
            Start from someone else&apos;s setup
          </p>
          <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Discover <span className="text-primary">collections</span>
          </h1>
          <p className="mt-4 text-lg text-pretty text-muted-foreground">
            Curated app lists for developers, creators and gamers. Open one, tweak it, install it in one command.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="space-y-8">
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
