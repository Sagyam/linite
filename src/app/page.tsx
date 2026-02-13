import { categoriesRepository, distrosRepository, appsRepository } from '@/repositories';
import { HomePageClient } from '@/components/home-page-client';
import { PAGINATION } from '@/lib/constants';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Revalidate every hour (data doesn't change frequently)
export const revalidate = 3600;

export default async function HomePage() {
  // Get headers first (must be called once)
  const headersList = await headers();

  // Fetch data on the server
  const [categories, distros, initialApps, session] = await Promise.all([
    categoriesRepository.findAllOrdered(),
    distrosRepository.findAllWithSourcesNormalized(),
    appsRepository.findWithFilters({
      limit: PAGINATION.DEFAULT_LIMIT,
      offset: 0,
    }),
    auth.api.getSession({ headers: headersList }),
  ]);

  // Get total count for pagination
  const totalApps = await appsRepository.count();

  return (
    <HomePageClient
      categories={categories}
      distros={distros}
      initialApps={initialApps}
      totalApps={totalApps}
      isAuthenticated={!!session}
    />
  );
}
