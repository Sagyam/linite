'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface AppFormProps {
  appId?: string;
  onSuccess?: () => void;
}

export function AppForm({ appId, onSuccess }: AppFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    displayName: '',
    description: '',
    iconUrl: '',
    homepage: '',
    categoryId: '',
    isPopular: false,
    isFoss: false,
  });

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, []);

  const fetchApp = useCallback(async () => {
    if (!appId) return;
    try {
      const response = await fetch(`/api/apps/${appId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          slug: data.slug,
          displayName: data.displayName,
          description: data.description || '',
          iconUrl: data.iconUrl || '',
          homepage: data.homepage || '',
          categoryId: data.categoryId,
          isPopular: data.isPopular,
          isFoss: data.isFoss,
        });
      }
    } catch (error) {
      console.error('Failed to fetch app:', error);
      toast.error('Failed to load app');
    }
  }, [appId]);

  useEffect(() => {
    fetchCategories();
    fetchApp();
  }, [fetchCategories, fetchApp]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pathname', `app-icons/${file.name}`);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({ ...prev, iconUrl: data.url }));
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
    if (!formData.iconUrl) return;

    try {
      const response = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.iconUrl }),
      });

      if (response.ok) {
        setFormData((prev) => ({ ...prev, iconUrl: '' }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = appId ? `/api/apps/${appId}` : '/api/apps';
      const method = appId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          description: formData.description || null,
          iconUrl: formData.iconUrl || null,
          homepage: formData.homepage || null,
        }),
      });

      if (response.ok) {
        toast.success(`App ${appId ? 'updated' : 'created'} successfully`);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save app');
      }
    } catch (error) {
      console.error('Failed to save app:', error);
      toast.error('Failed to save app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>App Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                required
                placeholder="e.g., Firefox"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                placeholder="e.g., firefox"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of the app"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>App Icon</Label>
            <div className="flex items-center gap-4">
              {formData.iconUrl ? (
                <div className="relative">
                  <Image
                    src={formData.iconUrl}
                    alt="App icon"
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

          <div className="space-y-2">
            <Label htmlFor="homepage">Homepage URL</Label>
            <Input
              id="homepage"
              value={formData.homepage}
              onChange={(e) =>
                setFormData({ ...formData, homepage: e.target.value })
              }
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPopular">Popular App</Label>
                <p className="text-sm text-muted-foreground">
                  Mark this app as popular to feature it
                </p>
              </div>
              <Switch
                id="isPopular"
                checked={formData.isPopular}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isPopular: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFoss">Free and Open Source</Label>
                <p className="text-sm text-muted-foreground">
                  Mark this app as FOSS to display a badge
                </p>
              </div>
              <Switch
                id="isFoss"
                checked={formData.isFoss}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isFoss: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-6 space-x-2">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : appId ? 'Update App' : 'Create App'}
        </Button>
      </div>
    </form>
  );
}
