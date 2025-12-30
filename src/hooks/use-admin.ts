'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Apps
export interface App {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  isPopular: boolean;
  isFoss: boolean;
  category: {
    name: string;
  } | null;
}

export function useAdminApps() {
  return useQuery({
    queryKey: ['admin', 'apps'],
    queryFn: async () => {
      const response = await fetch('/api/apps');
      if (!response.ok) throw new Error('Failed to fetch apps');
      return response.json() as Promise<App[]>;
    },
  });
}

export function useDeleteApp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appId: string) => {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete app');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'apps'] });
      queryClient.invalidateQueries({ queryKey: ['apps'] });
      toast.success('App deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete app');
    },
  });
}

// Categories
export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  displayOrder: number;
}

export function useAdminCategories() {
  return useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json() as Promise<Category[]>;
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete category');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });
}

// Sources
export interface Source {
  id: string;
  name: string;
  slug: string;
  installCmd: string;
  requireSudo: boolean;
  setupCmd: string | null;
  priority: number;
  apiEndpoint: string | null;
}

export function useAdminSources() {
  return useQuery({
    queryKey: ['admin', 'sources'],
    queryFn: async () => {
      const response = await fetch('/api/sources');
      if (!response.ok) throw new Error('Failed to fetch sources');
      return response.json() as Promise<Source[]>;
    },
  });
}

export function useDeleteSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await fetch(`/api/sources/${sourceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete source');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sources'] });
      toast.success('Source deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete source');
    },
  });
}

// Distros
export interface Distro {
  id: string;
  name: string;
  slug: string;
  family: string;
  iconUrl: string | null;
  basedOn: string | null;
  isPopular: boolean;
}

export function useAdminDistros() {
  return useQuery({
    queryKey: ['admin', 'distros'],
    queryFn: async () => {
      const response = await fetch('/api/distros');
      if (!response.ok) throw new Error('Failed to fetch distros');
      return response.json() as Promise<Distro[]>;
    },
  });
}

export function useDeleteDistro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (distroId: string) => {
      const response = await fetch(`/api/distros/${distroId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete distro');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'distros'] });
      queryClient.invalidateQueries({ queryKey: ['distros'] });
      toast.success('Distribution deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete distro');
    },
  });
}

// Packages
export interface Package {
  id: string;
  appId: string;
  sourceId: string;
  identifier: string;
  version: string | null;
  downloadSize: string | null;
  isAvailable: boolean;
  app: {
    displayName: string;
  };
  source: {
    name: string;
    slug: string;
  };
}

export function useAdminPackages() {
  return useQuery({
    queryKey: ['admin', 'packages'],
    queryFn: async () => {
      const response = await fetch('/api/packages');
      if (!response.ok) throw new Error('Failed to fetch packages');
      return response.json() as Promise<Package[]>;
    },
  });
}

export function useDeletePackage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (packageId: string) => {
      const response = await fetch(`/api/packages/${packageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete package');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'packages'] });
      toast.success('Package deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete package');
    },
  });
}
