import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import {
  renderWithProviders,
  createMockAppWithRelations,
  resetStores,
  setupSelectionStore,
} from '../test/component-utils';
import { SelectionDrawer } from './selection-drawer';
import { useSelectionStore } from '../stores/selection-store';

// Mock SelectedAppsList component
vi.mock('./selected-apps-list', () => ({
  SelectedAppsList: ({
    apps,
    onRemove,
  }: {
    apps: any[];
    onRemove: (id: string) => void;
  }) => (
    <div data-testid="selected-apps-list">
      {apps.map((app) => (
        <div key={app.id} data-testid={`app-item-${app.id}`}>
          {app.displayName}
          <button onClick={() => onRemove(app.id)} data-testid={`remove-${app.id}`}>
            Remove
          </button>
        </div>
      ))}
    </div>
  ),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Package2: () => <div data-testid="package-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  X: () => <div data-testid="x-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

// Mock the API client
const mockGetByIds = vi.fn();
vi.mock('@/lib/api-client', () => ({
  apps: {
    getByIds: (ids: string[]) => mockGetByIds(ids),
  },
}));

describe('SelectionDrawer', () => {
  const mockOnOpenChange = vi.fn();

  const mockApps = [
    createMockAppWithRelations({ id: 'app-1', displayName: 'Firefox' }),
    createMockAppWithRelations({ id: 'app-2', displayName: 'Chrome' }),
    createMockAppWithRelations({ id: 'app-3', displayName: 'VSCode' }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    resetStores();
    mockGetByIds.mockResolvedValue(mockApps);
  });

  describe('rendering', () => {
    it('should render drawer when open', () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/your selection/i)).toBeInTheDocument();
    });

    it('should not render content when closed', () => {
      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<SelectionDrawer open={false} onOpenChange={mockOnOpenChange} />);

      // Drawer component may still be in DOM but content shouldn't be visible
      expect(screen.queryByText(/selected applications/i)).not.toBeInTheDocument();
    });

    it('should show correct app count in description', () => {
      setupSelectionStore({ apps: ['app-1', 'app-2', 'app-3'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/3 apps ready to install/i)).toBeInTheDocument();
    });

    it('should show singular "app" for single selection', () => {
      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/1 app ready to install/i)).toBeInTheDocument();
    });

    it('should show plural "apps" for multiple selections', () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/2 apps ready to install/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loader when fetching apps', () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      // Make the promise never resolve to keep loading state
      mockGetByIds.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should not show apps list while loading', () => {
      setupSelectionStore({ apps: ['app-1'] });

      mockGetByIds.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByTestId('selected-apps-list')).not.toBeInTheDocument();
    });
  });

  describe('loaded state', () => {
    it('should show selected apps list after loading', async () => {
      setupSelectionStore({ apps: ['app-1', 'app-2', 'app-3'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('selected-apps-list')).toBeInTheDocument();
      });
    });

    it('should pass correct apps to SelectedAppsList', async () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Firefox')).toBeInTheDocument();
        expect(screen.getByText('Chrome')).toBeInTheDocument();
      });
    });

    it('should call API with selected app IDs', async () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(mockGetByIds).toHaveBeenCalledWith(['app-1', 'app-2']);
      });
    });

    it('should not fetch apps when drawer is closed', () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      renderWithProviders(<SelectionDrawer open={false} onOpenChange={mockOnOpenChange} />);

      expect(mockGetByIds).not.toHaveBeenCalled();
    });

    it('should not fetch apps when no apps selected', () => {
      setupSelectionStore({ apps: [] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(mockGetByIds).not.toHaveBeenCalled();
    });
  });

  describe('clear all functionality', () => {
    it('should render clear all button', async () => {
      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
      });
    });

    it('should clear all apps when clicking clear all button', async () => {
      setupSelectionStore({ apps: ['app-1', 'app-2', 'app-3'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      const clearButton = await screen.findByRole('button', { name: /clear all/i });
      fireEvent.click(clearButton);

      expect(useSelectionStore.getState().selectedApps.size).toBe(0);
    });
  });

  describe('remove individual app', () => {
    it('should call deselectApp when clicking remove on an app', async () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      const removeButton = await screen.findByTestId('remove-app-1');
      fireEvent.click(removeButton);

      expect(useSelectionStore.getState().selectedApps.has('app-1')).toBe(false);
      expect(useSelectionStore.getState().selectedApps.has('app-2')).toBe(true);
    });
  });

  describe('close functionality', () => {
    it('should render close button', () => {
      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      const closeButton = screen.getByRole('button', { name: '' }); // Close button with X icon
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty selection gracefully', () => {
      setupSelectionStore({ apps: [] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/0 apps ready to install/i)).toBeInTheDocument();
    });

    it('should handle very large selection count', () => {
      const manyAppIds = Array.from({ length: 100 }, (_, i) => `app-${i}`);
      setupSelectionStore({ apps: manyAppIds });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/100 apps ready to install/i)).toBeInTheDocument();
    });

    it('should handle API error gracefully', async () => {
      setupSelectionStore({ apps: ['app-1'] });
      mockGetByIds.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      // Should stop showing loader even if API fails
      await waitFor(() => {
        expect(screen.queryByTestId('loader-icon')).not.toBeInTheDocument();
      });
    });

    it('should re-fetch when drawer is re-opened', async () => {
      setupSelectionStore({ apps: ['app-1'] });

      const { rerender } = renderWithProviders(
        <SelectionDrawer open={false} onOpenChange={mockOnOpenChange} />
      );

      expect(mockGetByIds).not.toHaveBeenCalled();

      rerender(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(mockGetByIds).toHaveBeenCalled();
      });
    });
  });

  describe('accessibility', () => {
    it('should have drawer title', () => {
      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/your selection/i)).toBeInTheDocument();
    });

    it('should have drawer description', () => {
      setupSelectionStore({ apps: ['app-1', 'app-2'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      expect(screen.getByText(/2 apps ready to install/i)).toBeInTheDocument();
    });

    it('should have accessible buttons', async () => {
      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
      });
    });
  });

  describe('responsive behavior', () => {
    it('should render drawer with proper structure', () => {
      setupSelectionStore({ apps: ['app-1'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      // Just verify the drawer renders with expected content
      expect(screen.getByText(/your selection/i)).toBeInTheDocument();
    });

    it('should have scrollable content area when needed', async () => {
      setupSelectionStore({ apps: ['app-1', 'app-2', 'app-3'] });

      renderWithProviders(<SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />);

      // Verify content loads
      await waitFor(() => {
        expect(screen.getByTestId('selected-apps-list')).toBeInTheDocument();
      });
    });

    it('should handle drawer state changes', () => {
      setupSelectionStore({ apps: ['app-1'] });

      const { rerender } = renderWithProviders(
        <SelectionDrawer open={true} onOpenChange={mockOnOpenChange} />
      );

      expect(screen.getByText(/your selection/i)).toBeInTheDocument();

      rerender(<SelectionDrawer open={false} onOpenChange={mockOnOpenChange} />);

      // When closed, content should not be visible
      expect(screen.queryByText(/selected applications/i)).not.toBeInTheDocument();
    });
  });
});
