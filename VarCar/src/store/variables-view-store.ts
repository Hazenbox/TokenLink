/**
 * Variables View Store
 * State management for Figma-style variables UI
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';

interface VariablesViewState {
  // Active filters
  activeCollectionId: string | null;
  activeGroupId: string | null; // 'all' or specific group ID
  
  // Sidebar states
  collectionsCollapsed: boolean;
  groupsCollapsed: boolean;
  
  // Config panel states
  configPanelCollapsed: boolean;
  configPanelWidth: number;
  
  // Collections/Groups split ratio
  collectionsGroupsSplitRatio: number;
  
  // Search
  searchQuery: string;
  
  // Groups sidebar accordion state
  expandedGroups: Set<string>; // groupIds that are expanded in sidebar
  selectedStep: string | 'all'; // Selected step within group ("2500", "2400", "all")
  
  // Actions
  setActiveCollection: (id: string | null) => void;
  setActiveGroup: (id: string | null) => void;
  toggleCollectionsSidebar: () => void;
  toggleGroupsSidebar: () => void;
  toggleConfigPanel: () => void;
  setConfigPanelWidth: (width: number) => void;
  setCollectionsGroupsSplitRatio: (ratio: number) => void;
  setSearchQuery: (query: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  setSelectedStep: (step: string | 'all') => void;
  expandAllGroups: () => void;
  collapseAllGroups: () => void;
  
  // Reset
  reset: () => void;
}

export const useVariablesViewStore = create<VariablesViewState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeCollectionId: null,
      activeGroupId: 'all',
      collectionsCollapsed: false,
      groupsCollapsed: false,
      configPanelCollapsed: false,
      configPanelWidth: 300,
      collectionsGroupsSplitRatio: 0.5,
      searchQuery: '',
      expandedGroups: new Set(),
      selectedStep: 'all',
      
      // Set active collection
      setActiveCollection: (id: string | null) => {
        set({
          activeCollectionId: id,
          activeGroupId: 'all' // Reset to 'all' when switching collections
        });
      },
      
      // Set active group
      setActiveGroup: (id: string | null) => {
        set({ 
          activeGroupId: id || 'all',
          selectedStep: 'all' // Reset step when changing groups
        });
      },
      
      // Toggle collections sidebar
      toggleCollectionsSidebar: () => {
        set((state) => ({ collectionsCollapsed: !state.collectionsCollapsed }));
      },
      
      // Toggle groups sidebar
      toggleGroupsSidebar: () => {
        set((state) => ({ groupsCollapsed: !state.groupsCollapsed }));
      },
      
      // Toggle config panel
      toggleConfigPanel: () => {
        set((state) => ({ configPanelCollapsed: !state.configPanelCollapsed }));
      },
      
      // Set config panel width
      setConfigPanelWidth: (width: number) => {
        const clampedWidth = Math.max(280, Math.min(500, width));
        set({ configPanelWidth: clampedWidth });
      },
      
      // Set collections/groups split ratio
      setCollectionsGroupsSplitRatio: (ratio: number) => {
        const clampedRatio = Math.max(0.2, Math.min(0.8, ratio));
        set({ collectionsGroupsSplitRatio: clampedRatio });
      },
      
      // Set search query
      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },
      
      // Toggle group expanded state
      toggleGroupExpanded: (groupId: string) => {
        set((state) => {
          const newExpanded = new Set(state.expandedGroups);
          if (newExpanded.has(groupId)) {
            newExpanded.delete(groupId);
          } else {
            newExpanded.add(groupId);
          }
          return { expandedGroups: newExpanded };
        });
      },
      
      // Expand all groups
      expandAllGroups: () => {
        const { useBrandStore } = require('@/store/brand-store');
        const groups = useBrandStore.getState().figmaGroups;
        set({ expandedGroups: new Set(groups.map((g: any) => g.id)) });
      },
      
      // Collapse all groups
      collapseAllGroups: () => {
        set({ expandedGroups: new Set() });
      },
      
      // Set selected step
      setSelectedStep: (step: string | 'all') => {
        set({ selectedStep: step });
      },
      
      // Reset all state
      reset: () => {
        set({
          activeCollectionId: null,
          activeGroupId: 'all',
          collectionsCollapsed: false,
          groupsCollapsed: false,
          configPanelCollapsed: false,
          configPanelWidth: 320,
          collectionsGroupsSplitRatio: 0.5,
          searchQuery: '',
          expandedGroups: new Set(),
          selectedStep: 'all'
        });
      }
    }),
    {
      name: 'varcar-variables-view',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        activeCollectionId: state.activeCollectionId,
        activeGroupId: state.activeGroupId,
        collectionsCollapsed: state.collectionsCollapsed,
        groupsCollapsed: state.groupsCollapsed,
        configPanelCollapsed: state.configPanelCollapsed,
        configPanelWidth: state.configPanelWidth,
        collectionsGroupsSplitRatio: state.collectionsGroupsSplitRatio,
        selectedStep: state.selectedStep,
        expandedGroups: Array.from(state.expandedGroups) // Convert Set to Array for JSON
      }),
      // Rehydrate Set from Array
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray((state as any).expandedGroups)) {
          state.expandedGroups = new Set((state as any).expandedGroups);
        }
      }
    }
  )
);
