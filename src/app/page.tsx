import { categoriesRepository, distrosRepository, appsRepository } from '@/repositories';
import { HomePageClient } from '@/components/home-page-client';
import { PAGINATION } from '@/lib/constants';

// Revalidate every hour (data doesn't change frequently)
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch data on the server (including first page of apps for instant load)
  const [categories, distros, initialApps] = await Promise.all([
    categoriesRepository.findAllOrdered(),
    distrosRepository.findAllWithSourcesNormalized(),
    appsRepository.findWithFilters({
      limit: PAGINATION.DEFAULT_LIMIT,
      offset: 0,
    }),
  ]);

  // Get total count for pagination
  const totalApps = await appsRepository.count();

  return (
    <HomePageClient
      categories={categories}
      distros={distros}
      initialApps={initialApps}
      totalApps={totalApps}
    />
  );
}
