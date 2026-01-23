import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '@/lib/storage';

export type MainView = 'colors' | 'graph';

export type ColorSubView = 'palette' | 'scale' | 'how-it-works';
export type GraphSubView = 'tree' | 'graph' | 'rules';

interface ViewState {
  mainView: MainView;
  colorSubView: ColorSubView;
  graphSubView: GraphSubView;
  
  // Actions
  setMainView: (view: MainView) => void;
  setColorSubView: (subView: ColorSubView) => void;
  setGraphSubView: (subView: GraphSubView) => void;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      mainView: 'colors',
      colorSubView: 'palette',
      graphSubView: 'graph',
      
      setMainView: (view) => set({ mainView: view }),
      setColorSubView: (subView) => set({ colorSubView: subView }),
      setGraphSubView: (subView) => set({ graphSubView: subView }),
    }),
    {
      name: 'varcar-view-state',
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
