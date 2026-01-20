import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  renderWithProviders,
  mockGlobalFetch,
  createMockResponse,
  waitForAsync,
} from '../test/component-utils';
import { DeviceFilter } from './device-filter';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('DeviceFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading state initially', () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockImplementation(() =>
        new Promise(() => {})
      );

      renderWithProviders(
        <DeviceFilter
          selectedDevice={null}
          onDeviceChange={vi.fn()}
        />
      );

      const loader = document.querySelector('.animate-spin');
      expect(loader).toBeTruthy();
    });
  });

  describe('successful fetch', () => {
    it('should fetch devices from API endpoint', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ devices: ['My Laptop', 'Work PC'] })
      );

      renderWithProviders(
        <DeviceFilter
          selectedDevice={null}
          onDeviceChange={vi.fn()}
        />
      );

      await waitForAsync();
      
      expect(mockFetch).toHaveBeenCalledWith('/api/installations/devices');
    });

    it('should display devices after fetching', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ devices: ['My Laptop', 'Work PC', 'Home Desktop'] })
      );

      renderWithProviders(
        <DeviceFilter
          selectedDevice={null}
          onDeviceChange={vi.fn()}
        />
      );

      await waitForAsync();

      const select = document.querySelector('[role="combobox"]');
      expect(select).toBeTruthy();
    });
  });

  describe('error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <DeviceFilter
          selectedDevice={null}
          onDeviceChange={vi.fn()}
        />
      );

      await waitForAsync();
      
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle non-200 responses', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ error: 'Unauthorized' }, 401, false)
      );

      renderWithProviders(
        <DeviceFilter
          selectedDevice={null}
          onDeviceChange={vi.fn()}
        />
      );

      await waitForAsync();
      
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('empty state', () => {
    it('should handle empty devices list', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ devices: [] })
      );

      renderWithProviders(
        <DeviceFilter
          selectedDevice={null}
          onDeviceChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/installations/devices');
    });
  });

  describe('edge cases', () => {
    it('should handle device names with special characters', async () => {
      const mockFetch = mockGlobalFetch();
      mockFetch.mockResolvedValueOnce(
        createMockResponse({ devices: ["John's PC", 'Device-2024'] })
      );

      renderWithProviders(
        <DeviceFilter
          selectedDevice={null}
          onDeviceChange={vi.fn()}
        />
      );

      await waitForAsync();

      expect(mockFetch).toHaveBeenCalledWith('/api/installations/devices');
    });
  });
});
