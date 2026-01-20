import { InstallationHistoryTable } from '@/components/installation-history-table';

export default function InstallationsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Installations</h1>
          <p className="text-muted-foreground mt-2">
            Track your app installations across multiple devices
          </p>
        </div>
      </div>

      <InstallationHistoryTable />
    </div>
  );
}
