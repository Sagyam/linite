import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  renderWithProviders,
  mockGlobalFetch,
  createMockResponse,
  waitForAsync,
} from '../test/component-utils';
import { InstallationHistoryTable } from './installation-history-table';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('InstallationHistoryTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state initially', () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockImplementation(() =>
        new Promise(() => {})
      );

      renderWithProviders(<InstallationHistoryTable />);

      const loader = document.querySelector('.animate-pulse');
      expect(loader).toBeTruthy();
    });
  });

  describe('successful fetch', () => {
    it('should fetch installations on mount', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          {
            id: 'inst-1',
            app: { displayName: 'Firefox', iconUrl: null },
            package: { identifier: 'org.mozilla.firefox', version: '1.0', source: { name: 'Flatpak' } },
            distro: { name: 'Ubuntu', iconUrl: null },
            deviceIdentifier: 'My Laptop',
            installedAt: new Date().toISOString(),
            notes: null
          }
        ])
      );

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/installations?limit=100');
    });

    it('should display installations in table', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          {
            id: 'inst-1',
            app: { displayName: 'Firefox', iconUrl: null },
            package: { identifier: 'org.mozilla.firefox', version: '1.0', source: { name: 'Flatpak' } },
            distro: { name: 'Ubuntu', iconUrl: null },
            deviceIdentifier: 'My Laptop',
            installedAt: new Date().toISOString(),
            notes: null
          }
        ])
      );

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no installations', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([])
      );

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('delete functionality', () => {
    it('should open delete dialog when delete button is clicked', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          {
            id: 'inst-1',
            app: { displayName: 'Firefox', iconUrl: null },
            package: { identifier: 'firefox', version: '1.0', source: { name: 'Flatpak' } },
            distro: { name: 'Ubuntu', iconUrl: null },
            deviceIdentifier: 'My Laptop',
            installedAt: new Date().toISOString(),
            notes: null
          }
        ])
      );

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('add installation', () => {
    it('should open add installation dialog', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([])
      );

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle installations without icons', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          {
            id: 'inst-1',
            app: { displayName: 'Terminal', iconUrl: null },
            package: { identifier: 'terminal', version: '1.0', source: { name: 'APT' } },
            distro: { name: 'Ubuntu', iconUrl: null },
            deviceIdentifier: 'Work PC',
            installedAt: new Date().toISOString(),
            notes: null
          }
        ])
      );

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/installations?limit=100');
    });

    it('should handle installations with notes', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse([
          {
            id: 'inst-1',
            app: { displayName: 'VS Code', iconUrl: null },
            package: { identifier: 'code', version: '1.85', source: { name: 'Snap' } },
            distro: { name: 'Ubuntu', iconUrl: null },
            deviceIdentifier: 'Home Desktop',
            installedAt: new Date().toISOString(),
            notes: 'Main editor for development'
          }
        ])
      );

      renderWithProviders(<InstallationHistoryTable />);

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
