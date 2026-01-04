'use client';

import {
  Package,
  CheckCircle,
  XCircle,
  Download,
  User,
  FileText,
  Calendar,
  Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBytes, formatRelativeTime, formatDate } from '@/lib/format';
import { parsePackageMetadata } from '@/lib/package-metadata';
import type { AppWithRelations } from '@/types';

interface AppPackagesListProps {
  app: AppWithRelations;
}

export function AppPackagesList({ app }: AppPackagesListProps) {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" />
        Available Packages ({app.packages.length})
      </h2>

      {app.packages.length === 0 ? (
        <p className="text-muted-foreground">
          No packages available for this app
        </p>
      ) : (
        <div className="space-y-4">
          {app.packages.map((pkg) => {
            const metadata = parsePackageMetadata(pkg.metadata);
            const license = metadata.license || null;
            const releaseDate = metadata.releaseDate || null;

            return (
              <div key={pkg.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="font-mono">
                        {pkg.source.name}
                      </Badge>
                      {pkg.version && (
                        <span className="text-sm font-medium">
                          v{pkg.version}
                        </span>
                      )}
                      {pkg.isAvailable ? (
                        <Badge variant="default" className="bg-green-600 gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="w-3 h-3" />
                          Unavailable
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-muted-foreground">
                          Identifier:
                        </span>{' '}
                        <code className="bg-muted px-2 py-0.5 rounded text-xs">
                          {pkg.identifier}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Package Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {pkg.size && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Download className="w-4 h-4" />
                      <span>{formatBytes(pkg.size)}</span>
                    </div>
                  )}
                  {pkg.maintainer && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span className="truncate" title={pkg.maintainer}>
                        {pkg.maintainer}
                      </span>
                    </div>
                  )}
                  {license && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="w-4 h-4" />
                      <span className="truncate" title={license}>
                        {license}
                      </span>
                    </div>
                  )}
                  {releaseDate && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span className="truncate" title={formatDate(releaseDate)}>
                        {formatDate(releaseDate)}
                      </span>
                    </div>
                  )}
                  {pkg.lastChecked && (
                    <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                      <Clock className="w-4 h-4" />
                      <span>Verified {formatRelativeTime(pkg.lastChecked)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
