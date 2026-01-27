/**
 * Brand Store
 * State management for brand automation system with complete guard rails
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { safeStorage } from "@/lib/storage";
import {
  Brand,
  BrandColors,
  BrandBackup,
  AuditLogEntry,
  ValidationResult,
  SyncStatus,
  SyncResult,
  GeneratedBrand,
  BrandTemplate,
  FigmaCollection,
  FigmaGroup,
  FigmaVariable,
  CollectionMode,
  PaletteReference
} from "@/models/brand";
import { usePaletteStore } from "./palette-store";
import { BrandGenerator } from "@/lib/brand-generator";
import { brandToFigmaAdapter } from "@/adapters/brandToFigmaVariables";
import { migrateAllLegacyBrands, needsMigration } from "@/lib/brand-migration";

/**
 * Module-level cache for Figma data (outside Zustand to prevent infinite loops)
 */
const figmaCache = new Map<string, any>();

/**
 * Invalidate all cached Figma data for a specific brand
 */
function invalidateBrandCache(brandId: string): void {
  const keysToDelete: string[] = [];
  figmaCache.forEach((_, key) => {
    if (key.includes(brandId)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => figmaCache.delete(key));
}

/**
 * Clear all Figma cache
 */
function clearFigmaCache(): void {
  figmaCache.clear();
}

/**
 * History state for undo/redo
 */
interface HistoryState {
  brands: Brand[];
  timestamp: number;
}

interface BrandStoreState {
  // Core state
  brands: Brand[];
  activeBrandId: string | null;
  syncStatus: SyncStatus;
  
  // History for undo/redo (max 50 states)
  history: HistoryState[];
  historyIndex: number;
  
  // Backups (before sync operations)
  backups: BrandBackup[];
  
  // Audit log
  auditLog: AuditLogEntry[];
  
  // Auto-save
  lastAutoSave: number;
  isDirty: boolean;
  
  // Rate limiting
  syncAttempts: { timestamp: number }[];
  
  // Figma Variables UI - Pre-computed state
  figmaCollections: FigmaCollection[];
  figmaGroups: FigmaGroup[];
  figmaVariablesByCollection: Map<string, FigmaVariable[]>;
  
  // Actions
  createBrand: (name: string, colors?: Partial<BrandColors>) => void;
  duplicateBrand: (id: string) => void;
  deleteBrand: (id: string) => void;
  updateBrand: (id: string, updates: Partial<Brand>) => void;
  renameBrand: (id: string, name: string) => void;
  setActiveBrand: (id: string | null) => void;
  getActiveBrand: () => Brand | null;
  
  // Palette integration
  updateBrandPalette: (
    brandId: string,
    role: keyof BrandColors,
    paletteId: string,
    paletteName: string
  ) => void;
  getAvailablePalettes: () => Array<{ id: string; name: string; previewColors: string[] }>;
  validatePaletteReferences: (brand: Brand) => boolean;
  
  // Validation
  validateBrand: (brandId: string) => ValidationResult;
  
  // Sync operations
  syncBrand: (brandId: string) => Promise<SyncResult>;
  canSync: () => boolean;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Backup operations
  createBackup: (brand: Brand, reason: string, autoSaved?: boolean) => void;
  restoreBackup: (backupId: string) => void;
  getBackupsForBrand: (brandId: string) => BrandBackup[];
  
  // Export/Import
  exportBrands: (brandIds?: string[]) => string;
  importBrands: (json: string) => void;
  
  // Templates
  saveAsTemplate: (brandId: string, templateName: string, description: string) => BrandTemplate;
  createFromTemplate: (template: BrandTemplate, name: string) => void;
  
  // Audit log
  addAuditEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  getAuditLog: (brandId?: string) => AuditLogEntry[];
  
  // Auto-save
  markDirty: () => void;
  autoSave: () => void;
  
  // Figma data refresh actions
  refreshFigmaData: () => void;
  refreshFigmaGroups: (collectionId: string) => void;
  refreshFigmaVariables: (collectionId: string, groupId?: string) => void;
  
  // Collection CRUD
  createCollection: (brandId: string, name: string, generationType: 'primitives' | 'semantic' | 'component') => void;
  updateCollection: (brandId: string, collectionId: string, updates: Partial<FigmaCollection>) => void;
  deleteCollection: (brandId: string, collectionId: string) => void;
  duplicateCollection: (brandId: string, collectionId: string) => void;
  
  // Mode management per collection
  addModeToCollection: (brandId: string, collectionId: string, modeName: string) => void;
  removeModeFromCollection: (brandId: string, collectionId: string, modeId: string) => void;
  renameModeInCollection: (brandId: string, collectionId: string, modeId: string, newName: string) => void;
  
  // Palette assignment per collection
  assignPaletteToGroup: (brandId: string, collectionId: string, groupName: string, palette: PaletteReference) => void;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create default brand colors (empty palette references)
 */
function createDefaultColors(): BrandColors {
  const emptyRef = { paletteId: '', paletteName: '' };
  return {
    primary: { ...emptyRef },
    secondary: { ...emptyRef },
    sparkle: { ...emptyRef },
    neutral: { ...emptyRef },
    semantic: {
      positive: { ...emptyRef },
      negative: { ...emptyRef },
      warning: { ...emptyRef },
      informative: { ...emptyRef }
    }
  };
}

/**
 * Deep clone object
 */
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const useBrandStore = create<BrandStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      brands: [],
      activeBrandId: null,
      syncStatus: 'idle',
      history: [],
      historyIndex: -1,
      backups: [],
      auditLog: [],
      lastAutoSave: Date.now(),
      isDirty: false,
      syncAttempts: [],
      
      // Figma Variables UI state
      figmaCollections: [],
      figmaGroups: [],
      figmaVariablesByCollection: new Map(),

      // Create brand
      createBrand: (name: string, colors?: Partial<BrandColors>) => {
        const newBrand: Brand = {
          id: generateId(),
          name,
          colors: colors ? { ...createDefaultColors(), ...colors } : createDefaultColors(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1
        };

        set((state) => {
          const newBrands = [...state.brands, newBrand];
          
          // Add to history
          const newHistory = [
            ...state.history.slice(0, state.historyIndex + 1),
            { brands: deepClone(newBrands), timestamp: Date.now() }
          ].slice(-50); // Keep last 50 states

          return {
            brands: newBrands,
            activeBrandId: newBrand.id,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true
          };
        });

        // Add audit log
        get().addAuditEntry({
          action: 'create',
          brandId: newBrand.id,
          brandName: name
        });
        
        // Invalidate cache for new brand
        invalidateBrandCache(newBrand.id);
        
        // Refresh Figma data for new brand
        get().refreshFigmaData();
      },

      // Duplicate brand
      duplicateBrand: (id: string) => {
        const brand = get().brands.find((b) => b.id === id);
        if (!brand) return;

        const newBrand: Brand = {
          ...deepClone(brand),
          id: generateId(),
          name: `${brand.name} (Copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncedAt: undefined,
          version: 1
        };

        set((state) => {
          const newBrands = [...state.brands, newBrand];
          
          const newHistory = [
            ...state.history.slice(0, state.historyIndex + 1),
            { brands: deepClone(newBrands), timestamp: Date.now() }
          ].slice(-50);

          return {
            brands: newBrands,
            activeBrandId: newBrand.id,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true
          };
        });

        get().addAuditEntry({
          action: 'create',
          brandId: newBrand.id,
          brandName: newBrand.name,
          metadata: { duplicatedFrom: id }
        });
        
        // Invalidate cache for new brand
        invalidateBrandCache(newBrand.id);
        
        // Refresh Figma data for duplicated brand
        get().refreshFigmaData();
      },

      // Delete brand
      deleteBrand: (id: string) => {
        const brand = get().brands.find((b) => b.id === id);
        if (!brand) return;

        set((state) => {
          const newBrands = state.brands.filter((b) => b.id !== id);
          const newActiveId = state.activeBrandId === id
            ? (newBrands[0]?.id || null)
            : state.activeBrandId;

          const newHistory = [
            ...state.history.slice(0, state.historyIndex + 1),
            { brands: deepClone(newBrands), timestamp: Date.now() }
          ].slice(-50);

          return {
            brands: newBrands,
            activeBrandId: newActiveId,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true
          };
        });

        get().addAuditEntry({
          action: 'delete',
          brandId: id,
          brandName: brand.name
        });
        
        // Invalidate cache for deleted brand
        invalidateBrandCache(id);
        
        // Refresh Figma data after delete
        get().refreshFigmaData();
      },

      // Update brand
      updateBrand: (id: string, updates: Partial<Brand>) => {
        set((state) => {
          const newBrands = state.brands.map((b) =>
            b.id === id
              ? { ...b, ...updates, updatedAt: Date.now(), version: b.version + 1 }
              : b
          );

          const newHistory = [
            ...state.history.slice(0, state.historyIndex + 1),
            { brands: deepClone(newBrands), timestamp: Date.now() }
          ].slice(-50);

          return {
            brands: newBrands,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isDirty: true
          };
        });

        const brand = get().brands.find((b) => b.id === id);
        if (brand) {
          get().addAuditEntry({
            action: 'update',
            brandId: id,
            brandName: brand.name,
            changes: updates
          });
          
          // Invalidate cache for updated brand
          invalidateBrandCache(id);
          
          // Refresh Figma data after update
          get().refreshFigmaData();
        }
      },

      // Rename brand
      renameBrand: (id: string, name: string) => {
        get().updateBrand(id, { name });
      },

      // Set active brand
      setActiveBrand: (id: string | null) => {
        set({ activeBrandId: id });
        get().refreshFigmaData(); // Refresh Figma data when brand changes
      },

      // Get active brand
      getActiveBrand: () => {
        const state = get();
        return state.brands.find((b) => b.id === state.activeBrandId) || null;
      },

      // Update brand palette
      updateBrandPalette: (
        brandId: string,
        role: keyof BrandColors,
        paletteId: string,
        paletteName: string
      ) => {
        const brand = get().brands.find((b) => b.id === brandId);
        if (!brand) return;

        const newColors = { ...brand.colors };
        if (role === 'semantic') {
          // Handle semantic colors separately
          return;
        } else {
          (newColors[role] as any) = { paletteId, paletteName };
        }

        get().updateBrand(brandId, { colors: newColors });
        // Note: updateBrand already invalidates cache
      },

      // Get available palettes from RangDe
      getAvailablePalettes: () => {
        const paletteStore = usePaletteStore.getState();
        return paletteStore.palettes.map((p) => ({
          id: p.id,
          name: p.name,
          previewColors: [
            p.steps[200] || '',
            p.steps[600] || '',
            p.steps[1200] || '',
            p.steps[2500] || ''
          ]
        }));
      },

      // Validate palette references
      validatePaletteReferences: (brand: Brand) => {
        const palettes = get().getAvailablePalettes();
        const paletteIds = new Set(palettes.map((p) => p.id));

        const allRefs = [
          brand.colors.primary,
          brand.colors.secondary,
          brand.colors.sparkle,
          brand.colors.neutral,
          brand.colors.semantic.positive,
          brand.colors.semantic.negative,
          brand.colors.semantic.warning,
          brand.colors.semantic.informative
        ];

        return allRefs.every((ref) => !ref.paletteId || paletteIds.has(ref.paletteId));
      },

      // Validate brand
      validateBrand: (brandId: string) => {
        const brand = get().brands.find((b) => b.id === brandId);
        if (!brand) {
          return {
            valid: false,
            errors: ['Brand not found'],
            warnings: [],
            info: []
          };
        }

        const errors: string[] = [];
        const warnings: string[] = [];
        const info: string[] = [];

        // Check if all required palettes are assigned
        const requiredRoles = ['primary', 'secondary', 'sparkle', 'neutral'] as const;
        for (const role of requiredRoles) {
          if (!brand.colors[role].paletteId) {
            errors.push(`Missing ${role} palette assignment`);
          }
        }

        // Check semantic colors
        const semanticRoles = ['positive', 'negative', 'warning', 'informative'] as const;
        for (const role of semanticRoles) {
          if (!brand.colors.semantic[role].paletteId) {
            warnings.push(`Missing ${role} semantic color assignment`);
          }
        }

        // Validate palette references exist
        if (!get().validatePaletteReferences(brand)) {
          errors.push('Some palette references are invalid or missing');
        }

        // Check if brand name is unique
        const duplicateNames = get().brands.filter(
          (b) => b.id !== brandId && b.name === brand.name
        );
        if (duplicateNames.length > 0) {
          warnings.push('Brand name is not unique');
        }

        return {
          valid: errors.length === 0,
          errors,
          warnings,
          info
        };
      },

      // Sync brand to Figma
      syncBrand: async (brandId: string) => {
        const state = get();
        
        // Rate limiting check (max 5 syncs per minute)
        const oneMinuteAgo = Date.now() - 60000;
        const recentAttempts = state.syncAttempts.filter(
          (a) => a.timestamp > oneMinuteAgo
        );
        
        if (recentAttempts.length >= 5) {
          return {
            success: false,
            brandId,
            timestamp: Date.now(),
            variablesSynced: 0,
            modesAdded: [],
            errors: ['Rate limit exceeded. Maximum 5 syncs per minute.'],
            warnings: []
          };
        }

        const brand = state.brands.find((b) => b.id === brandId);
        if (!brand) {
          return {
            success: false,
            brandId,
            timestamp: Date.now(),
            variablesSynced: 0,
            modesAdded: [],
            errors: ['Brand not found'],
            warnings: []
          };
        }

        // Validate before sync
        set({ syncStatus: 'validating' });
        const validation = get().validateBrand(brandId);
        
        if (!validation.valid) {
          set({ syncStatus: 'error' });
          return {
            success: false,
            brandId,
            timestamp: Date.now(),
            variablesSynced: 0,
            modesAdded: [],
            errors: validation.errors,
            warnings: validation.warnings
          };
        }

        // Create backup before sync
        get().createBackup(brand, 'Before sync operation', false);

        // Generate variables with aliases
        set({ syncStatus: 'previewing' });
        const { BrandGenerator } = await import('@/lib/brand-generator');
        const generatedBrand = BrandGenerator.generateBrand(brand);
        
        // Update sync status
        set({ syncStatus: 'syncing' });

        try {
          // Send message to plugin code with aliased variables
          window.parent.postMessage(
            {
              pluginMessage: {
                type: 'sync-brand-with-aliases',
                data: { 
                  brand,
                  variables: generatedBrand.variables
                }
              }
            },
            '*'
          );

          // Record sync attempt
          set((state) => ({
            syncAttempts: [...state.syncAttempts, { timestamp: Date.now() }]
          }));

          // Update brand sync timestamp
          get().updateBrand(brandId, { syncedAt: Date.now() });

          // Add audit log
          get().addAuditEntry({
            action: 'sync',
            brandId,
            brandName: brand.name
          });

          set({ syncStatus: 'success' });

          // Reset to idle after 3 seconds
          setTimeout(() => {
            if (get().syncStatus === 'success') {
              set({ syncStatus: 'idle' });
            }
          }, 3000);

          return {
            success: true,
            brandId,
            timestamp: Date.now(),
            variablesSynced: generatedBrand.variables.length,
            modesAdded: [brand.name],
            errors: [],
            warnings: validation.warnings
          };
        } catch (error) {
          set({ syncStatus: 'error' });
          return {
            success: false,
            brandId,
            timestamp: Date.now(),
            variablesSynced: 0,
            modesAdded: [],
            errors: [error instanceof Error ? error.message : 'Unknown error'],
            warnings: []
          };
        }
      },

      // Check if can sync
      canSync: () => {
        const state = get();
        const oneMinuteAgo = Date.now() - 60000;
        const recentAttempts = state.syncAttempts.filter(
          (a) => a.timestamp > oneMinuteAgo
        );
        return recentAttempts.length < 5;
      },

      // Undo
      undo: () => {
        set((state) => {
          if (state.historyIndex <= 0) return state;

          const newIndex = state.historyIndex - 1;
          const historyState = state.history[newIndex];

          return {
            brands: deepClone(historyState.brands),
            historyIndex: newIndex,
            isDirty: true
          };
        });
      },

      // Redo
      redo: () => {
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;

          const newIndex = state.historyIndex + 1;
          const historyState = state.history[newIndex];

          return {
            brands: deepClone(historyState.brands),
            historyIndex: newIndex,
            isDirty: true
          };
        });
      },

      // Can undo
      canUndo: () => {
        const state = get();
        return state.historyIndex > 0;
      },

      // Can redo
      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 1;
      },

      // Create backup
      createBackup: (brand: Brand, reason: string, autoSaved = false) => {
        const backup: BrandBackup = {
          id: generateId(),
          timestamp: Date.now(),
          brand: deepClone(brand),
          metadata: { reason, autoSaved }
        };

        set((state) => ({
          backups: [...state.backups, backup].slice(-20) // Keep last 20 backups
        }));
      },

      // Restore backup
      restoreBackup: (backupId: string) => {
        const backup = get().backups.find((b) => b.id === backupId);
        if (!backup) return;

        const brand = backup.brand;
        get().updateBrand(brand.id, { ...brand });

        get().addAuditEntry({
          action: 'rollback',
          brandId: brand.id,
          brandName: brand.name,
          metadata: { backupId, backupTimestamp: backup.timestamp }
        });
      },

      // Get backups for brand
      getBackupsForBrand: (brandId: string) => {
        return get().backups.filter((b) => b.brand.id === brandId);
      },

      // Export brands
      exportBrands: (brandIds?: string[]) => {
        const state = get();
        const brandsToExport = brandIds
          ? state.brands.filter((b) => brandIds.includes(b.id))
          : state.brands;

        const exportData = {
          version: '1.0' as const,
          exportDate: Date.now(),
          brands: brandsToExport,
          metadata: {
            source: 'VarCar Brand Automation',
            author: 'User'
          }
        };

        return JSON.stringify(exportData, null, 2);
      },

      // Import brands
      importBrands: (json: string) => {
        try {
          const data = JSON.parse(json);
          
          if (data.version !== '1.0') {
            console.error('Unsupported export version');
            return;
          }

          const importedBrands = data.brands.map((b: Brand) => ({
            ...b,
            id: generateId(), // Generate new IDs
            createdAt: Date.now(),
            updatedAt: Date.now(),
            syncedAt: undefined
          }));

          set((state) => {
            const newBrands = [...state.brands, ...importedBrands];
            
            const newHistory = [
              ...state.history.slice(0, state.historyIndex + 1),
              { brands: deepClone(newBrands), timestamp: Date.now() }
            ].slice(-50);

            return {
              brands: newBrands,
              history: newHistory,
              historyIndex: newHistory.length - 1,
              isDirty: true
            };
          });
        } catch (error) {
          console.error('Failed to import brands:', error);
        }
      },

      // Save as template
      saveAsTemplate: (brandId: string, templateName: string, description: string) => {
        const brand = get().brands.find((b) => b.id === brandId);
        if (!brand) {
          throw new Error('Brand not found');
        }

        const template: BrandTemplate = {
          id: generateId(),
          name: templateName,
          description,
          colors: deepClone(brand.colors),
          tags: brand.tags || []
        };

        return template;
      },

      // Create from template
      createFromTemplate: (template: BrandTemplate, name: string) => {
        get().createBrand(name, template.colors);
      },

      // Add audit entry
      addAuditEntry: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
        const auditEntry: AuditLogEntry = {
          ...entry,
          id: generateId(),
          timestamp: Date.now()
        };

        set((state) => ({
          auditLog: [...state.auditLog, auditEntry].slice(-100) // Keep last 100 entries
        }));
      },

      // Get audit log
      getAuditLog: (brandId?: string) => {
        const log = get().auditLog;
        return brandId ? log.filter((e) => e.brandId === brandId) : log;
      },

      // Mark dirty
      markDirty: () => {
        set({ isDirty: true });
      },

      // Auto-save
      autoSave: () => {
        const state = get();
        if (!state.isDirty) return;

        const activeBrand = state.getActiveBrand();
        if (activeBrand) {
          state.createBackup(activeBrand, 'Auto-save', true);
        }

        set({ isDirty: false, lastAutoSave: Date.now() });
      },
      
      // Figma data refresh actions
      refreshFigmaData: () => {
        const state = get();
        const activeBrand = state.getActiveBrand();
        
        if (!activeBrand) {
          set({
            figmaCollections: [],
            figmaGroups: [],
            figmaVariablesByCollection: new Map()
          });
          return;
        }
        
        try {
          // Get collections from brand (use brand's collections directly)
          const collections = brandToFigmaAdapter.convertBrandToCollections(activeBrand);
          
          // Generate variables for all collections
          const allVariables = brandToFigmaAdapter.getAllVariablesForBrand(activeBrand);
          
          // Store in state
          set({ 
            figmaCollections: collections,
            figmaVariablesByCollection: allVariables
          });
          
          // Refresh groups for first collection
          if (collections.length > 0) {
            get().refreshFigmaGroups(collections[0].id);
          }
          
          console.log(`[Figma] Refreshed ${collections.length} collections, ${allVariables.size} variable sets`);
        } catch (error) {
          console.error('[Figma] Failed to refresh data:', error);
          set({
            figmaCollections: [],
            figmaGroups: [],
            figmaVariablesByCollection: new Map()
          });
        }
      },
      
      refreshFigmaGroups: (collectionId: string) => {
        const state = get();
        const allVariables = state.figmaVariablesByCollection;
        
        try {
          // Extract groups from variables using slash-based parsing
          const groups = brandToFigmaAdapter.getGroupsForCollection(
            collectionId,
            allVariables
          );
          
          set({ figmaGroups: groups });
          console.log(`[Figma] Refreshed ${groups.length} groups for collection ${collectionId}`);
        } catch (error) {
          console.error('[Figma] Failed to refresh groups:', error);
          set({ figmaGroups: [] });
        }
      },
      
      refreshFigmaVariables: (collectionId: string, groupId?: string) => {
        // Variables are already generated in refreshFigmaData
        // This method just triggers groups refresh if needed
        console.log(`[Figma] Variables already loaded for collection ${collectionId}`);
      },
      
      // Create collection
      createCollection: (brandId: string, name: string, generationType: 'primitives' | 'semantic' | 'component') => {
        const newCollection: FigmaCollection = {
          id: `col_${generateId()}`,
          name,
          modes: [{ modeId: `mode_${generateId()}`, name: 'Mode 1' }],
          defaultModeId: `mode_${generateId()}`,
          variableIds: [],
          remote: false,
          hiddenFromPublishing: false,
          generationType,
          paletteAssignments: generationType === 'primitives' ? {} : undefined
        };
        
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId) {
              return {
                ...b,
                collections: [...(b.collections || []), newCollection],
                updatedAt: Date.now(),
                version: b.version + 1
              };
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        get().addAuditEntry({
          action: 'update',
          brandId,
          brandName: get().brands.find(b => b.id === brandId)?.name || '',
          metadata: { collectionCreated: newCollection.id }
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
      // Update collection
      updateCollection: (brandId: string, collectionId: string, updates: Partial<FigmaCollection>) => {
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId && b.collections) {
              return {
                ...b,
                collections: b.collections.map((c) =>
                  c.id === collectionId ? { ...c, ...updates } : c
                ),
                updatedAt: Date.now(),
                version: b.version + 1
              };
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
      // Delete collection
      deleteCollection: (brandId: string, collectionId: string) => {
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId && b.collections) {
              return {
                ...b,
                collections: b.collections.filter((c) => c.id !== collectionId),
                updatedAt: Date.now(),
                version: b.version + 1
              };
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        get().addAuditEntry({
          action: 'update',
          brandId,
          brandName: get().brands.find(b => b.id === brandId)?.name || '',
          metadata: { collectionDeleted: collectionId }
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
      // Duplicate collection
      duplicateCollection: (brandId: string, collectionId: string) => {
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId && b.collections) {
              const sourceCollection = b.collections.find((c) => c.id === collectionId);
              if (sourceCollection) {
                const duplicated: FigmaCollection = {
                  ...deepClone(sourceCollection),
                  id: `col_${generateId()}`,
                  name: `${sourceCollection.name} (Copy)`,
                  variableIds: []
                };
                
                return {
                  ...b,
                  collections: [...b.collections, duplicated],
                  updatedAt: Date.now(),
                  version: b.version + 1
                };
              }
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
      // Add mode to collection
      addModeToCollection: (brandId: string, collectionId: string, modeName: string) => {
        const newMode: CollectionMode = {
          modeId: `mode_${generateId()}`,
          name: modeName
        };
        
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId && b.collections) {
              return {
                ...b,
                collections: b.collections.map((c) =>
                  c.id === collectionId
                    ? { ...c, modes: [...c.modes, newMode] }
                    : c
                ),
                updatedAt: Date.now(),
                version: b.version + 1
              };
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
      // Remove mode from collection
      removeModeFromCollection: (brandId: string, collectionId: string, modeId: string) => {
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId && b.collections) {
              return {
                ...b,
                collections: b.collections.map((c) => {
                  if (c.id === collectionId) {
                    const newModes = c.modes.filter((m) => m.modeId !== modeId);
                    // Update default if we're removing the default mode
                    const newDefaultId = c.defaultModeId === modeId && newModes.length > 0
                      ? newModes[0].modeId
                      : c.defaultModeId;
                    
                    return { ...c, modes: newModes, defaultModeId: newDefaultId };
                  }
                  return c;
                }),
                updatedAt: Date.now(),
                version: b.version + 1
              };
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
      // Rename mode in collection
      renameModeInCollection: (brandId: string, collectionId: string, modeId: string, newName: string) => {
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId && b.collections) {
              return {
                ...b,
                collections: b.collections.map((c) =>
                  c.id === collectionId
                    ? {
                        ...c,
                        modes: c.modes.map((m) =>
                          m.modeId === modeId ? { ...m, name: newName } : m
                        )
                      }
                    : c
                ),
                updatedAt: Date.now(),
                version: b.version + 1
              };
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
      // Assign palette to group in collection
      assignPaletteToGroup: (brandId: string, collectionId: string, groupName: string, palette: PaletteReference) => {
        set((state) => {
          const newBrands = state.brands.map((b) => {
            if (b.id === brandId && b.collections) {
              return {
                ...b,
                collections: b.collections.map((c) => {
                  if (c.id === collectionId && c.paletteAssignments) {
                    return {
                      ...c,
                      paletteAssignments: {
                        ...c.paletteAssignments,
                        [groupName]: palette
                      }
                    };
                  }
                  return c;
                }),
                updatedAt: Date.now(),
                version: b.version + 1
              };
            }
            return b;
          });
          
          return { brands: newBrands, isDirty: true };
        });
        
        invalidateBrandCache(brandId);
        get().refreshFigmaData();
      },
      
    }),
    {
      name: 'varcar-brands',
      storage: createJSONStorage(() => safeStorage),
      partialize: (state) => ({
        brands: state.brands,
        activeBrandId: state.activeBrandId,
        backups: state.backups,
        auditLog: state.auditLog
      }),
      // Auto-migrate legacy brands on load
      onRehydrateStorage: () => (state) => {
        if (state && state.brands) {
          console.log('[Migration] Checking for legacy brands...');
          const hadLegacyBrands = state.brands.some(needsMigration);
          
          if (hadLegacyBrands) {
            console.log('[Migration] Migrating legacy brands to multi-collection architecture...');
            state.brands = migrateAllLegacyBrands(state.brands);
            console.log('[Migration] Migration complete!');
          } else {
            console.log('[Migration] All brands are up to date');
          }
        }
      }
    }
  )
);

// Auto-save every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(() => {
    useBrandStore.getState().autoSave();
  }, 30000);
}
