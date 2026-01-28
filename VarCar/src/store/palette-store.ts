import { create } from "zustand";
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
  
  // Save queue (for debouncing)
  saveQueue: ReturnType<typeof setTimeout> | null;
  isSaving: boolean;
  isLoading: boolean;

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
  
  // Storage operations
  loadPalettes: () => Promise<void>;
  savePalettes: () => Promise<void>;
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

export const usePaletteStore = create<PaletteState>()((set, get) => {
  const initialPalette = INITIAL_PALETTES.find(p => p.id === INITIAL_ACTIVE_PALETTE_ID) || INITIAL_PALETTES[0];

  return {
    palettes: INITIAL_PALETTES,
    activePaletteId: INITIAL_ACTIVE_PALETTE_ID,
    generatedScales: initialPalette
      ? generateAllScales(initialPalette.steps, initialPalette.primaryStep)
      : null,
    viewMode: "palette" as ViewMode,
    isFullscreen: false,
    saveQueue: null,
    isSaving: false,
    isLoading: false,

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
          
          // Save to storage
          get().savePalettes();
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
          
          // Save to storage
          get().savePalettes();
        },

        renamePalette: (id: string, name: string) => {
          set((state) => ({
            palettes: state.palettes.map((p) =>
              p.id === id ? { ...p, name } : p
            )
          }));
          
          // Save to storage
          get().savePalettes();
        },

        reorderPalettes: (startIndex: number, endIndex: number) => {
          set((state) => {
            const newPalettes = Array.from(state.palettes);
            const [removed] = newPalettes.splice(startIndex, 1);
            newPalettes.splice(endIndex, 0, removed);
            return { palettes: newPalettes };
          });
          
          // Save to storage
          get().savePalettes();
        },

        setActivePalette: (id: string) => {
          const palette = get().palettes.find((p) => p.id === id);
          if (palette) {
            set({
              activePaletteId: id,
              generatedScales: generateAllScales(palette.steps, palette.primaryStep)
            });
            
            // Save to storage
            get().savePalettes();
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
          
          // Save to storage
          get().savePalettes();
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
          
          // Save to storage
          get().savePalettes();
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
          
          // Save to storage
          get().savePalettes();
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
        
        // Load palettes from Figma clientStorage with localStorage fallback
        loadPalettes: (): Promise<void> => {
          const state = get();
          
          // Prevent duplicate loads
          if (state.isLoading) {
            console.log('[Storage] Palette load already in progress');
            return Promise.resolve();
          }
          
          set({ isLoading: true });
          
          return new Promise((resolve) => {
            const timeoutId = setTimeout(() => {
              cleanup();
              console.warn('[Storage] Palette load timeout, using persisted state');
              resolve(); // Don't reject - use fallback
            }, 3000); // Increase to 3 seconds for reliability
            
            const cleanup = () => {
              window.removeEventListener('message', handleMessage);
              clearTimeout(timeoutId);
              set({ isLoading: false });
            };
            
            const handleMessage = (event: MessageEvent) => {
              if (event.data.pluginMessage?.type === 'palettes-loaded') {
                cleanup();
                
                const loadedData = event.data.pluginMessage.data;
                if (loadedData && loadedData.palettes) {
                  console.log('[Storage] Syncing palettes from Figma clientStorage');
                  // Merge with existing state (Zustand persist already loaded defaults + localStorage)
                  const currentPalettes = get().palettes;
                  const figmaPalettes = loadedData.palettes;
                  
                  // Create map of current palettes by ID
                  const currentMap = new Map(currentPalettes.map(p => [p.id, p]));
                  
                  // Merge: Keep current palettes, update with Figma data
                  const mergedPalettes = figmaPalettes.map((fp: Palette) => 
                    currentMap.has(fp.id) ? { ...currentMap.get(fp.id), ...fp } : fp
                  );
                  
                  // Add any current palettes not in Figma data
                  currentPalettes.forEach(cp => {
                    if (!figmaPalettes.find((fp: Palette) => fp.id === cp.id)) {
                      mergedPalettes.push(cp);
                    }
                  });
                  
                  set({ 
                    palettes: mergedPalettes,
                    activePaletteId: loadedData.activePaletteId || get().activePaletteId
                  });
                  
                  // Also save to localStorage as backup
                  try {
                    safeStorage.setItem('figmap-palettes', JSON.stringify({
                      palettes: mergedPalettes,
                      activePaletteId: get().activePaletteId
                    }));
                  } catch (e) {
                    console.warn('[Storage] Failed to save to localStorage:', e);
                  }
                } else {
                  console.log('[Storage] No palette data in Figma storage, using persisted state');
                }
                
                resolve();
              } else if (event.data.pluginMessage?.type === 'palettes-error') {
                cleanup();
                console.warn('[Storage] Error loading palettes from Figma storage, using persisted state');
                resolve(); // Don't reject - use fallback
              }
            };
            
            window.addEventListener('message', handleMessage);
            
            // Request from Figma clientStorage (via plugin message)
            parent.postMessage({
              pluginMessage: { type: 'get-palettes' }
            }, '*');
          });
        },
        
        // Save palettes to both Figma clientStorage and localStorage (with debouncing)
        savePalettes: () => {
          const state = get();
          
          // Clear existing timeout
          if (state.saveQueue) {
            clearTimeout(state.saveQueue);
          }
          
          // Debounce: wait 300ms for more changes
          const timeoutId = setTimeout(async () => {
            if (get().isSaving) {
              console.log('[Storage] Save already in progress, queuing...');
              return;
            }
            
            set({ isSaving: true });
            
            try {
              const currentState = get();
              const dataToSave = {
                palettes: currentState.palettes,
                activePaletteId: currentState.activePaletteId
              };
              
              // Save to Figma clientStorage (primary)
              parent.postMessage({
                pluginMessage: { 
                  type: 'save-palettes',
                  data: dataToSave
                }
              }, '*');
              
              // Also save to localStorage as backup
              try {
                safeStorage.setItem('figmap-palettes', JSON.stringify(dataToSave));
              } catch (e) {
                console.warn('[Storage] Failed to save to localStorage:', e);
              }
              
              console.log('[Storage] Palettes saved to both Figma clientStorage and localStorage');
            } catch (error) {
              console.error('[Storage] Error saving palettes:', error);
            } finally {
              set({ isSaving: false, saveQueue: null });
            }
          }, 300);
          
          set({ saveQueue: timeoutId });
        },
      };
});
