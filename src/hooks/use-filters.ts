/**
 * Custom hook for managing filter state (category, search, popular)
 *
 * Extracted from home-page-client.tsx to reduce complexity
 * Consolidates 3 state variables and their handlers into a single hook
 */

import { useState, useCallback } from 'react';

export interface UseFiltersOptions {
  initialCategory?: string;
  initialSearch?: string;
  initialPopular?: boolean;
}

export interface UseFiltersReturn {
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showPopular: boolean;
  setShowPopular: (show: boolean) => void;
  togglePopular: () => void;
  clearFilters: () => void;
}

/**
 * Hook to manage filter state for the home page
 */
export function useFilters(options: UseFiltersOptions = {}): UseFiltersReturn {
  const {
    initialCategory = 'all',
    initialSearch = '',
    initialPopular = false,
  } = options;

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showPopular, setShowPopular] = useState(initialPopular);

  const togglePopular = useCallback(() => {
    setShowPopular((prev) => !prev);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategory('all');
    setSearchQuery('');
    setShowPopular(false);
  }, []);

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    showPopular,
    setShowPopular,
    togglePopular,
    clearFilters,
  };
}