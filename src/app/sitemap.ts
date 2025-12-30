import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Fetch dynamic app routes
  let appRoutes: MetadataRoute.Sitemap = [];
  try {
    const response = await fetch(`${baseUrl}/api/apps`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (response.ok) {
      const apps = await response.json();
      appRoutes = apps.map((app: { slug: string; updatedAt: string }) => ({
        url: `${baseUrl}/apps/${app.slug}`,
        lastModified: new Date(app.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error('Error fetching apps for sitemap:', error);
  }

  return [...staticRoutes, ...appRoutes];
}
