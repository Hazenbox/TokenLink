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
  
  // Actions
  setActiveCollection: (id: string | null) => void;
  setActiveGroup: (id: string | null) => void;
  toggleCollectionsSidebar: () => void;
  toggleGroupsSidebar: () => void;
  setSearchQuery: (query: string) => void;
  
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
      
      // Set active collection
      setActiveCollection: (id: string | null) => {
        set({
          activeCollectionId: id,
          activeGroupId: 'all' // Reset to 'all' when switching collections
        });
      },
      
      // Set active group
      setActiveGroup: (id: string | null) => {
        set({ activeGroupId: id || 'all' });
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
      
      // Reset all state
      reset: () => {
        set({
          activeCollectionId: null,
          activeGroupId: 'all',
          collectionsCollapsed: false,
          groupsCollapsed: false,
          searchQuery: ''
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
        groupsCollapsed: state.groupsCollapsed
      })
    }
  )
);
