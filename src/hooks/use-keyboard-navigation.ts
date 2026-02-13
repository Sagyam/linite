'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useSelectionStore } from '@/stores/selection-store';
import { matchKeyboardCommand, isInputElement, type KeyboardCommandType } from '@/lib/keyboard-commands';
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
  onGenerateCommand?: () => void;
  onViewSelection?: () => void;
  onSaveInstallation?: () => void;
}

export function useKeyboardNavigation({
  apps,
  categories,
  selectedCategory,
  onCategoryChange,
  searchInputRef,
  distroTriggerRef,
  sourceTriggerRef,
  onGenerateCommand,
  onViewSelection,
  onSaveInstallation,
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
          selectApp(apps[i].id, apps[i].categoryId);
        }
      }

      setVisualModeStart(null);
    }
  }, [visualModeStart, focusedAppIndex, apps, selectApp]);

  // Command handler registry (EXTRACTED from switch statement)
  const handlers = useMemo(() => {
    const handlerMap: Record<KeyboardCommandType, () => void> = {
      // Navigation
      NAVIGATE_DOWN: () => setFocusedAppIndex(Math.min(focusedAppIndex + 1, apps.length - 1)),
      NAVIGATE_UP: () => setFocusedAppIndex(Math.max(focusedAppIndex - 1, 0)),
      NAVIGATE_PREV_CATEGORY: navigateCategoryPrev,
      NAVIGATE_NEXT_CATEGORY: navigateCategoryNext,
      JUMP_TO_TOP: () => setFocusedAppIndex(0),
      JUMP_TO_TOP_DOUBLE: () => {
        setFocusedAppIndex(0);
        lastGPressTime.current = 0;
      },
      JUMP_TO_BOTTOM: () => setFocusedAppIndex(apps.length - 1),

      // Selection
      TOGGLE_SELECTION: () => {
        if (focusedAppIndex >= 0 && apps[focusedAppIndex]) {
          toggleApp(apps[focusedAppIndex].id, apps[focusedAppIndex].categoryId);
        }
      },
      REMOVE_SELECTION: () => {
        if (focusedAppIndex >= 0 && apps[focusedAppIndex]) {
          deselectApp(apps[focusedAppIndex].id);
        }
      },
      ENTER_VISUAL_MODE: () => {
        if (visualModeStart === null) {
          setVisualModeStart(focusedAppIndex);
        } else {
          handleVisualModeSelect();
        }
      },

      // Search
      FOCUS_SEARCH: () => searchInputRef.current?.focus(),

      // Configuration
      FOCUS_DISTRO: () => distroTriggerRef?.current?.click(),
      FOCUS_SOURCE: () => sourceTriggerRef?.current?.click(),

      // Actions
      GENERATE_COMMAND: () => onGenerateCommand?.(),
      VIEW_SELECTION: () => onViewSelection?.(),
      SAVE_INSTALLATION: () => onSaveInstallation?.(),

      // View modes
      CYCLE_VIEW_MODE: cycleViewMode,
      VIEW_MINIMAL: () => setViewMode('minimal'),
      VIEW_COMPACT: () => setViewMode('compact'),
      VIEW_DETAILED: () => setViewMode('detailed'),
      TOGGLE_MINIMAL: () => setViewMode(viewMode === 'minimal' ? 'detailed' : 'minimal'),

      // Help
      SHOW_SHORTCUTS: () => setShowShortcuts(true),

      // Special
      ESCAPE_INPUT: () => {
        if (isInputElement(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
      },
    };

    return handlerMap;
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
    onGenerateCommand,
    onViewSelection,
    onSaveInstallation,
    distroTriggerRef,
    sourceTriggerRef,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if typing in input/textarea (except Escape)
      const isInput = isInputElement(e.target);

      if (isInput && e.key !== 'Escape') {
        return;
      }

      // Handle Escape key when in input
      if (isInput && e.key === 'Escape') {
        e.preventDefault();
        handlers.ESCAPE_INPUT();
        return;
      }

      // Special handling for 'g' key (double-tap detection)
      if (e.key === 'g' && !e.shiftKey) {
        const now = Date.now();
        if (now - lastGPressTime.current < 500) {
          e.preventDefault();
          handlers.JUMP_TO_TOP_DOUBLE();
        } else {
          lastGPressTime.current = now;
        }
        return;
      }

      // Match keyboard command using registry
      const command = matchKeyboardCommand(e, lastGPressTime.current);

      if (command && handlers[command.type]) {
        e.preventDefault();
        handlers[command.type]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);

  // Reset focus when apps list changes (filters applied)
  useEffect(() => {
    // Intentionally reset state when apps list changes (e.g., after filtering)
    setFocusedAppIndex(-1);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisualModeStart(null);
  }, [apps.length, setFocusedAppIndex, setVisualModeStart]);

  return {
    showShortcuts,
    setShowShortcuts,
    visualModeStart,
  };
}
