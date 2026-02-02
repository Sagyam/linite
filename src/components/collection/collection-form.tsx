'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AppSelector } from './app-selector';
import { Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const collectionFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean(),
  tags: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionFormSchema>;

interface CollectionFormProps {
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    isPublic: boolean;
    tags?: string[];
    appIds: string[];
  };
  mode: 'create' | 'edit';
}

export function CollectionForm({ initialData, mode }: CollectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>(initialData?.appIds || []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      isPublic: initialData?.isPublic ?? false,
      tags: initialData?.tags?.join(', ') || '',
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const isPublic = watch('isPublic');

  const handleAppToggle = (appId: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
  };

  const saveCollectionMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      isPublic: boolean;
      tags: string[];
      appIds: string[];
    }) => {
      const url = mode === 'create'
        ? '/api/user/collections'
        : `/api/user/collections/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save collection');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all collection-related queries
      queryClient.invalidateQueries({ queryKey: ['user-collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection'] });
      queryClient.invalidateQueries({ queryKey: ['public-collections'] });

      toast({
        title: 'Success',
        description: mode === 'create'
          ? 'Collection created successfully'
          : 'Collection updated successfully',
      });

      router.push('/dashboard');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save collection',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: CollectionFormData) => {
    if (selectedAppIds.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one app',
        variant: 'destructive',
      });
      return;
    }

    const tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      name: data.name,
      description: data.description || undefined,
      isPublic: data.isPublic,
      tags,
      appIds: selectedAppIds,
    };

    saveCollectionMutation.mutate(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Give your collection a name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Collection Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="My Dev Tools"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="A collection of essential development tools for Linux"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              {...register('tags')}
              placeholder="development, productivity, tools"
            />
            <p className="text-xs text-muted-foreground">
              Help others discover your collection (max 10 tags)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
          <CardDescription>
            Control who can see your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPublic">Make collection public</Label>
              <p className="text-sm text-muted-foreground">
                {isPublic
                  ? 'Anyone can view and clone this collection'
                  : 'Only you can see this collection (unless shared via link)'}
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setValue('isPublic', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* App Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Apps *</CardTitle>
          <CardDescription>
            Choose apps to include in your collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppSelector
            selectedAppIds={selectedAppIds}
            onAppToggle={handleAppToggle}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={saveCollectionMutation.isPending}
          size="lg"
        >
          {saveCollectionMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {mode === 'create' ? 'Create Collection' : 'Save Changes'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saveCollectionMutation.isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
