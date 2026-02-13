import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilters } from './use-filters';

describe('useFilters', () => {
  describe('initial state', () => {
    it('should return default values when no options provided', () => {
      const { result } = renderHook(() => useFilters());

      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.showPopular).toBe(false);
    });

    it('should return custom initial category', () => {
      const { result } = renderHook(() =>
        useFilters({ initialCategory: 'browsers' })
      );

      expect(result.current.selectedCategory).toBe('browsers');
    });

    it('should return custom initial search', () => {
      const { result } = renderHook(() =>
        useFilters({ initialSearch: 'firefox' })
      );

      expect(result.current.searchQuery).toBe('firefox');
    });

    it('should return custom initial popular', () => {
      const { result } = renderHook(() =>
        useFilters({ initialPopular: true })
      );

      expect(result.current.showPopular).toBe(true);
    });

    it('should accept all custom initial values', () => {
      const { result } = renderHook(() =>
        useFilters({
          initialCategory: 'development',
          initialSearch: 'vscode',
          initialPopular: true,
        })
      );

      expect(result.current.selectedCategory).toBe('development');
      expect(result.current.searchQuery).toBe('vscode');
      expect(result.current.showPopular).toBe(true);
    });

    it('should accept empty options object', () => {
      const { result } = renderHook(() => useFilters({}));

      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.showPopular).toBe(false);
    });
  });

  describe('setSelectedCategory', () => {
    it('should update selected category', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSelectedCategory('games');
      });

      expect(result.current.selectedCategory).toBe('games');
    });

    it('should allow changing category multiple times', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSelectedCategory('browsers');
      });
      expect(result.current.selectedCategory).toBe('browsers');

      act(() => {
        result.current.setSelectedCategory('development');
      });
      expect(result.current.selectedCategory).toBe('development');

      act(() => {
        result.current.setSelectedCategory('all');
      });
      expect(result.current.selectedCategory).toBe('all');
    });

    it('should not affect other state values', () => {
      const { result } = renderHook(() =>
        useFilters({
          initialSearch: 'test',
          initialPopular: true,
        })
      );

      act(() => {
        result.current.setSelectedCategory('utilities');
      });

      expect(result.current.selectedCategory).toBe('utilities');
      expect(result.current.searchQuery).toBe('test');
      expect(result.current.showPopular).toBe(true);
    });
  });

  describe('setSearchQuery', () => {
    it('should update search query', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearchQuery('chrome');
      });

      expect(result.current.searchQuery).toBe('chrome');
    });

    it('should handle empty string', () => {
      const { result } = renderHook(() =>
        useFilters({ initialSearch: 'firefox' })
      );

      act(() => {
        result.current.setSearchQuery('');
      });

      expect(result.current.searchQuery).toBe('');
    });

    it('should handle special characters', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearchQuery('c++ compiler');
      });

      expect(result.current.searchQuery).toBe('c++ compiler');
    });

    it('should handle unicode characters', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSearchQuery('日本語');
      });

      expect(result.current.searchQuery).toBe('日本語');
    });

    it('should not affect other state values', () => {
      const { result } = renderHook(() =>
        useFilters({
          initialCategory: 'games',
          initialPopular: true,
        })
      );

      act(() => {
        result.current.setSearchQuery('steam');
      });

      expect(result.current.searchQuery).toBe('steam');
      expect(result.current.selectedCategory).toBe('games');
      expect(result.current.showPopular).toBe(true);
    });
  });

  describe('setShowPopular', () => {
    it('should set showPopular to true', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setShowPopular(true);
      });

      expect(result.current.showPopular).toBe(true);
    });

    it('should set showPopular to false', () => {
      const { result } = renderHook(() =>
        useFilters({ initialPopular: true })
      );

      act(() => {
        result.current.setShowPopular(false);
      });

      expect(result.current.showPopular).toBe(false);
    });

    it('should not affect other state values', () => {
      const { result } = renderHook(() =>
        useFilters({
          initialCategory: 'browsers',
          initialSearch: 'firefox',
        })
      );

      act(() => {
        result.current.setShowPopular(true);
      });

      expect(result.current.showPopular).toBe(true);
      expect(result.current.selectedCategory).toBe('browsers');
      expect(result.current.searchQuery).toBe('firefox');
    });
  });

  describe('togglePopular', () => {
    it('should toggle from false to true', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.togglePopular();
      });

      expect(result.current.showPopular).toBe(true);
    });

    it('should toggle from true to false', () => {
      const { result } = renderHook(() =>
        useFilters({ initialPopular: true })
      );

      act(() => {
        result.current.togglePopular();
      });

      expect(result.current.showPopular).toBe(false);
    });

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.togglePopular();
      });
      expect(result.current.showPopular).toBe(true);

      act(() => {
        result.current.togglePopular();
      });
      expect(result.current.showPopular).toBe(false);

      act(() => {
        result.current.togglePopular();
      });
      expect(result.current.showPopular).toBe(true);
    });

    it('should not affect other state values', () => {
      const { result } = renderHook(() =>
        useFilters({
          initialCategory: 'development',
          initialSearch: 'vscode',
        })
      );

      act(() => {
        result.current.togglePopular();
      });

      expect(result.current.showPopular).toBe(true);
      expect(result.current.selectedCategory).toBe('development');
      expect(result.current.searchQuery).toBe('vscode');
    });
  });

  describe('clearFilters', () => {
    it('should reset all values to defaults', () => {
      const { result } = renderHook(() =>
        useFilters({
          initialCategory: 'browsers',
          initialSearch: 'firefox',
          initialPopular: true,
        })
      );

      // First modify all values
      act(() => {
        result.current.setSelectedCategory('games');
        result.current.setSearchQuery('steam');
        result.current.setShowPopular(false);
      });

      // Then clear
      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.showPopular).toBe(false);
    });

    it('should work when already at default values', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.showPopular).toBe(false);
    });

    it('should allow setting new values after clear', () => {
      const { result } = renderHook(() =>
        useFilters({
          initialCategory: 'browsers',
          initialSearch: 'chrome',
          initialPopular: true,
        })
      );

      act(() => {
        result.current.clearFilters();
      });

      act(() => {
        result.current.setSelectedCategory('utilities');
        result.current.setSearchQuery('htop');
        result.current.setShowPopular(true);
      });

      expect(result.current.selectedCategory).toBe('utilities');
      expect(result.current.searchQuery).toBe('htop');
      expect(result.current.showPopular).toBe(true);
    });
  });

  describe('return value stability', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useFilters());

      expect(result.current).toHaveProperty('selectedCategory');
      expect(result.current).toHaveProperty('setSelectedCategory');
      expect(result.current).toHaveProperty('searchQuery');
      expect(result.current).toHaveProperty('setSearchQuery');
      expect(result.current).toHaveProperty('showPopular');
      expect(result.current).toHaveProperty('setShowPopular');
      expect(result.current).toHaveProperty('togglePopular');
      expect(result.current).toHaveProperty('clearFilters');
    });

    it('should have stable function references', () => {
      const { result, rerender } = renderHook(() => useFilters());

      const initialTogglePopular = result.current.togglePopular;
      const initialClearFilters = result.current.clearFilters;

      rerender();

      expect(result.current.togglePopular).toBe(initialTogglePopular);
      expect(result.current.clearFilters).toBe(initialClearFilters);
    });
  });

  describe('combined operations', () => {
    it('should handle multiple state changes in sequence', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSelectedCategory('browsers');
      });

      act(() => {
        result.current.setSearchQuery('firefox');
      });

      act(() => {
        result.current.togglePopular();
      });

      expect(result.current.selectedCategory).toBe('browsers');
      expect(result.current.searchQuery).toBe('firefox');
      expect(result.current.showPopular).toBe(true);
    });

    it('should handle clear after multiple changes', () => {
      const { result } = renderHook(() => useFilters());

      act(() => {
        result.current.setSelectedCategory('games');
        result.current.setSearchQuery('minecraft');
        result.current.setShowPopular(true);
      });

      expect(result.current.selectedCategory).toBe('games');
      expect(result.current.searchQuery).toBe('minecraft');
      expect(result.current.showPopular).toBe(true);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.selectedCategory).toBe('all');
      expect(result.current.searchQuery).toBe('');
      expect(result.current.showPopular).toBe(false);
    });
  });
});
