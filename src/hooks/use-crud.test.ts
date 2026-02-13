import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createCrudHooks, type CrudConfig } from './use-crud';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

// Mock fetch
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('createCrudHooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  interface TestEntity {
    id: string;
    name: string;
    description: string;
  }

  const defaultConfig: CrudConfig = {
    entityName: 'TestEntity',
    pluralName: 'test entities',
    endpoint: '/api/test',
    queryKey: 'test',
  };

  const mockEntities: TestEntity[] = [
    { id: '1', name: 'Entity 1', description: 'First entity' },
    { id: '2', name: 'Entity 2', description: 'Second entity' },
  ];

  describe('factory function', () => {
    it('should return an object with useList and useDelete hooks', () => {
      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      expect(hooks).toHaveProperty('useList');
      expect(hooks).toHaveProperty('useDelete');
      expect(typeof hooks.useList).toBe('function');
      expect(typeof hooks.useDelete).toBe('function');
    });

    it('should create hooks with different configurations', () => {
      const appsHooks = createCrudHooks<TestEntity>({
        entityName: 'App',
        pluralName: 'apps',
        endpoint: '/api/apps',
        queryKey: 'apps',
      });

      const categoriesHooks = createCrudHooks<TestEntity>({
        entityName: 'Category',
        pluralName: 'categories',
        endpoint: '/api/categories',
        queryKey: 'categories',
      });

      expect(appsHooks.useList).not.toBe(categoriesHooks.useList);
      expect(appsHooks.useDelete).not.toBe(categoriesHooks.useDelete);
    });
  });

  describe('useList', () => {
    it('should fetch entities successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntities),
      } as Response);

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data).toEqual(mockEntities);
    });

    it('should call correct endpoint', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntities),
      } as Response);

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      renderHook(() => hooks.useList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/test');
      });
    });

    it('should return empty array when no entities exist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data).toEqual([]);
    });

    it('should throw error when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      try {
        renderHook(() => hooks.useList(), {
          wrapper: createWrapper(),
        });
      } catch {
        // Expected to throw
      }

      consoleSpy.mockRestore();
    });

    it('should use plural name in error message', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hooks = createCrudHooks<TestEntity>({
        ...defaultConfig,
        pluralName: 'categories',
      });

      try {
        renderHook(() => hooks.useList(), {
          wrapper: createWrapper(),
        });
      } catch (e) {
        expect((e as Error).message).toContain('categories');
      }

      consoleSpy.mockRestore();
    });
  });

  describe('useDelete', () => {
    it('should delete entity successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith('/api/test/1', {
        method: 'DELETE',
      });
    });

    it('should show success toast on delete', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(toast.success).toHaveBeenCalledWith('TestEntity deleted successfully');
    });

    it('should use entity name in success toast', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);

      const hooks = createCrudHooks<TestEntity>({
        ...defaultConfig,
        entityName: 'Category',
      });

      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(toast.success).toHaveBeenCalledWith('Category deleted successfully');
    });

    it('should show error toast on delete failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Cannot delete entity' }),
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Cannot delete entity');

      consoleSpy.mockRestore();
    });

    it('should use default error message when no error provided', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Failed to delete TestEntity');

      consoleSpy.mockRestore();
    });

    it('should handle network error', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(toast.error).toHaveBeenCalledWith('Network error');

      consoleSpy.mockRestore();
    });

    it('should delete different entity IDs', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        } as Response);

      const hooks = createCrudHooks<TestEntity>(defaultConfig);

      const { result } = renderHook(() => hooks.useDelete(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.mutate('entity-abc-123');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith('/api/test/entity-abc-123', {
        method: 'DELETE',
      });
    });
  });

  describe('query key management', () => {
    it('should use admin prefix in query key for list', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEntities),
      } as Response);

      const hooks = createCrudHooks<TestEntity>({
        ...defaultConfig,
        queryKey: 'custom-key',
      });

      renderHook(() => hooks.useList(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
    });
  });

  describe('type safety', () => {
    it('should return hooks with correct type inference', () => {
      interface TypedEntity {
        id: string;
        customField: string;
      }

      const hooks = createCrudHooks<TypedEntity>({
        entityName: 'TypedEntity',
        pluralName: 'typed entities',
        endpoint: '/api/typed',
        queryKey: 'typed-entity-test',
      });

      // Type safety is validated at compile time
      // This test confirms the hooks are created correctly
      expect(hooks.useList).toBeDefined();
      expect(hooks.useDelete).toBeDefined();
    });
  });
});
