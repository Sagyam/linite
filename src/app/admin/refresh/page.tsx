'use client';

import { useEffect, useState } from 'react';
import { Breadcrumb } from '@/components/admin/breadcrumb';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface RefreshLog {
  id: string;
  sourceId: string | null;
  status: string;
  packagesUpdated: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

export default function RefreshPage() {
  const [logs, setLogs] = useState<RefreshLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/refresh/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast.error('Failed to fetch refresh logs');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    toast.info('Starting package refresh...');

    try {
      const response = await fetch('/api/refresh', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Refresh completed: ${result.packagesUpdated} packages updated`);
        fetchLogs();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Refresh failed');
      }
    } catch (error) {
      console.error('Refresh failed:', error);
      toast.error('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      case 'running':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Refresh' }]} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Package Refresh</h1>
          <p className="text-gray-500 mt-2">
            Manage automatic package metadata updates
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Now'}
        </Button>
      </div>

      <div className="grid gap-4 mb-6">
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Automatic Refresh</AlertTitle>
          <AlertDescription>
            Package metadata is automatically refreshed every 24 hours via Vercel Cron.
            You can also trigger a manual refresh using the button above.
          </AlertDescription>
        </Alert>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Refresh History</CardTitle>
          <CardDescription>
            Recent package metadata refresh operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No refresh logs available
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Started At</TableHead>
                    <TableHead>Completed At</TableHead>
                    <TableHead>Packages Updated</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(log.startedAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.completedAt
                          ? new Date(log.completedAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell>{log.packagesUpdated}</TableCell>
                      <TableCell>
                        {log.errorMessage ? (
                          <span className="text-xs text-red-600 line-clamp-1">
                            {log.errorMessage}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Automatic Refresh</h3>
              <p className="text-sm text-gray-600">
                A Vercel Cron job runs every 24 hours to update package metadata from
                external APIs (Flathub, Snapcraft, Repology, AUR). This ensures package
                versions and availability information stays up-to-date.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Manual Refresh</h3>
              <p className="text-sm text-gray-600">
                You can trigger a manual refresh at any time using the "Refresh Now"
                button above. This is useful after adding new packages or when you need
                immediate updates.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What Gets Updated</h3>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Package version information</li>
                <li>Package availability status</li>
                <li>Package size (when available)</li>
                <li>Maintainer information</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
