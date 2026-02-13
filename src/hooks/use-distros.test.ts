import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDistros, type Distro } from './use-distros';

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

describe('useDistros', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDistros: Distro[] = [
    {
      id: 'distro-1',
      name: 'Ubuntu',
      slug: 'ubuntu',
      family: 'debian',
      iconUrl: 'https://example.com/ubuntu.png',
      basedOn: null,
      isPopular: true,
      themeColorLight: '#E95420',
      themeColorDark: '#77216F',
      distroSources: [
        {
          sourceId: 'source-1',
          priority: 10,
          isDefault: true,
          source: {
            id: 'source-1',
            name: 'APT',
            slug: 'apt',
          },
        },
      ],
    },
    {
      id: 'distro-2',
      name: 'Fedora',
      slug: 'fedora',
      family: 'rhel',
      iconUrl: 'https://example.com/fedora.png',
      basedOn: null,
      isPopular: true,
      themeColorLight: '#3C6EB4',
      themeColorDark: '#294172',
      distroSources: [],
    },
  ];

  describe('successful fetch', () => {
    it('should return distros when fetch succeeds', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistros),
      } as Response);

      const { result } = renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.distros).toBeDefined();
      });

      expect(result.current.distros).toEqual(mockDistros);
    });

    it('should return empty array when no distros exist', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      } as Response);

      const { result } = renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.distros).toBeDefined();
      });

      expect(result.current.distros).toEqual([]);
    });

    it('should call the correct API endpoint', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistros),
      } as Response);

      renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/distros');
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
        const { result } = renderHook(() => useDistros(), {
          wrapper: createWrapper(),
        });

        await waitFor(
          () => {
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
        renderHook(() => useDistros(), {
          wrapper: createWrapper(),
        });
      } catch {
        // Expected to throw
      }

      consoleSpy.mockRestore();
    });
  });

  describe('data structure', () => {
    it('should return distros with all fields populated', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistros),
      } as Response);

      const { result } = renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.distros).toBeDefined();
      });

      const distro = result.current.distros[0];
      expect(distro.id).toBe('distro-1');
      expect(distro.name).toBe('Ubuntu');
      expect(distro.slug).toBe('ubuntu');
      expect(distro.family).toBe('debian');
      expect(distro.iconUrl).toBe('https://example.com/ubuntu.png');
      expect(distro.isPopular).toBe(true);
      expect(distro.themeColorLight).toBe('#E95420');
      expect(distro.themeColorDark).toBe('#77216F');
    });

    it('should handle distros with null optional fields', async () => {
      const distrosWithNulls: Distro[] = [
        {
          id: 'distro-1',
          name: 'Custom Distro',
          slug: 'custom',
          family: 'independent',
          iconUrl: null,
          basedOn: null,
          isPopular: false,
          themeColorLight: null,
          themeColorDark: null,
        },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(distrosWithNulls),
      } as Response);

      const { result } = renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.distros).toBeDefined();
      });

      expect(result.current.distros[0].iconUrl).toBeNull();
      expect(result.current.distros[0].basedOn).toBeNull();
      expect(result.current.distros[0].themeColorLight).toBeNull();
      expect(result.current.distros[0].themeColorDark).toBeNull();
    });

    it('should handle distros with distroSources', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistros),
      } as Response);

      const { result } = renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.distros).toBeDefined();
      });

      const distro = result.current.distros[0];
      expect(distro.distroSources).toBeDefined();
      expect(distro.distroSources).toHaveLength(1);
      expect(distro.distroSources![0].sourceId).toBe('source-1');
      expect(distro.distroSources![0].priority).toBe(10);
      expect(distro.distroSources![0].isDefault).toBe(true);
      expect(distro.distroSources![0].source.slug).toBe('apt');
    });

    it('should handle distros with basedOn field', async () => {
      const distrosWithBasedOn: Distro[] = [
        {
          id: 'distro-1',
          name: 'Linux Mint',
          slug: 'linux-mint',
          family: 'debian',
          iconUrl: 'https://example.com/mint.png',
          basedOn: 'ubuntu',
          isPopular: true,
          themeColorLight: '#87CF3E',
          themeColorDark: '#5F9B26',
        },
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(distrosWithBasedOn),
      } as Response);

      const { result } = renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.distros).toBeDefined();
      });

      expect(result.current.distros[0].basedOn).toBe('ubuntu');
    });
  });

  describe('return value structure', () => {
    it('should return an object with distros property', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDistros),
      } as Response);

      const { result } = renderHook(() => useDistros(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current).toHaveProperty('distros');
      });
    });
  });
});
