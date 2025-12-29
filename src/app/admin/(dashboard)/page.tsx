import { db } from '@/db';
import { apps, packages, distros, categories, sources, refreshLogs } from '@/db/schema';
import { StatsCard } from '@/components/admin/stats-card';
import { AppWindow, Package, HardDrive, Layers, Server, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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
    recentRefreshLogs,
    availablePackages,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(apps),
    db.select({ count: sql<number>`count(*)` }).from(packages),
    db.select({ count: sql<number>`count(*)` }).from(distros),
    db.select({ count: sql<number>`count(*)` }).from(categories),
    db.select({ count: sql<number>`count(*)` }).from(sources),
    db.select().from(refreshLogs).orderBy(sql`${refreshLogs.startedAt} DESC`).limit(5),
    db.select({ count: sql<number>`count(*)` }).from(packages).where(sql`${packages.isAvailable} = 1`),
  ]);

  return {
    totalApps: totalApps[0]?.count ?? 0,
    totalPackages: totalPackages[0]?.count ?? 0,
    totalDistros: totalDistros[0]?.count ?? 0,
    totalCategories: totalCategories[0]?.count ?? 0,
    totalSources: totalSources[0]?.count ?? 0,
    availablePackages: availablePackages[0]?.count ?? 0,
    recentRefreshLogs,
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
        <StatsCard
          title="Last Refresh"
          value={stats.recentRefreshLogs.length > 0 ? 'Recent' : 'Never'}
          description={stats.recentRefreshLogs.length > 0
            ? new Date(stats.recentRefreshLogs[0].startedAt).toLocaleDateString()
            : 'No refresh logs'}
          icon={RefreshCw}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
            <Link href="/admin/refresh">
              <Button className="w-full" variant="outline">
                Refresh Package Data
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Refresh Logs</CardTitle>
            <CardDescription>Latest package refresh activity</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentRefreshLogs.length === 0 ? (
              <p className="text-sm text-gray-500">No refresh logs available</p>
            ) : (
              <div className="space-y-3">
                {stats.recentRefreshLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                      <span className="text-gray-600">
                        {new Date(log.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-gray-500">{log.packagesUpdated} updated</span>
                  </div>
                ))}
                <Link href="/admin/refresh">
                  <Button variant="link" className="w-full p-0">
                    View all logs →
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
