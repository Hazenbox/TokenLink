import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Step, PaletteSteps, StepScales } from "@colors/color-utils";
import { generateAllScales, createDefaultPalette } from "@colors/scale-generator";
import { loadPalettesFromJSON } from "@colors/palette-loader";
import { safeStorage } from "@/lib/storage";

export type GeneratedScalesMap = Record<Step, StepScales | null>;

export interface Palette {
  id: string;
  name: string;
  steps: PaletteSteps;
  primaryStep: Step;
  createdAt: number;
}

type ViewMode = "palette" | "how-it-works" | "surface-stacking";

interface PaletteState {
  palettes: Palette[];
  activePaletteId: string | null;
  generatedScales: GeneratedScalesMap | null;
  viewMode: ViewMode;
  isFullscreen: boolean;

  // Actions
  createPalette: (name: string) => void;
  deletePalette: (id: string) => void;
  renamePalette: (id: string, name: string) => void;
  reorderPalettes: (startIndex: number, endIndex: number) => void;
  setActivePalette: (id: string) => void;
  updatePaletteStep: (paletteId: string, step: Step, hex: string) => void;
  updatePrimaryStep: (paletteId: string, step: Step) => void;
  regenerateScales: () => void;
  getActivePalette: () => Palette | null;
  duplicatePalette: (id: string) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleFullscreen: () => void;
  
  // New actions for Figma sync
  syncToFigmaVariables: () => Promise<void>;
  importFromFigmaVariables: (collectionId: string) => Promise<void>;
}

function generateId(): string {
  return `palette_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load default palettes from JSON file (Figma plugins always have window)
const DEFAULT_PALETTES = loadPalettesFromJSON();

// Fallback Indigo palette if JSON loading fails
const INDIGO_SAMPLE_PALETTE: Palette = {
  id: "sample_indigo_v2",
  name: "Sample - Indigo",
  primaryStep: 600,
  steps: {
    200: "#0b0034",
    300: "#170054",
    400: "#220071",
    500: "#2e008f",
    600: "#3900ad",
    700: "#421ebb",
    800: "#4c31cb",
    900: "#5540d8",
    1000: "#5f50e3",
    1100: "#685dec",
    1200: "#716bf3",
    1300: "#7c78f8",
    1400: "#8584fc",
    1500: "#8e90ff",
    1600: "#989bff",
    1700: "#a3a7ff",
    1800: "#aeb3ff",
    1900: "#b9beff",
    2000: "#c4c9ff",
    2100: "#d0d4ff",
    2200: "#dbdfff",
    2300: "#e7e9ff",
    2400: "#f3f4ff",
    2500: "#ffffff",
  } as PaletteSteps,
  createdAt: 0,
};

// Use loaded palettes or fallback to Indigo
const INITIAL_PALETTES = DEFAULT_PALETTES.length > 0
  ? DEFAULT_PALETTES
  : [INDIGO_SAMPLE_PALETTE];

const INITIAL_ACTIVE_PALETTE_ID = INITIAL_PALETTES[0]?.id || INDIGO_SAMPLE_PALETTE.id;

export const usePaletteStore = create<PaletteState>()(
  persist(
    (set, get) => {
      const initialPalette = INITIAL_PALETTES.find(p => p.id === INITIAL_ACTIVE_PALETTE_ID) || INITIAL_PALETTES[0];

      return {
        palettes: INITIAL_PALETTES,
        activePaletteId: INITIAL_ACTIVE_PALETTE_ID,
        generatedScales: initialPalette
          ? generateAllScales(initialPalette.steps, initialPalette.primaryStep)
          : null,
        viewMode: "palette" as ViewMode,
        isFullscreen: false,

        createPalette: (name: string) => {
          const newPalette: Palette = {
            id: generateId(),
            name,
            steps: createDefaultPalette(),
            primaryStep: 600,
            createdAt: Date.now()
          };

          set((state) => ({
            palettes: [...state.palettes, newPalette],
            activePaletteId: newPalette.id,
            generatedScales: generateAllScales(newPalette.steps, newPalette.primaryStep)
          }));
        },

        deletePalette: (id: string) => {
          set((state) => {
            const newPalettes = state.palettes.filter((p) => p.id !== id);
            const newActiveId = state.activePaletteId === id
              ? (newPalettes[0]?.id || null)
              : state.activePaletteId;

            const activePalette = newPalettes.find(p => p.id === newActiveId);

            return {
              palettes: newPalettes,
              activePaletteId: newActiveId,
              generatedScales: activePalette ? generateAllScales(activePalette.steps, activePalette.primaryStep) : null
            };
          });
        },

        renamePalette: (id: string, name: string) => {
          set((state) => ({
            palettes: state.palettes.map((p) =>
              p.id === id ? { ...p, name } : p
            )
          }));
        },

        reorderPalettes: (startIndex: number, endIndex: number) => {
          set((state) => {
            const newPalettes = Array.from(state.palettes);
            const [removed] = newPalettes.splice(startIndex, 1);
            newPalettes.splice(endIndex, 0, removed);
            return { palettes: newPalettes };
          });
        },

        setActivePalette: (id: string) => {
          const palette = get().palettes.find((p) => p.id === id);
          if (palette) {
            set({
              activePaletteId: id,
              generatedScales: generateAllScales(palette.steps, palette.primaryStep)
            });
          }
        },

        updatePaletteStep: (paletteId: string, step: Step, hex: string) => {
          set((state) => {
            const newPalettes = state.palettes.map((p) => {
              if (p.id === paletteId) {
                return {
                  ...p,
                  steps: { ...p.steps, [step]: hex }
                };
              }
              return p;
            });

            const updatedPalette = newPalettes.find((p) => p.id === paletteId);

            return {
              palettes: newPalettes,
              generatedScales: updatedPalette && state.activePaletteId === paletteId
                ? generateAllScales(updatedPalette.steps, updatedPalette.primaryStep)
                : state.generatedScales
            };
          });
        },

        updatePrimaryStep: (paletteId: string, step: Step) => {
          set((state) => {
            const newPalettes = state.palettes.map((p) => {
              if (p.id === paletteId) {
                return { ...p, primaryStep: step };
              }
              return p;
            });

            const updatedPalette = newPalettes.find((p) => p.id === paletteId);

            return {
              palettes: newPalettes,
              generatedScales: updatedPalette && state.activePaletteId === paletteId
                ? generateAllScales(updatedPalette.steps, updatedPalette.primaryStep)
                : state.generatedScales
            };
          });
        },

        regenerateScales: () => {
          const palette = get().getActivePalette();
          if (palette) {
            set({ generatedScales: generateAllScales(palette.steps, palette.primaryStep) });
          }
        },

        duplicatePalette: (id: string) => {
          const state = get();
          const paletteToDuplicate = state.palettes.find(p => p.id === id);
          if (!paletteToDuplicate) return;

          const newPalette: Palette = {
            ...paletteToDuplicate,
            id: generateId(),
            name: `${paletteToDuplicate.name} (Copy)`,
            createdAt: Date.now()
          };

          set((state) => ({
            palettes: [...state.palettes, newPalette],
            activePaletteId: newPalette.id,
            generatedScales: generateAllScales(newPalette.steps, newPalette.primaryStep)
          }));
        },

        getActivePalette: () => {
          const state = get();
          return state.palettes.find((p) => p.id === state.activePaletteId) || null;
        },

        setViewMode: (mode: ViewMode) => {
          set({ viewMode: mode });
        },

        toggleFullscreen: () => {
          set((state) => ({ isFullscreen: !state.isFullscreen }));
        },

        // Figma sync actions (to be implemented in Phase 3)
        syncToFigmaVariables: async () => {
          const palette = get().getActivePalette();
          if (!palette) return;

          // Send message to plugin code to create Figma variables
          window.parent.postMessage(
            { pluginMessage: { type: 'sync-palette-to-figma', data: palette } },
            '*'
          );
        },

        importFromFigmaVariables: async (collectionId: string) => {
          // Send message to plugin code to import from Figma
          window.parent.postMessage(
            { pluginMessage: { type: 'import-figma-colors', data: { collectionId } } },
            '*'
          );
        },
      };
    },
    {
      name: "figmap-palettes",
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        palettes: state.palettes,
        activePaletteId: state.activePaletteId
      }),
      // Merge function to ensure default palettes exist for existing users
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<PaletteState>;
        let palettes = persisted.palettes || [];

        // Remove old sample palettes
        const oldSampleIds = ["sample_indigo", "sample_indigo_v2"];
        palettes = palettes.filter(p => !oldSampleIds.includes(p.id));

        // Ensure all palettes have primaryStep (migration for existing palettes)
        palettes = palettes.map(p => ({
          ...p,
          primaryStep: p.primaryStep || 600
        }));

        // Get default palette names from loaded palettes
        const defaultPaletteNames = new Set(INITIAL_PALETTES.map(p => p.name));

        // Filter out any persisted palettes that match default names (to avoid duplicates)
        const userCreatedPalettes = palettes.filter(p => !defaultPaletteNames.has(p.name));

        // Merge: default palettes first, then user-created palettes
        const mergedPalettes = [...INITIAL_PALETTES, ...userCreatedPalettes];

        // Set active palette - use persisted if valid, otherwise use first default
        const activePaletteId = persisted.activePaletteId && mergedPalettes.some(p => p.id === persisted.activePaletteId)
          ? persisted.activePaletteId
          : INITIAL_ACTIVE_PALETTE_ID;

        const activePalette = mergedPalettes.find(p => p.id === activePaletteId);

        return {
          ...currentState,
          palettes: mergedPalettes,
          activePaletteId,
          generatedScales: activePalette
            ? generateAllScales(activePalette.steps, activePalette.primaryStep)
            : null
        };
      }
    }
  )
);
