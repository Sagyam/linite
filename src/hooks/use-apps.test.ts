import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useApps } from './use-apps';
import type { AppWithRelations } from '@/types';

// Mock dependencies
vi.mock('@/lib/constants', () => ({
  PAGINATION: {
    DEFAULT_LIMIT: 50,
  },
}));

vi.mock('@/lib/query-keys', () => ({
  queryKeys: {
    apps: {
      list: vi.fn((params) => ['apps', 'list', params]),
    },
  },
}));

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

describe('useApps', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockApp: AppWithRelations = {
    id: 'app-1',
    slug: 'firefox',
    displayName: 'Firefox',
    description: 'A web browser',
    iconUrl: 'https://example.com/firefox.png',
    isPopular: true,
    isFoss: true,
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      slug: 'browsers',
      name: 'Browsers',
      displayOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    packages: [],
  };

  const mockResponse = {
    apps: [mockApp],
    pagination: {
      total: 1,
      limit: 50,
      offset: 0,
      hasMore: false,
    },
  };

  describe('successful fetch', () => {
    it('should return apps when fetch succeeds', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.pages[0].apps).toEqual([mockApp]);
    });

    it('should call API with correct URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain('/api/apps');
      expect(fetchCall).toContain('offset=0');
      expect(fetchCall).toContain('limit=50');
    });

    it('should return empty apps when no results', async () => {
      const emptyResponse = {
        apps: [],
        pagination: {
          total: 0,
          limit: 50,
          offset: 0,
          hasMore: false,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(emptyResponse),
      } as Response);

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data?.pages[0].apps).toEqual([]);
    });
  });

  describe('query parameters', () => {
    it('should include category filter in URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      renderHook(() => useApps({ category: 'browsers' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain('category=browsers');
    });

    it('should include popular filter in URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      renderHook(() => useApps({ popular: true }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain('popular=true');
    });

    it('should include search filter in URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      renderHook(() => useApps({ search: 'firefox' }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain('search=firefox');
    });

    it('should include multiple filters in URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      renderHook(
        () =>
          useApps({
            category: 'browsers',
            popular: true,
            search: 'firefox',
          }),
        {
          wrapper: createWrapper(),
        }
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(fetchCall).toContain('category=browsers');
      expect(fetchCall).toContain('popular=true');
      expect(fetchCall).toContain('search=firefox');
    });

    it('should not include undefined filters in URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      renderHook(() => useApps({ category: undefined, popular: undefined }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const fetchCall = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(fetchCall).not.toContain('category');
      expect(fetchCall).not.toContain('popular');
    });
  });

  describe('pagination', () => {
    it('should return hasMore from pagination', async () => {
      const responseWithMore = {
        apps: [mockApp],
        pagination: {
          total: 100,
          limit: 50,
          offset: 0,
          hasMore: true,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseWithMore),
      } as Response);

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.hasNextPage).toBe(true);
    });

    it('should return no hasNextPage when hasMore is false', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should set error when fetch fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe('Failed to fetch apps');

      consoleSpy.mockRestore();
    });

    it('should set error on network failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      consoleSpy.mockRestore();
    });
  });

  describe('initial data', () => {
    it('should use initial data when provided', async () => {
      const initialData = {
        pages: [mockResponse],
        pageParams: [0],
      };

      const { result } = renderHook(() => useApps({}, initialData), {
        wrapper: createWrapper(),
      });

      expect(result.current.data?.pages[0].apps).toEqual([mockApp]);
    });
  });

  describe('loading state', () => {
    it('should return loading state initially', () => {
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise(() => {
            /* never resolves */
          })
      );

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should not be loading when data is available', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const { result } = renderHook(() => useApps(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });
});
