import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/component-utils';
import { CommandDialog } from './command-dialog';

// Mock the hooks
const mockGenerateInstall = vi.fn();
const mockGenerateUninstall = vi.fn();

vi.mock('@/hooks/use-command', () => ({
  useCommand: () => ({
    generate: mockGenerateInstall,
    loading: false,
    error: null,
    result: null,
  }),
}));

vi.mock('@/hooks/use-uninstall-command', () => ({
  useUninstallCommand: () => ({
    generate: mockGenerateUninstall,
    loading: false,
    error: null,
    result: null,
  }),
}));

// Mock Zustand store
const mockUseSelectionStore = vi.fn();
vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: (selector: any) => mockUseSelectionStore(selector),
}));

// Mock clipboard hooks
vi.mock('@/hooks/use-clipboard', () => ({
  useClipboard: () => ({
    copied: false,
    copy: vi.fn(),
  }),
  useMultiClipboard: () => ({
    copiedItems: {},
    copy: vi.fn(),
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
  },
}));

describe('CommandDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementation
    mockUseSelectionStore.mockImplementation((selector: any) => {
      const state = {
        mode: 'install' as const,
        selectedApps: new Set(['app-1', 'app-2']),
        selectedDistro: 'ubuntu',
        sourcePreference: 'apt',
      };
      return selector(state);
    });
  });

  describe('API call behavior', () => {
    it('should NOT make API calls when dialog is closed', async () => {
      renderWithProviders(
        <CommandDialog open={false} onOpenChange={vi.fn()} />
      );

      await waitFor(() => {
        expect(mockGenerateInstall).not.toHaveBeenCalled();
        expect(mockGenerateUninstall).not.toHaveBeenCalled();
      });
    });

    it('should make install API call only once when dialog opens with apps and distro selected', async () => {
      const { rerender } = renderWithProviders(
        <CommandDialog open={false} onOpenChange={vi.fn()} />
      );

      // Open the dialog
      rerender(<CommandDialog open={true} onOpenChange={vi.fn()} />);

      await waitFor(() => {
        expect(mockGenerateInstall).toHaveBeenCalledTimes(1);
      });

      // Wait a bit more to ensure no additional calls
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockGenerateInstall).toHaveBeenCalledTimes(1);
    });

    it('should make uninstall API call only once when tab is uninstall', async () => {
      mockUseSelectionStore.mockImplementation((selector: any) => {
        const state = {
          mode: 'uninstall' as const,
          selectedApps: new Set(['app-1', 'app-2']),
          selectedDistro: 'ubuntu',
          sourcePreference: 'apt',
        };
        return selector(state);
      });

      renderWithProviders(
        <CommandDialog open={true} onOpenChange={vi.fn()} />
      );

      await waitFor(() => {
        expect(mockGenerateUninstall).toHaveBeenCalledTimes(1);
      });

      // Wait a bit more to ensure no additional calls
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockGenerateUninstall).toHaveBeenCalledTimes(1);
    });

    it('should NOT make infinite API calls when component re-renders', async () => {
      const { rerender } = renderWithProviders(
        <CommandDialog open={true} onOpenChange={vi.fn()} />
      );

      await waitFor(() => {
        expect(mockGenerateInstall).toHaveBeenCalledTimes(1);
      });

      // Trigger multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<CommandDialog open={true} onOpenChange={vi.fn()} />);
      }

      // Wait to ensure no additional calls
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should still only have been called once from the initial mount
      expect(mockGenerateInstall).toHaveBeenCalledTimes(1);
    });

    it('should NOT make API call when no apps selected', async () => {
      mockUseSelectionStore.mockImplementation((selector: any) => {
        const state = {
          mode: 'install' as const,
          selectedApps: new Set([]),
          selectedDistro: 'ubuntu',
          sourcePreference: 'apt',
        };
        return selector(state);
      });

      renderWithProviders(
        <CommandDialog open={true} onOpenChange={vi.fn()} />
      );

      await waitFor(() => {
        expect(mockGenerateInstall).not.toHaveBeenCalled();
        expect(mockGenerateUninstall).not.toHaveBeenCalled();
      });
    });

    it('should NOT make API call when no distro selected', async () => {
      mockUseSelectionStore.mockImplementation((selector: any) => {
        const state = {
          mode: 'install' as const,
          selectedApps: new Set(['app-1', 'app-2']),
          selectedDistro: null,
          sourcePreference: 'apt',
        };
        return selector(state);
      });

      renderWithProviders(
        <CommandDialog open={true} onOpenChange={vi.fn()} />
      );

      await waitFor(() => {
        expect(mockGenerateInstall).not.toHaveBeenCalled();
        expect(mockGenerateUninstall).not.toHaveBeenCalled();
      });
    });
  });

  describe('dialog rendering', () => {
    it('should render dialog when open', () => {
      renderWithProviders(
        <CommandDialog open={true} onOpenChange={vi.fn()} />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render install and uninstall tabs', () => {
      renderWithProviders(
        <CommandDialog open={true} onOpenChange={vi.fn()} />
      );

      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
      expect(tabs.some(tab => tab.textContent === 'Install')).toBe(true);
      expect(tabs.some(tab => tab.textContent === 'Uninstall')).toBe(true);
    });
  });
});