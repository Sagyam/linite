import { notFound } from 'next/navigation';
import { appsRepository } from '@/repositories';
import { AppDetailsClient } from '@/components/app-details-client';

// Revalidate every 24 hours (app details change rarely)
export const revalidate = 86400;

interface AppDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Generate static pages for all apps at build time
export async function generateStaticParams() {
  const apps = await appsRepository.findMany({});

  return apps.map((app) => ({
    slug: app.slug,
  }));
}

export default async function AppDetailPage({ params }: AppDetailPageProps) {
  // Await params (required in Next.js 15+)
  const { slug } = await params;

  // Fetch app data on the server
  const app = await appsRepository.findBySlug(slug);

  // If app not found, trigger Next.js 404
  if (!app) {
    notFound();
  }

  return <AppDetailsClient app={app} />;
}
