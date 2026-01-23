import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStorage } from "@/lib/storage";

export type MainView = "colors" | "graph";
export type ColorSubView = "palette" | "scale" | "how-it-works";
export type GraphSubView = "tree" | "graph" | "rules";

interface ViewState {
  // Main view state
  mainView: MainView;
  
  // Sub-view states
  colorSubView: ColorSubView;
  graphSubView: GraphSubView;
  
  // Actions
  setMainView: (view: MainView) => void;
  setColorSubView: (view: ColorSubView) => void;
  setGraphSubView: (view: GraphSubView) => void;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      mainView: "colors",
      colorSubView: "palette",
      graphSubView: "graph",
      
      setMainView: (view) => set({ mainView: view }),
      setColorSubView: (view) => set({ colorSubView: view }),
      setGraphSubView: (view) => set({ graphSubView: view }),
    }),
    {
      name: "varcar-view-state",
      storage: createJSONStorage(() => safeStorage),
    }
  )
);
