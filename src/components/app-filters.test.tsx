import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test/component-utils';
import { AppFilters } from './app-filters';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

describe('AppFilters', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    showPopular: false,
    onTogglePopular: vi.fn(),
    onClearFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render search input', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('should render popular toggle button', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const popularButton = screen.getByRole('button', { name: /popular/i });
      expect(popularButton).toBeInTheDocument();
    });

    it('should render search input with current value', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="firefox" />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      expect(searchInput).toHaveValue('firefox');
    });

    it('should have keyboard shortcut hint in placeholder', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/press \/ to focus/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('search input', () => {
    it('should call onSearchChange when typing in search', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      fireEvent.change(searchInput, { target: { value: 'vscode' } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('vscode');
      expect(defaultProps.onSearchChange).toHaveBeenCalledTimes(1);
    });

    it('should call onSearchChange with empty string when clearing search', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="test" />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
    });

    it('should update value on multiple changes', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);

      fireEvent.change(searchInput, { target: { value: 'f' } });
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('f');

      fireEvent.change(searchInput, { target: { value: 'fi' } });
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('fi');

      fireEvent.change(searchInput, { target: { value: 'firefox' } });
      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('firefox');

      expect(defaultProps.onSearchChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('popular toggle', () => {
    it('should have outline variant when not active', () => {
      renderWithProviders(<AppFilters {...defaultProps} showPopular={false} />);

      const popularButton = screen.getByRole('button', { name: /popular/i });
      expect(popularButton).toHaveClass('border-input');
    });

    it('should have default variant when active', () => {
      renderWithProviders(<AppFilters {...defaultProps} showPopular={true} />);

      const popularButton = screen.getByRole('button', { name: /popular/i });
      expect(popularButton).not.toHaveClass('border-input');
    });

    it('should call onTogglePopular when clicked', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const popularButton = screen.getByRole('button', { name: /popular/i });
      fireEvent.click(popularButton);

      expect(defaultProps.onTogglePopular).toHaveBeenCalledTimes(1);
    });

    it('should be clickable multiple times', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const popularButton = screen.getByRole('button', { name: /popular/i });

      fireEvent.click(popularButton);
      fireEvent.click(popularButton);
      fireEvent.click(popularButton);

      expect(defaultProps.onTogglePopular).toHaveBeenCalledTimes(3);
    });

    it('should have aria-pressed attribute', () => {
      const { rerender } = renderWithProviders(<AppFilters {...defaultProps} showPopular={false} />);

      let popularButton = screen.getByRole('button', { name: /popular/i });
      expect(popularButton).toHaveAttribute('aria-pressed', 'false');

      rerender(<AppFilters {...defaultProps} showPopular={true} />);
      popularButton = screen.getByRole('button', { name: /popular/i });
      expect(popularButton).toHaveAttribute('aria-pressed', 'true');
    });
  });


  describe('clear filters button', () => {
    it('should not show clear button when no filters are active', () => {
      renderWithProviders(
        <AppFilters
          {...defaultProps}
          searchQuery=""
          showPopular={false}
        />
      );

      expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();
    });

    it('should show clear button when search filter is active', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="firefox" />);

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should show clear button when popular filter is active', () => {
      renderWithProviders(<AppFilters {...defaultProps} showPopular={true} />);

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should show clear button when both filters are active', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="test" showPopular={true} />);

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should call onClearFilters when clicking clear button', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="test" />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(defaultProps.onClearFilters).toHaveBeenCalledTimes(1);
    });

    it('should have aria-label for accessibility', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="test" />);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toHaveAttribute('aria-label', 'Clear filters');
    });
  });


  describe('edge cases', () => {
    it('should handle special characters in search', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      fireEvent.change(searchInput, { target: { value: '@#$%^&*()' } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith('@#$%^&*()');
    });

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(250);
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      fireEvent.change(searchInput, { target: { value: longQuery } });

      expect(defaultProps.onSearchChange).toHaveBeenCalledWith(longQuery);
    });

    it('should handle empty search query', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="" />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      expect(searchInput).toHaveValue('');
    });
  });

  describe('accessibility', () => {
    it('should have search input with type="search"', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      expect(searchInput).toHaveAttribute('type', 'search');
    });

    it('should have search input with aria-label', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/search applications/i);
      expect(searchInput).toHaveAttribute('aria-label', 'Search applications');
    });

    it('should have accessible button roles', () => {
      renderWithProviders(<AppFilters {...defaultProps} searchQuery="test" />);

      expect(screen.getByRole('button', { name: /popular/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should have aria-pressed on popular button', () => {
      renderWithProviders(<AppFilters {...defaultProps} showPopular={true} />);

      const popularButton = screen.getByRole('button', { name: /popular/i });
      expect(popularButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('responsive behavior', () => {
    it('should have responsive classes for search container', () => {
      renderWithProviders(<AppFilters {...defaultProps} />);

      const searchContainer = screen
        .getByPlaceholderText(/search applications/i)
        .closest('.flex-1');
      expect(searchContainer).toBeInTheDocument();
    });

    it('should have responsive layout for controls', () => {
      const { container } = renderWithProviders(<AppFilters {...defaultProps} />);

      const controlsContainer = container.querySelector('.flex-col.sm\\:flex-row');
      expect(controlsContainer).toBeInTheDocument();
    });
  });
});
