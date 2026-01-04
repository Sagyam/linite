import { categoriesRepository, distrosRepository } from '@/repositories';
import { HomePageClient } from '@/components/home-page-client';

// Revalidate every hour (data doesn't change frequently)
export const revalidate = 3600;

export default async function HomePage() {
  // Fetch data on the server (only non-app data for faster initial load)
  const [categories, distros] = await Promise.all([
    categoriesRepository.findAllOrdered(),
    distrosRepository.findAllWithSourcesNormalized(),
  ]);

  return <HomePageClient categories={categories} distros={distros} />;
}
