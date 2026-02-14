import { db } from '@/db';
import { apps, packages, distros, categories, sources } from '@/db/schema';
import { StatsCard } from '@/components/admin/stats-card';
import { AppWindow, Package, HardDrive, Layers, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getStats() {
  const [
    totalApps,
    totalPackages,
    totalDistros,
    totalCategories,
    totalSources,
    availablePackages,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(apps),
    db.select({ count: sql<number>`count(*)` }).from(packages),
    db.select({ count: sql<number>`count(*)` }).from(distros),
    db.select({ count: sql<number>`count(*)` }).from(categories),
    db.select({ count: sql<number>`count(*)` }).from(sources),
    db.select({ count: sql<number>`count(*)` }).from(packages).where(sql`${packages.isAvailable} = 1`),
  ]);

  return {
    totalApps: totalApps[0]?.count ?? 0,
    totalPackages: totalPackages[0]?.count ?? 0,
    totalDistros: totalDistros[0]?.count ?? 0,
    totalCategories: totalCategories[0]?.count ?? 0,
    totalSources: totalSources[0]?.count ?? 0,
    availablePackages: availablePackages[0]?.count ?? 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your Linite instance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatsCard
          title="Total Apps"
          value={stats.totalApps}
          description="Applications in catalog"
          icon={AppWindow}
        />
        <StatsCard
          title="Total Packages"
          value={stats.totalPackages}
          description={`${stats.availablePackages} available`}
          icon={Package}
        />
        <StatsCard
          title="Distributions"
          value={stats.totalDistros}
          description="Supported Linux distros"
          icon={HardDrive}
        />
        <StatsCard
          title="Categories"
          value={stats.totalCategories}
          description="App categories"
          icon={Layers}
        />
        <StatsCard
          title="Sources"
          value={stats.totalSources}
          description="Package sources"
          icon={Server}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common management tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href="/admin/apps/new">
            <Button className="w-full" variant="outline">
              Add New App
            </Button>
          </Link>
          <Link href="/admin/packages">
            <Button className="w-full" variant="outline">
              Manage Packages
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
