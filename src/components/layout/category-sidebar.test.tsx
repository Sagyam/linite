import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySidebar } from './category-sidebar';
import { createMockCategory } from '@/test/component-utils';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  LayoutGrid: () => <div data-testid="layout-grid-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

// Mock getCategoryIcon
vi.mock('@/lib/category-icons', () => ({
  getCategoryIcon: (icon: string) => () => <div data-testid={`category-icon-${icon}`} />,
}));

describe('CategorySidebar', () => {
  const mockCategories = [
    createMockCategory({ id: 'cat-1', name: 'Browsers', slug: 'browsers', icon: 'Globe' }),
    createMockCategory({ id: 'cat-2', name: 'Editors', slug: 'editors', icon: 'Code' }),
    createMockCategory({ id: 'cat-3', name: 'Games', slug: 'games', icon: 'Gamepad2' }),
  ];

  const mockOnCategoryChange = vi.fn();
  const mockOnToggle = vi.fn();

  const defaultProps = {
    categories: mockCategories,
    selectedCategory: 'all',
    onCategoryChange: mockOnCategoryChange,
    isOpen: false,
    onToggle: mockOnToggle,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render All Apps button', () => {
      render(<CategorySidebar {...defaultProps} />);

      // Component renders both mobile and desktop versions, so use getAllByRole and find by data-category-id
      const allButtons = screen.getAllByRole('button', { name: /all apps/i });
      const allAppsButton = allButtons.find(btn => btn.getAttribute('data-category-id') === 'all');
      expect(allAppsButton).toBeInTheDocument();
    });

    it('should render all category buttons', () => {
      render(<CategorySidebar {...defaultProps} />);

      // Use data-category-id to find the actual category buttons (not mobile sheet trigger)
      const browsersButton = screen.getByRole('button', { name: /browsers/i }).closest('[data-category-id="cat-1"]');
      const editorsButton = screen.getByRole('button', { name: /editors/i }).closest('[data-category-id="cat-2"]');
      const gamesButton = screen.getByRole('button', { name: /games/i }).closest('[data-category-id="cat-3"]');

      expect(browsersButton).toBeInTheDocument();
      expect(editorsButton).toBeInTheDocument();
      expect(gamesButton).toBeInTheDocument();
    });

    it('should render category icons', () => {
      render(<CategorySidebar {...defaultProps} />);

      expect(screen.getAllByTestId(/category-icon-/)).toHaveLength(3);
      expect(screen.getByTestId('category-icon-Globe')).toBeInTheDocument();
      expect(screen.getByTestId('category-icon-Code')).toBeInTheDocument();
      expect(screen.getByTestId('category-icon-Gamepad2')).toBeInTheDocument();
    });

    it('should have navigation role on category list', () => {
      render(<CategorySidebar {...defaultProps} />);

      const nav = screen.getByRole('navigation', { name: /category navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('active state', () => {
    it('should highlight "All Apps" when selectedCategory is "all"', () => {
      render(<CategorySidebar {...defaultProps} selectedCategory="all" />);

      // Find the button with data-category-id="all" (not the mobile sheet trigger)
      const allButtons = screen.getAllByRole('button', { name: /all apps/i });
      const allAppsButton = allButtons.find(btn => btn.getAttribute('data-category-id') === 'all');
      expect(allAppsButton).toHaveAttribute('aria-current', 'page');
    });

    it('should highlight selected category', () => {
      render(<CategorySidebar {...defaultProps} selectedCategory="cat-1" />);

      // Use querySelector to find the button with data-category-id
      const browsersButton = document.querySelector('[data-category-id="cat-1"]');
      expect(browsersButton).toHaveAttribute('aria-current', 'page');
    });

    it('should not highlight non-selected categories', () => {
      render(<CategorySidebar {...defaultProps} selectedCategory="cat-1" />);

      const editorsButton = document.querySelector('[data-category-id="cat-2"]');
      const gamesButton = document.querySelector('[data-category-id="cat-3"]');

      expect(editorsButton).not.toHaveAttribute('aria-current');
      expect(gamesButton).not.toHaveAttribute('aria-current');
    });
  });

  describe('interactions', () => {
    it('should call onCategoryChange with "all" when clicking All Apps', () => {
      render(<CategorySidebar {...defaultProps} selectedCategory="cat-1" />);

      const allButton = screen.getByRole('button', { name: /all apps/i });
      fireEvent.click(allButton);

      expect(mockOnCategoryChange).toHaveBeenCalledWith('all');
      expect(mockOnCategoryChange).toHaveBeenCalledTimes(1);
    });

    it('should call onCategoryChange with category id when clicking category', () => {
      render(<CategorySidebar {...defaultProps} />);

      const browsersButton = screen.getByRole('button', { name: /browsers/i });
      fireEvent.click(browsersButton);

      expect(mockOnCategoryChange).toHaveBeenCalledWith('cat-1');
    });

    it('should handle clicking multiple categories', () => {
      render(<CategorySidebar {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /browsers/i }));
      fireEvent.click(screen.getByRole('button', { name: /editors/i }));
      fireEvent.click(screen.getByRole('button', { name: /games/i }));

      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(1, 'cat-1');
      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(2, 'cat-2');
      expect(mockOnCategoryChange).toHaveBeenNthCalledWith(3, 'cat-3');
      expect(mockOnCategoryChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('data attributes', () => {
    it('should add data-category-id to all buttons', () => {
      render(<CategorySidebar {...defaultProps} />);

      // Use querySelector to find buttons by data-category-id
      const allButton = document.querySelector('[data-category-id="all"]');
      const browsersButton = document.querySelector('[data-category-id="cat-1"]');

      expect(allButton).toBeInTheDocument();
      expect(allButton).toHaveAttribute('data-category-id', 'all');
      expect(browsersButton).toBeInTheDocument();
      expect(browsersButton).toHaveAttribute('data-category-id', 'cat-1');
    });
  });

  describe('accessibility', () => {
    it('should have aria-current on selected category', () => {
      render(<CategorySidebar {...defaultProps} selectedCategory="cat-2" />);

      const editorsButton = document.querySelector('[data-category-id="cat-2"]');
      expect(editorsButton).toHaveAttribute('aria-current', 'page');
    });

    it('should have accessible navigation label', () => {
      render(<CategorySidebar {...defaultProps} />);

      const nav = screen.getByRole('navigation', { name: /category navigation/i });
      expect(nav).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty categories array', () => {
      render(<CategorySidebar {...defaultProps} categories={[]} />);

      // Use querySelector to find the button with data-category-id
      const allButton = document.querySelector('[data-category-id="all"]');
      expect(allButton).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /browsers/i })).not.toBeInTheDocument();
    });

    it('should handle single category', () => {
      const singleCategory = [mockCategories[0]];
      render(<CategorySidebar {...defaultProps} categories={singleCategory} />);

      const allButton = document.querySelector('[data-category-id="all"]');
      const browsersButton = document.querySelector('[data-category-id="cat-1"]');

      expect(allButton).toBeInTheDocument();
      expect(browsersButton).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /editors/i })).not.toBeInTheDocument();
    });

    it('should handle very long category names', () => {
      const longNameCategory = createMockCategory({
        id: 'long',
        name: 'Very Very Very Very Long Category Name That Should Wrap',
        slug: 'long',
      });

      render(<CategorySidebar {...defaultProps} categories={[longNameCategory]} />);

      expect(
        screen.getByRole('button', { name: /Very Very Very Very Long Category Name/i })
      ).toBeInTheDocument();
    });

    it('should handle missing onToggle callback', () => {
      const { onToggle, ...propsWithoutToggle } = defaultProps;
      render(<CategorySidebar {...propsWithoutToggle} />);

      const allButton = document.querySelector('[data-category-id="all"]');
      expect(allButton).toBeInTheDocument();
    });
  });
});
