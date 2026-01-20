import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'minimal' | 'compact' | 'detailed';
export type CommandMode = 'install' | 'uninstall';

interface SelectionState {
  // Selected app IDs
  selectedApps: Set<string>;

  // Selected app categories (appId -> categoryId)
  selectedAppCategories: Map<string, string>;

  // Selected distro slug
  selectedDistro: string | null;

  // Source preference (flatpak, snap, etc.)
  sourcePreference: string | null;

  // NixOS installation method (only applies when distro is NixOS)
  nixosInstallMethod: 'nix-shell' | 'nix-env' | 'nix-flakes' | null;

  // View mode (minimal, compact, detailed)
  viewMode: ViewMode;

  // Command mode (install or uninstall)
  mode: CommandMode;

  // Keyboard navigation focused app index
  focusedAppIndex: number;

  // Category navigation open state (for mobile)
  isCategoryNavOpen: boolean;

  // Actions
  toggleApp: (appId: string, categoryId: string) => void;
  selectApp: (appId: string, categoryId: string) => void;
  deselectApp: (appId: string) => void;
  setApps: (appIds: string[], categories: Map<string, string>) => void;
  clearApps: () => void;
  setDistro: (distroSlug: string | null) => void;
  setSourcePreference: (source: string | null) => void;
  setNixosInstallMethod: (method: 'nix-shell' | 'nix-env' | 'nix-flakes' | null) => void;
  setViewMode: (mode: ViewMode) => void;
  cycleViewMode: () => void;
  setMode: (mode: CommandMode) => void;
  toggleMode: () => void;
  setFocusedAppIndex: (index: number) => void;
  toggleCategoryNav: () => void;
  reset: () => void;

  // Computed
  hasSelection: () => boolean;
  getSelectedAppIds: () => string[];
  getCategoryCounts: () => Map<string, number>;
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      selectedApps: new Set<string>(),
      selectedAppCategories: new Map<string, string>(),
      selectedDistro: null,
      sourcePreference: null,
      nixosInstallMethod: null,
      viewMode: 'minimal' as ViewMode,
      mode: 'install' as CommandMode,
      focusedAppIndex: -1,
      isCategoryNavOpen: false,

      toggleApp: (appId: string, categoryId: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedApps);
          const newCategories = new Map(state.selectedAppCategories);

          if (newSelected.has(appId)) {
            newSelected.delete(appId);
            newCategories.delete(appId);
          } else {
            newSelected.add(appId);
            newCategories.set(appId, categoryId);
          }
          return { selectedApps: newSelected, selectedAppCategories: newCategories };
        });
      },

      selectApp: (appId: string, categoryId: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedApps);
          const newCategories = new Map(state.selectedAppCategories);
          newSelected.add(appId);
          newCategories.set(appId, categoryId);
          return { selectedApps: newSelected, selectedAppCategories: newCategories };
        });
      },

      deselectApp: (appId: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedApps);
          const newCategories = new Map(state.selectedAppCategories);
          newSelected.delete(appId);
          newCategories.delete(appId);
          return { selectedApps: newSelected, selectedAppCategories: newCategories };
        });
      },

      setApps: (appIds: string[], categories: Map<string, string>) => {
        set({ selectedApps: new Set(appIds), selectedAppCategories: new Map(categories) });
      },

      clearApps: () => {
        set({ selectedApps: new Set<string>(), selectedAppCategories: new Map<string, string>() });
      },

      setDistro: (distroSlug: string | null) => {
        set({ selectedDistro: distroSlug });
      },

      setSourcePreference: (source: string | null) => {
        set({ sourcePreference: source });
      },

      setNixosInstallMethod: (method: 'nix-shell' | 'nix-env' | 'nix-flakes' | null) => {
        set({ nixosInstallMethod: method });
      },

      setViewMode: (mode: ViewMode) => {
        set({ viewMode: mode });
      },

      cycleViewMode: () => {
        const modes: ViewMode[] = ['minimal', 'compact', 'detailed'];
        const currentIndex = modes.indexOf(get().viewMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        set({ viewMode: modes[nextIndex] });
      },

      setMode: (mode: CommandMode) => {
        set({ mode });
      },

      toggleMode: () => {
        const newMode: CommandMode = get().mode === 'install' ? 'uninstall' : 'install';
        set({ mode: newMode });
      },

      setFocusedAppIndex: (index: number) => {
        set({ focusedAppIndex: index });
      },

      toggleCategoryNav: () => {
        set((state) => ({ isCategoryNavOpen: !state.isCategoryNavOpen }));
      },

      reset: () => {
        set({
          selectedApps: new Set<string>(),
          selectedAppCategories: new Map<string, string>(),
          selectedDistro: null,
          sourcePreference: null,
          nixosInstallMethod: null,
          viewMode: 'minimal' as ViewMode,
          mode: 'install' as CommandMode,
          focusedAppIndex: -1,
          isCategoryNavOpen: false,
        });
      },

      hasSelection: () => {
        return get().selectedApps.size > 0 && get().selectedDistro !== null;
      },

      getSelectedAppIds: () => {
        return Array.from(get().selectedApps);
      },

      getCategoryCounts: () => {
        const counts = new Map<string, number>();
        get().selectedAppCategories.forEach((categoryId) => {
          counts.set(categoryId, (counts.get(categoryId) || 0) + 1);
        });
        return counts;
      },
    }),
    {
      name: 'linite-selection',
      // Custom storage to handle Set and Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            state: {
              ...data.state,
              selectedApps: new Set(data.state.selectedApps || []),
              selectedAppCategories: new Map(data.state.selectedAppCategories || []),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            state: {
              ...value.state,
              selectedApps: Array.from(value.state.selectedApps),
              selectedAppCategories: Array.from(value.state.selectedAppCategories),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
