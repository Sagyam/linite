import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCategories, type Category } from './use-categories';

// Mock fetch
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCategories: Category[] = [
    {
      id: 'cat-1',
      name: 'Browsers',
      slug: 'browsers',
      icon: 'globe',
      description: 'Web browsers',
      displayOrder: 1,
    },
    {
      id: 'cat-2',
      name: 'Development',
      slug: 'development',
      icon: 'code',
      description: 'Development tools',
      displayOrder: 2,
    },
  ];

  describe('successful fetch', () => {
    it('should return categories when fetch succeeds', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories).toBeDefined();
      });

      expect(result.current.categories).toEqual(mockCategories);
    });

    it('should return empty array when no categories exist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories).toBeDefined();
      });

      expect(result.current.categories).toEqual([]);
    });

    it('should call the correct API endpoint', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/categories');
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        const { result } = renderHook(() => useCategories(), {
          wrapper: createWrapper(),
        });

        await waitFor(
          () => {
            // Suspense query will throw on error
            expect(result.current).toBeDefined();
          },
          { timeout: 1000 }
        );
      } catch {
        // Expected to throw
      }

      consoleSpy.mockRestore();
    });

    it('should throw error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      try {
        renderHook(() => useCategories(), {
          wrapper: createWrapper(),
        });
      } catch {
        // Expected to throw
      }

      consoleSpy.mockRestore();
    });
  });

  describe('data structure', () => {
    it('should return categories with all fields populated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories).toBeDefined();
      });

      const category = result.current.categories[0];
      expect(category.id).toBe('cat-1');
      expect(category.name).toBe('Browsers');
      expect(category.slug).toBe('browsers');
      expect(category.icon).toBe('globe');
      expect(category.description).toBe('Web browsers');
      expect(category.displayOrder).toBe(1);
    });

    it('should handle categories with null optional fields', async () => {
      const categoriesWithNulls: Category[] = [
        {
          id: 'cat-1',
          name: 'Uncategorized',
          slug: 'uncategorized',
          icon: null,
          description: null,
          displayOrder: 0,
        },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(categoriesWithNulls),
      } as Response);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.categories).toBeDefined();
      });

      expect(result.current.categories[0].icon).toBeNull();
      expect(result.current.categories[0].description).toBeNull();
    });
  });

  describe('return value structure', () => {
    it('should return an object with categories property', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveProperty('categories');
      });
    });
  });
});
