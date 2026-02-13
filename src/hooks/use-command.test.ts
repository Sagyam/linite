import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCommand } from './use-command';

// Mock selection store
let mockSelectedDistro: string | null = null;
let mockSourcePreference: string | null = null;
let mockNixosInstallMethod: string | null = null;
const mockAppIds: string[] = [];

vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: vi.fn(() => ({
    getSelectedAppIds: () => mockAppIds,
    selectedDistro: mockSelectedDistro,
    sourcePreference: mockSourcePreference,
    nixosInstallMethod: mockNixosInstallMethod,
  })),
}));

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

describe('useCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectedDistro = null;
    mockSourcePreference = null;
    mockNixosInstallMethod = null;
    mockAppIds.length = 0;
  });

  const mockCommandResponse = {
    commands: ['sudo apt install firefox'],
    setupCommands: [],
    warnings: [],
    breakdown: [
      {
        source: 'apt',
        packages: ['firefox'],
      },
    ],
  };

  describe('initial state', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.result).toBeNull();
    });

    it('should return all expected properties', () => {
      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('generate');
      expect(result.current).toHaveProperty('clear');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('result');
    });
  });

  describe('generate', () => {
    it('should call API with correct parameters', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1', 'app-2');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommandResponse),
      } as Response);

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      expect(fetch).toHaveBeenCalledWith('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distroSlug: 'ubuntu',
          appIds: ['app-1', 'app-2'],
          sourcePreference: undefined,
          nixosInstallMethod: undefined,
        }),
      });
    });

    it('should return result on successful generation', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommandResponse),
      } as Response);

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.result).toEqual(mockCommandResponse);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not call API when no apps are selected', async () => {
      mockSelectedDistro = 'ubuntu';
      // mockAppIds is empty

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not call API when no distro is selected', async () => {
      mockAppIds.push('app-1');
      // mockSelectedDistro is null

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should not call API when neither apps nor distro are selected', async () => {
      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      expect(fetch).not.toHaveBeenCalled();
    });

    it('should include sourcePreference when set', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1');
      mockSourcePreference = 'flatpak';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommandResponse),
      } as Response);

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
      expect(body.sourcePreference).toBe('flatpak');
    });

    it('should include nixosInstallMethod when set', async () => {
      mockSelectedDistro = 'nixos';
      mockAppIds.push('app-1');
      mockNixosInstallMethod = 'nix-flakes';

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommandResponse),
      } as Response);

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
      expect(body.nixosInstallMethod).toBe('nix-flakes');
    });
  });

  describe('loading state', () => {
    it('should set loading to true while fetching', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1');

      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve(mockCommandResponse),
                } as Response),
              100
            )
          )
      );

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
    });
  });

  describe('error handling', () => {
    it('should set error when API returns error', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid distro' }),
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Invalid distro');
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.result).toBeNull();

      consoleSpy.mockRestore();
    });

    it('should set default error message when API returns error without message', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Failed to generate commands');
      });

      consoleSpy.mockRestore();
    });

    it('should handle network error', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1');

      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('clear', () => {
    it('should reset mutation state', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommandResponse),
      } as Response);

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(result.current.result).toEqual(mockCommandResponse);
      });

      act(() => {
        result.current.clear();
      });

      await waitFor(() => {
        expect(result.current.result).toBeNull();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('multiple apps', () => {
    it('should send all app IDs to API', async () => {
      mockSelectedDistro = 'ubuntu';
      mockAppIds.push('app-1', 'app-2', 'app-3', 'app-4', 'app-5');

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockCommandResponse),
      } as Response);

      const { result } = renderHook(() => useCommand(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.generate();
      });

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });

      const body = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
      expect(body.appIds).toHaveLength(5);
      expect(body.appIds).toContain('app-1');
      expect(body.appIds).toContain('app-5');
    });
  });
});
