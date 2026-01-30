/**
 * Layer Mapping Store
 * Manages layer configuration state and persistence
 */

import { create } from 'zustand';
import { LayerMappingConfig, LayerDefinition, DEFAULT_LAYER_CONFIG, validateLayerConfig } from '@/models/layer-mapping';

interface LayerMappingStore {
  // State
  config: LayerMappingConfig;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: number | null;
  error: string | null;
  
  // Actions
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
  updateLayer: (layerId: string, updates: Partial<LayerDefinition>) => void;
  toggleLayerEnabled: (layerId: string) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  resetToDefault: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
  getValidation: () => { valid: boolean; errors: string[]; warnings: string[] };
  updateThemeAndBrandModes: (brandNames: string[]) => void;
}

export const useLayerMappingStore = create<LayerMappingStore>((set, get) => ({
  // Initial state
  config: DEFAULT_LAYER_CONFIG,
  isLoading: false,
  isSaving: false,
  lastSaved: null,
  error: null,
  
  /**
   * Load configuration from storage
   * Priority: Figma clientStorage > localStorage > Default
   */
  loadConfig: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Request from Figma clientStorage (via plugin message)
      parent.postMessage({
        pluginMessage: { type: 'get-layer-config' }
      }, '*');
      
      // Set up message listener for response
      const handleMessage = (event: MessageEvent) => {
        if (event.data.pluginMessage?.type === 'layer-config-loaded') {
          const loadedConfig = event.data.pluginMessage.data;
          if (loadedConfig) {
            console.log('Loaded layer config from Figma clientStorage');
            set({ config: loadedConfig, isLoading: false });
          } else {
            // Fallback to localStorage
            console.log('No Figma config found, trying localStorage...');
            loadFromLocalStorage();
          }
          window.removeEventListener('message', handleMessage);
        } else if (event.data.pluginMessage?.type === 'layer-config-error') {
          console.warn('Error loading from Figma storage, falling back to localStorage');
          loadFromLocalStorage();
          window.removeEventListener('message', handleMessage);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Timeout fallback to localStorage after 1 second
      setTimeout(() => {
        if (get().isLoading) {
          console.log('Figma storage timeout, using localStorage');
          window.removeEventListener('message', handleMessage);
          loadFromLocalStorage();
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error loading layer config:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load config',
        isLoading: false 
      });
    }
  },
  
  /**
   * Save configuration to both Figma clientStorage and localStorage
   */
  saveConfig: async () => {
    const config = get().config;
    set({ isSaving: true, error: null });
    
    try {
      // Validate before saving
      const validation = validateLayerConfig(config);
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
      
      // Update metadata
      const configToSave = {
        ...config,
        metadata: {
          ...config.metadata,
          updatedAt: Date.now()
        }
      };
      
      // Save to Figma clientStorage (primary)
      parent.postMessage({
        pluginMessage: { 
          type: 'save-layer-config',
          data: configToSave
        }
      }, '*');
      
      // Save to localStorage (backup)
      localStorage.setItem('varcar-layer-config', JSON.stringify(configToSave));
      
      console.log('Layer config saved successfully');
      set({ 
        config: configToSave,
        isSaving: false, 
        lastSaved: Date.now() 
      });
      
    } catch (error) {
      console.error('Error saving layer config:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save config',
        isSaving: false 
      });
    }
  },
  
  /**
   * Update a specific layer's properties
   */
  updateLayer: (layerId: string, updates: Partial<LayerDefinition>) => {
    set((state) => ({
      config: {
        ...state.config,
        layers: state.config.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer
        )
      }
    }));
    
    // Auto-save after update
    setTimeout(() => get().saveConfig(), 500);
  },
  
  /**
   * Toggle a layer's enabled state
   */
  toggleLayerEnabled: (layerId: string) => {
    set((state) => ({
      config: {
        ...state.config,
        layers: state.config.layers.map((layer) =>
          layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
        )
      }
    }));
    
    // Auto-save after toggle
    setTimeout(() => get().saveConfig(), 500);
  },
  
  /**
   * Reorder layers by dragging
   */
  reorderLayers: (fromIndex: number, toIndex: number) => {
    set((state) => {
      const layers = [...state.config.layers];
      const [movedLayer] = layers.splice(fromIndex, 1);
      layers.splice(toIndex, 0, movedLayer);
      
      // Update order numbers
      layers.forEach((layer, index) => {
        layer.order = index;
      });
      
      return {
        config: {
          ...state.config,
          layers
        }
      };
    });
    
    // Auto-save after reorder
    setTimeout(() => get().saveConfig(), 500);
  },
  
  /**
   * Reset to default configuration
   */
  resetToDefault: () => {
    set({ config: DEFAULT_LAYER_CONFIG });
    setTimeout(() => get().saveConfig(), 500);
  },
  
  /**
   * Export configuration as JSON string
   */
  exportConfig: () => {
    const config = get().config;
    return JSON.stringify(config, null, 2);
  },
  
  /**
   * Import configuration from JSON string
   */
  importConfig: (json: string): boolean => {
    try {
      const imported = JSON.parse(json) as LayerMappingConfig;
      
      // Validate imported config
      const validation = validateLayerConfig(imported);
      if (!validation.valid) {
        console.error('Invalid imported config:', validation.errors);
        set({ error: `Invalid configuration: ${validation.errors.join(', ')}` });
        return false;
      }
      
      set({ config: imported });
      setTimeout(() => get().saveConfig(), 500);
      return true;
      
    } catch (error) {
      console.error('Error importing config:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to import config' });
      return false;
    }
  },
  
  /**
   * Get current validation status
   */
  getValidation: () => {
    return validateLayerConfig(get().config);
  },
  
  /**
   * Update Theme and Brand layer modes based on brand names
   * Supports both single brand (array with 1 name) and multi-brand (array with multiple names)
   * 
   * @param brandNames - Array of brand names to use as modes
   */
  updateThemeAndBrandModes: (brandNames: string[]) => {
    // Trim and filter empty names
    const cleanedBrandNames = brandNames
      .map(name => name.trim())
      .filter(name => name !== '');
    
    if (cleanedBrandNames.length === 0) {
      console.warn('[LayerMappingStore] No valid brand names provided, clearing modes');
      // Allow empty array - useful when all brands are deleted
    }
    
    set((state) => {
      const updatedLayers = state.config.layers.map((layer) => {
        if (layer.id === 'theme' || layer.id === 'brand') {
          return {
            ...layer,
            modes: cleanedBrandNames
          };
        }
        return layer;
      });
      
      return {
        config: {
          ...state.config,
          layers: updatedLayers
        }
      };
    });
    
    // Validate and save
    const validation = validateLayerConfig(get().config);
    if (!validation.valid) {
      console.error('[LayerMappingStore] Invalid config after mode update:', validation.errors);
      return;
    }
    
    // Auto-save after update
    setTimeout(() => get().saveConfig(), 500);
    
    console.log(`[LayerMappingStore] Updated Theme and Brand modes to [${cleanedBrandNames.join(', ')}]`);
  }
}));

/**
 * Helper function to load from localStorage
 */
function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem('varcar-layer-config');
    if (stored) {
      const config = JSON.parse(stored) as LayerMappingConfig;
      console.log('Loaded layer config from localStorage');
      useLayerMappingStore.setState({ config, isLoading: false });
    } else {
      console.log('No stored config found, using defaults');
      useLayerMappingStore.setState({ isLoading: false });
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    useLayerMappingStore.setState({ 
      error: 'Failed to load from localStorage',
      isLoading: false 
    });
  }
}
