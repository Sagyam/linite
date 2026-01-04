/**
 * Centralized API Client
 * Provides type-safe API methods and consistent error handling
 */

import type { AppWithRelations, Category, Distro, Source } from '@/types';

/**
 * Base API client with common functionality
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generic fetch wrapper with error handling
   */
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error (${response.status}): ${error}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  /**
   * GET request
   */
  private async get<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  private async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  /**
   * Apps API
   */
  apps = {
    /**
     * Get all apps with filtering and pagination
     */
    getAll: async (params?: {
      limit?: number;
      offset?: number;
      category?: string;
      popular?: boolean;
      search?: string;
    }): Promise<{ apps: AppWithRelations[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }> => {
      const searchParams = new URLSearchParams();

      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.offset) searchParams.set('offset', params.offset.toString());
      if (params?.category) searchParams.set('category', params.category);
      if (params?.popular) searchParams.set('popular', 'true');
      if (params?.search) searchParams.set('search', params.search);

      const query = searchParams.toString();
      return this.get(`/apps${query ? `?${query}` : ''}`);
    },

    /**
     * Get apps by IDs (batch fetch)
     */
    getByIds: async (ids: string[]): Promise<AppWithRelations[]> => {
      if (ids.length === 0) return [];

      const searchParams = new URLSearchParams();
      searchParams.set('ids', ids.join(','));

      return this.get(`/apps/batch?${searchParams.toString()}`);
    },

    /**
     * Get single app by ID
     */
    getById: async (id: string): Promise<AppWithRelations> => {
      return this.get(`/apps/${id}`);
    },

    /**
     * Get single app by slug
     */
    getBySlug: async (slug: string): Promise<AppWithRelations> => {
      return this.get(`/apps/slug/${slug}`);
    },
  };

  /**
   * Categories API
   */
  categories = {
    /**
     * Get all categories
     */
    getAll: async (): Promise<Category[]> => {
      return this.get('/categories');
    },

    /**
     * Get category by ID
     */
    getById: async (id: string): Promise<Category> => {
      return this.get(`/categories/${id}`);
    },
  };

  /**
   * Distros API
   */
  distros = {
    /**
     * Get all distros
     */
    getAll: async (): Promise<Distro[]> => {
      return this.get('/distros');
    },

    /**
     * Get distro by ID
     */
    getById: async (id: string): Promise<Distro> => {
      return this.get(`/distros/${id}`);
    },

    /**
     * Get distro by slug
     */
    getBySlug: async (slug: string): Promise<Distro> => {
      return this.get(`/distros/slug/${slug}`);
    },
  };

  /**
   * Sources API
   */
  sources = {
    /**
     * Get all sources
     */
    getAll: async (): Promise<Source[]> => {
      return this.get('/sources');
    },

    /**
     * Get source by ID
     */
    getById: async (id: string): Promise<Source> => {
      return this.get(`/sources/${id}`);
    },
  };

  /**
   * Command Generation API
   */
  commands = {
    /**
     * Generate install commands
     */
    generate: async (params: {
      distroSlug: string;
      appIds: string[];
      sourcePreference?: string;
      nixosInstallMethod?: 'nix-shell' | 'nix-env' | 'nix-flakes';
    }) => {
      return this.post('/generate', params);
    },
  };
}

/**
 * Singleton API client instance
 */
export const apiClient = new ApiClient();

/**
 * Convenience exports for direct usage
 */
export const { apps, categories, distros, sources, commands } = apiClient;
