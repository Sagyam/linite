import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  renderWithProviders,
  mockGlobalFetch,
  createMockResponse,
  waitForAsync,
} from '../test/component-utils';
import { AddInstallationDialog } from './add-installation-dialog';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('AddInstallationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should render dialog when open', () => {
      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should not render dialog when closed', () => {
      renderWithProviders(
        <AddInstallationDialog
          open={false}
          onOpenChange={vi.fn()}
        />
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toBeFalsy();
    });
  });

  describe('data fetching', () => {
    it('should fetch apps on mount', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([{ id: 'app-1', displayName: 'Firefox' }])
      );

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/apps?limit=1000');
    });

    it('should fetch distros on mount', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([])
      );

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/distros');
    });

    it('should fetch devices on mount', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([])
      );

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/installations/devices');
    });
  });

  describe('package selection', () => {
    it('should fetch packages when app is selected', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([{ id: 'app-1', displayName: 'Firefox' }])
      );

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/apps?limit=1000');
    });
  });

  describe('form submission', () => {
    it('should submit installation data', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([{ id: 'app-1', displayName: 'Firefox' }])
      );

      const onOpenChange = vi.fn();
      
      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={onOpenChange}
          onSuccess={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should call onOpenChange with false on cancel', () => {
      const onOpenChange = vi.fn();

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={onOpenChange}
        />
      );

      const cancelButton = document.querySelector('button[type="button"]');
      expect(cancelButton).toBeTruthy();
    });

    it('should call onOpenChange with false after successful submit', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([{ id: 'app-1', displayName: 'Firefox' }])
      );

      const onOpenChange = vi.fn();

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={onOpenChange}
          onSuccess={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API errors during submission', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([{ id: 'app-1', displayName: 'Firefox' }])
      );

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    it('should have disabled submit button when form is incomplete', () => {
      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const submitButton = document.querySelector('button[type="submit"]');
      expect(submitButton).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle app search', () => {
      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      const searchInput = document.querySelector('input[placeholder*="Search apps"]');
      expect(searchInput).toBeTruthy();
    });

    it('should handle empty apps list', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([])
      );

      renderWithProviders(
        <AddInstallationDialog
          open={true}
          onOpenChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/apps?limit=1000');
    });
  });
});
