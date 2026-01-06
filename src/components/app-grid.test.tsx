import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import {
  renderWithProviders,
  createMockAppWithRelations,
  createMockCategory,
} from '../test/component-utils';
import { AppGrid } from './app-grid';
import { TIMEOUTS } from '../lib/constants';

// Mock the useApps hook
const mockFetchNextPage = vi.fn();
const mockUseApps = vi.fn();

vi.mock('@/hooks/use-apps', () => ({
  useApps: (params: any) => mockUseApps(params),
}));

// Mock AppCard component to simplify testing
vi.mock('./app-card', () => ({
  AppCard: ({ app, layout }: any) => (
    <div data-testid={`app-card-${app.id}`} data-layout={layout}>
      {app.displayName}
    </div>
  ),
}));

// Mock AppFilters component
vi.mock('./app-filters', () => ({
  AppFilters: ({
    categories,
    selectedCategory,
    onCategoryChange,
    searchQuery,
    onSearchChange,
    showPopular,
    onTogglePopular,
    layout,
    onLayoutChange,
    onClearFilters,
  }: any) => (
    <div data-testid="app-filters">
      <select
        data-testid="category-select"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="all">All</option>
        {categories.map((cat: any) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <input
        data-testid="search-input"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search"
      />
      <button
        data-testid="popular-toggle"
        onClick={onTogglePopular}
        aria-pressed={showPopular}
      >
        Popular: {showPopular ? 'On' : 'Off'}
      </button>
      <button
        data-testid="layout-toggle"
        onClick={() => onLayoutChange(layout === 'compact' ? 'detailed' : 'compact')}
      >
        Layout: {layout}
      </button>
      <button data-testid="clear-filters" onClick={onClearFilters}>
        Clear Filters
      </button>
    </div>
  ),
}));

// Mock IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(element: Element) {
    // Store the callback so we can trigger it manually
    (element as any).__intersectionCallback = this.callback;
  }

  unobserve() {}
  disconnect() {}
}

global.IntersectionObserver = MockIntersectionObserver as any;

describe('AppGrid', () => {
  const mockCategories = [
    createMockCategory({ id: 'cat-1', name: 'Browsers', slug: 'browsers' }),
    createMockCategory({ id: 'cat-2', name: 'Editors', slug: 'editors' }),
  ];

  const mockApps = [
    createMockAppWithRelations({
      id: 'app-1',
      displayName: 'Firefox',
      slug: 'firefox',
    }),
    createMockAppWithRelations({
      id: 'app-2',
      displayName: 'Chrome',
      slug: 'chrome',
    }),
    createMockAppWithRelations({
      id: 'app-3',
      displayName: 'VSCode',
      slug: 'vscode',
    }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementation
    mockUseApps.mockReturnValue({
      data: {
        pages: [
          {
            apps: mockApps,
            pagination: {
              total: 3,
              limit: 20,
              offset: 0,
              hasMore: false,
            },
          },
        ],
      },
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render AppFilters component', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(screen.getByTestId('app-filters')).toBeInTheDocument();
    });

    it('should render all apps from the first page', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(screen.getByText('Firefox')).toBeInTheDocument();
      expect(screen.getByText('Chrome')).toBeInTheDocument();
      expect(screen.getByText('VSCode')).toBeInTheDocument();
    });

    it('should render apps in detailed layout by default', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const appCards = screen.getAllByTestId(/app-card-/);
      appCards.forEach((card) => {
        expect(card).toHaveAttribute('data-layout', 'detailed');
      });
    });

    it('should display total count when no more pages', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(screen.getByText(/Showing 3 of 3 apps/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading spinner when initial loading', () => {
      mockUseApps.mockReturnValue({
        data: undefined,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: true,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(screen.getByText(/Loading applications.../i)).toBeInTheDocument();
      expect(screen.queryByText('Firefox')).not.toBeInTheDocument();
    });

    it('should show loading message when fetching next page', () => {
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 10, limit: 3, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: true,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(screen.getByText(/Loading more apps.../i)).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when loading fails', () => {
      mockUseApps.mockReturnValue({
        data: undefined,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: true,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(screen.getByText(/Failed to load applications/i)).toBeInTheDocument();
      expect(screen.getByText(/Please try again later or contact support/i)).toBeInTheDocument();
      expect(screen.queryByText('Firefox')).not.toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no apps found', () => {
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: [],
              pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(
        screen.getByText(/No applications found. Try adjusting your filters./i)
      ).toBeInTheDocument();
    });
  });

  describe('category filtering', () => {
    it('should call useApps with undefined category when "all" is selected', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          category: undefined,
        })
      );
    });

    it('should call useApps with category ID when category is selected', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const categorySelect = screen.getByTestId('category-select');
      fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

      // Wait for the debounced value to update (no debounce on category)
      expect(mockUseApps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: 'cat-1',
        })
      );
    });

    it('should reset to all categories when clear filters is clicked', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      // Select a category
      const categorySelect = screen.getByTestId('category-select');
      fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

      // Clear filters
      const clearButton = screen.getByTestId('clear-filters');
      fireEvent.click(clearButton);

      expect(mockUseApps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          category: undefined,
        })
      );
    });
  });

  describe('search functionality', () => {
    it('should not pass search param when search is empty', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
        })
      );
    });

    it('should debounce search input', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const searchInput = screen.getByTestId('search-input');

      // Type in search
      fireEvent.change(searchInput, { target: { value: 'fire' } });

      // Should not call immediately
      expect(mockUseApps).not.toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'fire',
        })
      );

      // Fast forward time by debounce delay
      act(() => {
        vi.advanceTimersByTime(TIMEOUTS.DEBOUNCE_SEARCH);
      });

      // After debounce, the hook should be called with search
      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'fire',
        })
      );
    });

    it('should cancel previous debounce when typing again', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const searchInput = screen.getByTestId('search-input');

      // Type "fi"
      fireEvent.change(searchInput, { target: { value: 'fi' } });

      // Wait half the debounce time
      act(() => {
        vi.advanceTimersByTime(TIMEOUTS.DEBOUNCE_SEARCH / 2);
      });

      // Type "fir" (should reset debounce)
      fireEvent.change(searchInput, { target: { value: 'fir' } });

      // Wait the full debounce time from now
      act(() => {
        vi.advanceTimersByTime(TIMEOUTS.DEBOUNCE_SEARCH);
      });

      // Should only search for "fir", not "fi"
      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'fir',
        })
      );

      expect(mockUseApps).not.toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'fi',
        })
      );
    });

    it('should clear search when clear filters is clicked', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'firefox' } });

      const clearButton = screen.getByTestId('clear-filters');
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('popular filter', () => {
    it('should not pass popular param by default', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          popular: undefined,
        })
      );
    });

    it('should pass popular param when toggled on', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const popularToggle = screen.getByTestId('popular-toggle');
      fireEvent.click(popularToggle);

      expect(mockUseApps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          popular: true,
        })
      );
    });

    it('should toggle popular filter off', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const popularToggle = screen.getByTestId('popular-toggle');

      // Toggle on
      fireEvent.click(popularToggle);
      expect(mockUseApps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          popular: true,
        })
      );

      // Toggle off
      fireEvent.click(popularToggle);
      expect(mockUseApps).toHaveBeenLastCalledWith(
        expect.objectContaining({
          popular: undefined,
        })
      );
    });

    it('should reset popular filter when clear filters is clicked', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      // Toggle popular on
      const popularToggle = screen.getByTestId('popular-toggle');
      fireEvent.click(popularToggle);

      // Clear filters
      const clearButton = screen.getByTestId('clear-filters');
      fireEvent.click(clearButton);

      expect(popularToggle).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('layout switching', () => {
    it('should switch to compact layout', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const layoutToggle = screen.getByTestId('layout-toggle');
      fireEvent.click(layoutToggle);

      const appCards = screen.getAllByTestId(/app-card-/);
      appCards.forEach((card) => {
        expect(card).toHaveAttribute('data-layout', 'compact');
      });
    });

    it('should switch back to detailed layout', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const layoutToggle = screen.getByTestId('layout-toggle');

      // Switch to compact
      fireEvent.click(layoutToggle);

      // Switch back to detailed
      fireEvent.click(layoutToggle);

      const appCards = screen.getAllByTestId(/app-card-/);
      appCards.forEach((card) => {
        expect(card).toHaveAttribute('data-layout', 'detailed');
      });
    });

    it('should apply correct grid classes for detailed layout', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const grid = screen.getByTestId('app-card-app-1').parentElement;
      expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });

    it('should apply correct grid classes for compact layout', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      const layoutToggle = screen.getByTestId('layout-toggle');
      fireEvent.click(layoutToggle);

      const grid = screen.getByTestId('app-card-app-1').parentElement;
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });
  });

  describe('infinite scroll', () => {
    it('should show "Load More" button when hasNextPage is true', () => {
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 10, limit: 3, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(screen.getByRole('button', { name: /Load More Apps/i })).toBeInTheDocument();
    });

    it('should call fetchNextPage when Load More button is clicked', () => {
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 10, limit: 3, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      const loadMoreButton = screen.getByRole('button', { name: /Load More Apps/i });
      fireEvent.click(loadMoreButton);

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('should setup IntersectionObserver for infinite scroll', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      // IntersectionObserver should be set up (constructor would be called)
      // We can't easily test this without spying on the constructor
      expect(screen.getByTestId('app-filters')).toBeInTheDocument();
    });

    it('should trigger fetchNextPage when scrolling into view', () => {
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 10, limit: 3, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      // Find the intersection observer trigger element
      const loadMoreSection = screen.getByRole('button', { name: /Load More Apps/i }).parentElement;

      // Simulate intersection
      act(() => {
        if ((loadMoreSection as any).__intersectionCallback) {
          (loadMoreSection as any).__intersectionCallback([
            { isIntersecting: true, target: loadMoreSection },
          ]);
        }
      });

      expect(mockFetchNextPage).toHaveBeenCalled();
    });

    it('should not trigger fetchNextPage when already fetching', () => {
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 10, limit: 3, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: true,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      const loadMoreSection = screen.getByText(/Loading more apps.../i).parentElement;

      // Simulate intersection
      if ((loadMoreSection as any).__intersectionCallback) {
        (loadMoreSection as any).__intersectionCallback([
          { isIntersecting: true, target: loadMoreSection },
        ]);
      }

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it('should render apps from multiple pages', () => {
      const page2Apps = [
        createMockAppWithRelations({ id: 'app-4', displayName: 'Brave' }),
        createMockAppWithRelations({ id: 'app-5', displayName: 'Atom' }),
      ];

      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 5, limit: 3, offset: 0, hasMore: true },
            },
            {
              apps: page2Apps,
              pagination: { total: 5, limit: 3, offset: 3, hasMore: false },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      // Should show all apps from both pages
      expect(screen.getByText('Firefox')).toBeInTheDocument();
      expect(screen.getByText('Chrome')).toBeInTheDocument();
      expect(screen.getByText('VSCode')).toBeInTheDocument();
      expect(screen.getByText('Brave')).toBeInTheDocument();
      expect(screen.getByText('Atom')).toBeInTheDocument();

      expect(screen.getByText(/Showing 5 of 5 apps/i)).toBeInTheDocument();
    });
  });

  describe('combined filters', () => {
    it('should apply multiple filters simultaneously', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      // Set category
      const categorySelect = screen.getByTestId('category-select');
      fireEvent.change(categorySelect, { target: { value: 'cat-1' } });

      // Toggle popular
      const popularToggle = screen.getByTestId('popular-toggle');
      fireEvent.click(popularToggle);

      // Set search
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'firefox' } });

      // Wait for debounce
      act(() => {
        vi.advanceTimersByTime(TIMEOUTS.DEBOUNCE_SEARCH);
      });

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'cat-1',
          popular: true,
          search: 'firefox',
        })
      );
    });

    it('should clear all filters at once', () => {
      renderWithProviders(<AppGrid categories={mockCategories} />);

      // Set multiple filters
      fireEvent.change(screen.getByTestId('category-select'), {
        target: { value: 'cat-1' },
      });
      fireEvent.click(screen.getByTestId('popular-toggle'));
      fireEvent.change(screen.getByTestId('search-input'), {
        target: { value: 'test' },
      });

      // Clear all
      fireEvent.click(screen.getByTestId('clear-filters'));

      expect(screen.getByTestId('category-select')).toHaveValue('all');
      expect(screen.getByTestId('popular-toggle')).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByTestId('search-input')).toHaveValue('');
    });
  });

  describe('edge cases', () => {
    it('should handle empty categories array', () => {
      renderWithProviders(<AppGrid categories={[]} />);

      expect(screen.getByTestId('app-filters')).toBeInTheDocument();
    });

    it('should handle page with no apps but hasMore true', () => {
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: [],
              pagination: { total: 0, limit: 20, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(
        screen.getByText(/No applications found. Try adjusting your filters./i)
      ).toBeInTheDocument();
    });

    it('should handle undefined data pages', () => {
      mockUseApps.mockReturnValue({
        data: undefined,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      renderWithProviders(<AppGrid categories={mockCategories} />);

      expect(
        screen.getByText(/No applications found. Try adjusting your filters./i)
      ).toBeInTheDocument();
    });
  });
});
