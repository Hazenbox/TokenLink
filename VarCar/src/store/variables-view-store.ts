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
