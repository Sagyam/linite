'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

interface IconUploadProps {
  iconUrl: string | null | undefined;
  onIconChange: (url: string) => void;
  label?: string;
  pathPrefix: string; // e.g., 'app-icons' or 'distro-icons'
}

export function IconUpload({ iconUrl, onIconChange, label = 'Icon', pathPrefix }: IconUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pathname', `${pathPrefix}/${file.name}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onIconChange(data.url);
        toast.success('Icon uploaded successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to upload icon');
      }
    } catch (error) {
      console.error('Failed to upload icon:', error);
      toast.error('Failed to upload icon');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveIcon = async () => {
    if (!iconUrl) return;

    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: iconUrl }),
      });

      if (response.ok) {
        onIconChange('');
        toast.success('Icon removed successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove icon');
      }
    } catch (error) {
      console.error('Failed to remove icon:', error);
      toast.error('Failed to remove icon');
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        {iconUrl ? (
          <div className="relative">
            <Image
              src={iconUrl}
              alt={label}
              width={64}
              height={64}
              className="rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={handleRemoveIcon}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
            <Upload className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1">
          <Input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
            onChange={handleFileUpload}
            disabled={uploading}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPEG, WebP, or SVG (max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}