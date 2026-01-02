import { HomePageClient } from '@/components/home-page-client';

// Force dynamic rendering - Suspense + client-side data fetching
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <HomePageClient />;
}
