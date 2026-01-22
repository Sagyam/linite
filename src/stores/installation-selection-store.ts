import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface InstallationSelectionState {
  selectedInstallationIds: Set<string>;
  focusedRowIndex: number;

  toggleInstallation: (id: string) => void;
  selectInstallation: (id: string) => void;
  deselectInstallation: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  selectRange: (startId: string, endId: string, allIds: string[]) => void;
  setFocusedRowIndex: (index: number) => void;

  hasSelection: () => boolean;
  getSelectedIds: () => string[];
}

export const useInstallationSelectionStore = create<InstallationSelectionState>()(
  persist(
    (set, get) => ({
      selectedInstallationIds: new Set<string>(),
      focusedRowIndex: -1,

      toggleInstallation: (id: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedInstallationIds);

          if (newSelected.has(id)) {
            newSelected.delete(id);
          } else {
            newSelected.add(id);
          }
          return { selectedInstallationIds: newSelected };
        });
      },

      selectInstallation: (id: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedInstallationIds);
          newSelected.add(id);
          return { selectedInstallationIds: newSelected };
        });
      },

      deselectInstallation: (id: string) => {
        set((state) => {
          const newSelected = new Set(state.selectedInstallationIds);
          newSelected.delete(id);
          return { selectedInstallationIds: newSelected };
        });
      },

      selectAll: (ids: string[]) => {
        set({ selectedInstallationIds: new Set(ids) });
      },

      clearSelection: () => {
        set({ selectedInstallationIds: new Set<string>() });
      },

      selectRange: (startId: string, endId: string, allIds: string[]) => {
        const startIndex = allIds.indexOf(startId);
        const endIndex = allIds.indexOf(endId);

        if (startIndex === -1) {
          throw new Error(`startId "${startId}" not found in allIds`);
        }
        if (endIndex === -1) {
          throw new Error(`endId "${endId}" not found in allIds`);
        }

        const from = Math.min(startIndex, endIndex);
        const to = Math.max(startIndex, endIndex);
        const rangeIds = allIds.slice(from, to + 1);

        set({ selectedInstallationIds: new Set(rangeIds) });
      },

      setFocusedRowIndex: (index: number) => {
        set({ focusedRowIndex: index });
      },

      hasSelection: () => {
        return get().selectedInstallationIds.size > 0;
      },

      getSelectedIds: () => {
        return Array.from(get().selectedInstallationIds);
      },
    }),
    {
      name: 'linite-installation-selection',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          return {
            state: {
              ...data.state,
              selectedInstallationIds: new Set(data.state.selectedInstallationIds || []),
            },
          };
        },
        setItem: (name, value) => {
          const data = {
            state: {
              ...value.state,
              selectedInstallationIds: Array.from(value.state.selectedInstallationIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
