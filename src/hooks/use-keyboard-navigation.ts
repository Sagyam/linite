'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelectionStore } from '@/stores/selection-store';
import type { ViewMode } from '@/stores/selection-store';
import type { App } from '@/hooks/use-apps';
import type { Category } from '@/types';

interface UseKeyboardNavigationProps {
  apps: App[];
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (id: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  distroTriggerRef?: React.RefObject<HTMLButtonElement | null>;
  sourceTriggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export function useKeyboardNavigation({
  apps,
  categories,
  selectedCategory,
  onCategoryChange,
  searchInputRef,
  distroTriggerRef,
  sourceTriggerRef,
}: UseKeyboardNavigationProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [visualModeStart, setVisualModeStart] = useState<number | null>(null);
  const lastGPressTime = useRef<number>(0);

  const {
    focusedAppIndex,
    setFocusedAppIndex,
    viewMode,
    setViewMode,
    cycleViewMode,
    toggleApp,
    selectApp,
    deselectApp,
  } = useSelectionStore();

  // Navigate to previous category
  const navigateCategoryPrev = useCallback(() => {
    const allCategories = ['all', ...categories.map((c) => c.id)];
    const currentIndex = allCategories.indexOf(selectedCategory);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : allCategories.length - 1;
    onCategoryChange(allCategories[prevIndex]);
  }, [categories, selectedCategory, onCategoryChange]);

  // Navigate to next category
  const navigateCategoryNext = useCallback(() => {
    const allCategories = ['all', ...categories.map((c) => c.id)];
    const currentIndex = allCategories.indexOf(selectedCategory);
    const nextIndex = (currentIndex + 1) % allCategories.length;
    onCategoryChange(allCategories[nextIndex]);
  }, [categories, selectedCategory, onCategoryChange]);

  // Handle visual mode selection
  const handleVisualModeSelect = useCallback(() => {
    if (visualModeStart !== null && focusedAppIndex >= 0) {
      const start = Math.min(visualModeStart, focusedAppIndex);
      const end = Math.max(visualModeStart, focusedAppIndex);

      for (let i = start; i <= end; i++) {
        if (apps[i]) {
          selectApp(apps[i].id);
        }
      }

      setVisualModeStart(null);
    }
  }, [visualModeStart, focusedAppIndex, apps, selectApp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea (except Escape)
      const target = e.target as HTMLElement;
      const isInputField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

      if (isInputField && e.key !== 'Escape') {
        return;
      }

      // Handle Escape key when in input
      if (isInputField && e.key === 'Escape') {
        e.preventDefault();
        target.blur();
        return;
      }

      switch (e.key) {
        // Navigation: Move down
        case 'j':
          e.preventDefault();
          setFocusedAppIndex(Math.min(focusedAppIndex + 1, apps.length - 1));
          break;

        // Navigation: Move up
        case 'k':
          e.preventDefault();
          setFocusedAppIndex(Math.max(focusedAppIndex - 1, 0));
          break;

        // Navigation: Previous category
        case 'h':
          e.preventDefault();
          navigateCategoryPrev();
          break;

        // Navigation: Next category
        case 'l':
          e.preventDefault();
          navigateCategoryNext();
          break;

        // Navigation: Jump to top or bottom
        case 'g':
          if (e.shiftKey) {
            // G - Jump to bottom
            e.preventDefault();
            setFocusedAppIndex(apps.length - 1);
          } else {
            // gg - Jump to top (double-tap detection)
            const now = Date.now();
            if (now - lastGPressTime.current < 500) {
              e.preventDefault();
              setFocusedAppIndex(0);
              lastGPressTime.current = 0;
            } else {
              lastGPressTime.current = now;
            }
          }
          break;

        // Selection: Toggle selection
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (focusedAppIndex >= 0 && apps[focusedAppIndex]) {
            toggleApp(apps[focusedAppIndex].id);
          }
          break;

        // Selection: Remove from selection
        case 'x':
          e.preventDefault();
          if (focusedAppIndex >= 0 && apps[focusedAppIndex]) {
            deselectApp(apps[focusedAppIndex].id);
          }
          break;

        // Selection: Enter visual mode
        case 'v':
          e.preventDefault();
          if (visualModeStart === null) {
            setVisualModeStart(focusedAppIndex);
          } else {
            handleVisualModeSelect();
          }
          break;

        // Search: Focus search
        case '/':
          e.preventDefault();
          searchInputRef.current?.focus();
          break;

        // Configuration: Focus distro selector
        case 'd':
          e.preventDefault();
          distroTriggerRef?.current?.click();
          break;

        // Configuration: Focus source selector
        case 's':
          e.preventDefault();
          sourceTriggerRef?.current?.click();
          break;

        // Help: Show shortcuts
        case '?':
          e.preventDefault();
          setShowShortcuts(true);
          break;

        // View: Cycle view modes
        case 'Tab':
          e.preventDefault();
          cycleViewMode();
          break;

        // View: Minimal
        case '1':
          e.preventDefault();
          setViewMode('minimal');
          break;

        // View: Compact
        case '2':
          e.preventDefault();
          setViewMode('compact');
          break;

        // View: Detailed
        case '3':
          e.preventDefault();
          setViewMode('detailed');
          break;

        // View: Toggle minimal
        case 'm':
          e.preventDefault();
          setViewMode(viewMode === 'minimal' ? 'detailed' : 'minimal');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    apps,
    focusedAppIndex,
    setFocusedAppIndex,
    viewMode,
    setViewMode,
    cycleViewMode,
    toggleApp,
    deselectApp,
    navigateCategoryPrev,
    navigateCategoryNext,
    searchInputRef,
    visualModeStart,
    handleVisualModeSelect,
  ]);

  // Reset focus when apps list changes (filters applied)
  useEffect(() => {
    setFocusedAppIndex(-1);
    setVisualModeStart(null);
  }, [apps.length, setFocusedAppIndex]);

  return {
    showShortcuts,
    setShowShortcuts,
    visualModeStart,
  };
}
