import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SelectionState {
  // Selected app IDs
  selectedApps: Set<string>;

  // Selected distro slug
  selectedDistro: string | null;

  // Source preference (flatpak, snap, etc.)
  sourcePreference: string | null;

  // Actions
  toggleApp: (appId: string) => void;
  selectApp: (appId: string) => void;
  deselectApp: (appId: string) => void;
  setApps: (appIds: string[]) => void;
  clearApps: () => void;
  setDistro: (distroSlug: string | null) => void;
  setSourcePreference: (source: string | null) => void;
  reset: () => void;

  // Computed
  hasSelection: () => boolean;
  getSelectedAppIds: () => string[];
}

export const useSelectionStore = create<SelectionState>()(
  persist(
    (set, get) => ({
      selectedApps: new Set<string>(),
      selectedDistro: null,
      sourcePreference: null,

      toggleApp: (appId: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedApps);
          if (newSelected.has(appId)) {
            newSelected.delete(appId);
          } else {
            newSelected.add(appId);
          }
          return { selectedApps: newSelected };
        });
      },

      selectApp: (appId: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedApps);
          newSelected.add(appId);
          return { selectedApps: newSelected };
        });
      },

      deselectApp: (appId: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedApps);
          newSelected.delete(appId);
          return { selectedApps: newSelected };
        });
      },

      setApps: (appIds: string[]) => {
        set({ selectedApps: new Set(appIds) });
      },

      clearApps: () => {
        set({ selectedApps: new Set<string>() });
      },

      setDistro: (distroSlug: string | null) => {
        set({ selectedDistro: distroSlug });
      },

      setSourcePreference: (source: string | null) => {
        set({ sourcePreference: source });
      },

      reset: () => {
        set({
          selectedApps: new Set<string>(),
          selectedDistro: null,
          sourcePreference: null,
        });
      },

      hasSelection: () => {
        return get().selectedApps.size > 0 && get().selectedDistro !== null;
      },

      getSelectedAppIds: () => {
        return Array.from(get().selectedApps);
      },
    }),
    {
      name: 'linite-selection',
      // Custom storage to handle Set serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            state: {
              ...data.state,
              selectedApps: new Set(data.state.selectedApps || []),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            state: {
              ...value.state,
              selectedApps: Array.from(value.state.selectedApps),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
