'use client';

import { useQuery } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Laptop } from 'lucide-react';

interface DeviceFilterProps {
  selectedDevice: string | null;
  onDeviceChange: (device: string | null) => void;
}

async function fetchUserDevices(): Promise<string[]> {
  const response = await fetch('/api/installations/devices');

  if (!response.ok) {
    throw new Error('Failed to fetch devices');
  }

  const data = await response.json();
  return data.devices || [];
}

export function DeviceFilter({ selectedDevice, onDeviceChange }: DeviceFilterProps) {
  const { data: devices, isLoading } = useQuery({
    queryKey: ['user-devices'],
    queryFn: fetchUserDevices,
  });

  return (
    <div className="flex items-center space-x-2">
      <Laptop className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col space-y-1">
        <Label htmlFor="device-filter" className="text-sm font-medium">
          Device
        </Label>
        <Select
          value={selectedDevice || 'all'}
          onValueChange={(value) =>
            onDeviceChange(value === 'all' ? null : value)
          }
          disabled={isLoading}
        >
          <SelectTrigger id="device-filter" className="w-[200px]">
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </span>
            ) : (
              <SelectValue placeholder="All devices" />
            )}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All devices</SelectItem>
            {devices?.map((device) => (
              <SelectItem key={device} value={device}>
                {device}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
