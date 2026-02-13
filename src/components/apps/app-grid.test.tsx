import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import {
  renderWithProviders,
  createMockAppWithRelations,
  createMockCategory,
} from '@/test/component-utils';
import { AppGrid } from './app-grid';
import { TIMEOUTS } from '@/lib/constants';

// Mock the useApps hook
const mockFetchNextPage = vi.fn();
const mockUseApps = vi.fn();

vi.mock('@/hooks/use-apps', () => ({
  useApps: (params: any) => mockUseApps(params),
}));

// Mock AppCard component to simplify testing
vi.mock('./app-card', () => ({
  AppCard: ({ app, layout, index, isFocused }: any) => (
    <div
      data-testid={`app-card-${app.id}`}
      data-layout={layout}
      data-index={index}
      data-focused={isFocused}
    >
      {app.displayName}
    </div>
  ),
}));

// Mock Zustand store
const mockUseSelectionStore = vi.fn();
vi.mock('@/stores/selection-store', () => ({
  useSelectionStore: (selector: any) => mockUseSelectionStore(selector),
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

  const defaultProps = {
    categories: mockCategories,
    selectedCategory: 'all',
    searchQuery: '',
    showPopular: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Mock Zustand store selectors
    mockUseSelectionStore.mockImplementation((selector: any) => {
      const state = {
        viewMode: 'minimal' as const,
        focusedAppIndex: -1,
      };
      return selector(state);
    });

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
    it('should render all apps from the first page', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

      expect(screen.getByText('Firefox')).toBeInTheDocument();
      expect(screen.getByText('Chrome')).toBeInTheDocument();
      expect(screen.getByText('VSCode')).toBeInTheDocument();
    });

    it('should render apps in minimal layout by default', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

      const appCards = screen.getAllByTestId(/app-card-/);
      appCards.forEach((card) => {
        expect(card).toHaveAttribute('data-layout', 'minimal');
      });
    });

    it('should pass index to each app card', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

      const cards = screen.getAllByTestId(/app-card-/);
      cards.forEach((card, index) => {
        expect(card).toHaveAttribute('data-index', index.toString());
      });
    });

    it('should display total count when no more pages', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

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

      renderWithProviders(<AppGrid {...defaultProps} />);

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

      renderWithProviders(<AppGrid {...defaultProps} />);

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

      renderWithProviders(<AppGrid {...defaultProps} />);

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

      renderWithProviders(<AppGrid {...defaultProps} />);

      expect(
        screen.getByText(/No applications found. Try adjusting your filters./i)
      ).toBeInTheDocument();
    });
  });

  // Note: Category filtering is now handled by CategorySidebar component
  // AppGrid receives debouncedCategory as a prop and uses it directly
  describe('category filtering', () => {
    it('should call useApps with undefined category when "all" is selected', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          category: undefined,
        })
      );
    });

    it('should call useApps with category ID when category prop is provided', () => {
      renderWithProviders(<AppGrid {...defaultProps} selectedCategory="cat-1" />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'cat-1',
        })
      );
    });
  });

  // Note: Search functionality is now handled by AppFilters component
  // AppGrid receives debouncedSearch as a prop and uses it directly
  describe('search functionality', () => {
    it('should not pass search param when search is empty', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          search: undefined,
        })
      );
    });

    it('should pass search param when search query is provided', () => {
      renderWithProviders(<AppGrid {...defaultProps} searchQuery="firefox" />);

      // After debounce, the hook should be called with search
      act(() => {
        vi.advanceTimersByTime(TIMEOUTS.DEBOUNCE_SEARCH);
      });

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'firefox',
        })
      );
    });
  });

  // Note: Popular filter is now handled by AppFilters component
  // AppGrid receives showPopular as a prop and uses it directly
  describe('popular filter', () => {
    it('should not pass popular param by default', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          popular: undefined,
        })
      );
    });

    it('should pass popular param when showPopular is true', () => {
      renderWithProviders(<AppGrid {...defaultProps} showPopular={true} />);

      expect(mockUseApps).toHaveBeenCalledWith(
        expect.objectContaining({
          popular: true,
        })
      );
    });
  });

  // Note: Layout switching is now handled by ViewToggle component via Zustand store
  // AppGrid reads viewMode from the store
  describe('layout switching', () => {
    it('should apply correct grid classes for minimal layout', () => {
      renderWithProviders(<AppGrid {...defaultProps} />);

      const grid = screen.getByTestId('app-card-app-1').parentElement;
      expect(grid).toHaveClass('grid-cols-3', 'sm:grid-cols-4', 'md:grid-cols-6', 'lg:grid-cols-8');
    });

    it('should apply correct grid classes for compact layout when viewMode changes', () => {
      // Mock store to return compact view
      mockUseSelectionStore.mockImplementation((selector: any) => {
        const state = {
          viewMode: 'compact' as const,
          focusedAppIndex: -1,
        };
        return selector(state);
      });

      renderWithProviders(<AppGrid {...defaultProps} />);

      const grid = screen.getByTestId('app-card-app-1').parentElement;
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'xl:grid-cols-4');
    });

    it('should apply correct grid classes for detailed layout when viewMode changes', () => {
      // Mock store to return detailed view
      mockUseSelectionStore.mockImplementation((selector: any) => {
        const state = {
          viewMode: 'detailed' as const,
          focusedAppIndex: -1,
        };
        return selector(state);
      });

      renderWithProviders(<AppGrid {...defaultProps} />);

      const grid = screen.getByTestId('app-card-app-1').parentElement;
      expect(grid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
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

      renderWithProviders(<AppGrid {...defaultProps} />);

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

      renderWithProviders(<AppGrid {...defaultProps} />);

      const loadMoreButton = screen.getByRole('button', { name: /Load More Apps/i });
      fireEvent.click(loadMoreButton);

      expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
    });

    it('should setup IntersectionObserver for infinite scroll', () => {
      const observeSpy = vi.fn();
      const unobserveSpy = vi.fn();
      const disconnectSpy = vi.fn();

      class SpyIntersectionObserver {
        callback: IntersectionObserverCallback;

        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
        }

        observe(element: Element) {
          observeSpy(element);
          (element as any).__intersectionCallback = this.callback;
        }

        unobserve(element: Element) {
          unobserveSpy(element);
        }

        disconnect() {
          disconnectSpy();
        }
      }

      global.IntersectionObserver = SpyIntersectionObserver as any;

      renderWithProviders(<AppGrid {...defaultProps} />);

      expect(observeSpy).toHaveBeenCalled();
      expect(screen.getByText('Firefox')).toBeInTheDocument();
    });

    it('should NOT recreate IntersectionObserver infinitely on re-renders', () => {
      const constructorSpy = vi.fn();
      const observeSpy = vi.fn();
      const unobserveSpy = vi.fn();

      class SpyIntersectionObserver {
        callback: IntersectionObserverCallback;

        constructor(callback: IntersectionObserverCallback) {
          constructorSpy();
          this.callback = callback;
        }

        observe(element: Element) {
          observeSpy(element);
          (element as any).__intersectionCallback = this.callback;
        }

        unobserve(element: Element) {
          unobserveSpy(element);
        }

        disconnect() {}
      }

      global.IntersectionObserver = SpyIntersectionObserver as any;

      const { rerender } = renderWithProviders(<AppGrid {...defaultProps} />);

      const initialConstructorCalls = constructorSpy.mock.calls.length;
      const initialObserveCalls = observeSpy.mock.calls.length;

      // Force multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<AppGrid {...defaultProps} />);
      }

      // Observer should not be recreated for simple re-renders
      // It should only be created once initially
      expect(constructorSpy.mock.calls.length).toBe(initialConstructorCalls);
      expect(observeSpy.mock.calls.length).toBe(initialObserveCalls);
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

      renderWithProviders(<AppGrid {...defaultProps} />);

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

      renderWithProviders(<AppGrid {...defaultProps} />);

      const loadMoreSection = screen.getByText(/Loading more apps.../i).parentElement;

      // Simulate intersection
      if ((loadMoreSection as any).__intersectionCallback) {
        (loadMoreSection as any).__intersectionCallback([
          { isIntersecting: true, target: loadMoreSection },
        ]);
      }

      expect(mockFetchNextPage).not.toHaveBeenCalled();
    });

    it('should use latest fetchNextPage reference in observer callback', () => {
      const mockFetch1 = vi.fn();
      const mockFetch2 = vi.fn();

      // Initial render with first fetch function
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 10, limit: 3, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetch1,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      const { rerender } = renderWithProviders(<AppGrid {...defaultProps} />);

      // Update with second fetch function
      mockUseApps.mockReturnValue({
        data: {
          pages: [
            {
              apps: mockApps,
              pagination: { total: 10, limit: 3, offset: 0, hasMore: true },
            },
          ],
        },
        fetchNextPage: mockFetch2,
        hasNextPage: true,
        isFetchingNextPage: false,
        isLoading: false,
        isError: false,
      });

      rerender(<AppGrid {...defaultProps} />);

      // Trigger intersection after rerender
      const loadMoreSection = screen.getByRole('button', { name: /Load More Apps/i }).parentElement;

      act(() => {
        if ((loadMoreSection as any).__intersectionCallback) {
          (loadMoreSection as any).__intersectionCallback([
            { isIntersecting: true, target: loadMoreSection },
          ]);
        }
      });

      // Should use NEW fetch function, not old one
      expect(mockFetch2).toHaveBeenCalled();
      expect(mockFetch1).not.toHaveBeenCalled();
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

      renderWithProviders(<AppGrid {...defaultProps} />);

      // Should show all apps from both pages
      expect(screen.getByText('Firefox')).toBeInTheDocument();
      expect(screen.getByText('Chrome')).toBeInTheDocument();
      expect(screen.getByText('VSCode')).toBeInTheDocument();
      expect(screen.getByText('Brave')).toBeInTheDocument();
      expect(screen.getByText('Atom')).toBeInTheDocument();

      expect(screen.getByText(/Showing 5 of 5 apps/i)).toBeInTheDocument();
    });
  });

  // Note: Combined filters are now handled by parent component (HomePageClient)
  // AppGrid receives the filtered values as props
  describe('edge cases', () => {
    it('should handle empty categories array', () => {
      renderWithProviders(<AppGrid categories={[]} />);

      expect(screen.getByText('Firefox')).toBeInTheDocument();
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

      renderWithProviders(<AppGrid {...defaultProps} />);

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

      renderWithProviders(<AppGrid {...defaultProps} />);

      expect(
        screen.getByText(/No applications found. Try adjusting your filters./i)
      ).toBeInTheDocument();
    });
  });
});
