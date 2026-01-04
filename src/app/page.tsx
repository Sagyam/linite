import { db, distros } from '@/db';
import { desc } from 'drizzle-orm';
import { categoriesRepository } from '@/repositories';
import { HomePageClient } from '@/components/home-page-client';

// Revalidate every hour (data doesn't change frequently)
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch data on the server (only non-app data for faster initial load)
  const [categories, allDistros] = await Promise.all([
    // Fetch all categories
    categoriesRepository.findAllOrdered(),

    // Fetch all distros with sources
    db.query.distros.findMany({
      orderBy: [desc(distros.isPopular), desc(distros.name)],
      with: {
        distroSources: {
          with: {
            source: true,
          },
          orderBy: (ds, { desc }) => [desc(ds.priority)],
        },
      },
    }),
  ]);

  // Normalize distros data to match Distro interface
  const normalizedDistros = allDistros.map((distro) => ({
    id: distro.id,
    name: distro.name,
    slug: distro.slug,
    family: distro.family,
    iconUrl: distro.iconUrl,
    basedOn: distro.basedOn,
    isPopular: distro.isPopular ?? false,
    distroSources: distro.distroSources.map((ds) => ({
      sourceId: ds.sourceId,
      priority: ds.priority ?? 0,
      isDefault: ds.isDefault ?? false,
      source: {
        id: ds.source.id,
        name: ds.source.name,
        slug: ds.source.slug,
      },
    })),
  }));

  return (
    <HomePageClient
      categories={categories}
      distros={normalizedDistros}
    />
  );
}
