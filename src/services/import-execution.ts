/**
 * Import Execution Service
 * Handles actual execution of imports with proper ordering and conflict resolution
 */

import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';
import { useLayerMappingStore } from '@/store/layer-mapping-store';
import { Brand } from '@/models/brand';
import { Palette } from '@/store/palette-store';
import { LayerMappingConfig } from '@/models/layer-mapping';
import { VarCarExport, ImportOptions, ImportResult } from '@/models/export-types';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Progress callback for import operations
 */
export type ImportProgressCallback = (progress: {
  phase: 'palettes' | 'brands' | 'mappings';
  current: number;
  total: number;
  message: string;
}) => void;

/**
 * Execute full import with proper ordering
 */
export async function executeImport(
  data: VarCarExport,
  options: ImportOptions,
  onProgress?: ImportProgressCallback
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    stats: {
      brandsCreated: 0,
      brandsUpdated: 0,
      brandsSkipped: 0,
      palettesCreated: 0,
      palettesUpdated: 0,
      palettesSkipped: 0,
      rulesCreated: 0,
      mappingsUpdated: false,
    },
    errors: [],
    warnings: [],
    conflicts: [],
    importedBrandIds: [],
    importedPaletteIds: [],
  };

  try {
    // Step 1: Import palettes first (brands reference them)
    if (options.importPalettes !== false && data.palettes.length > 0) {
      onProgress?.({
        phase: 'palettes',
        current: 0,
        total: data.palettes.length,
        message: 'Importing palettes...'
      });
      
      const paletteResult = await executePaletteImport(data.palettes, options, onProgress);
      result.stats.palettesCreated = paletteResult.created;
      result.stats.palettesUpdated = paletteResult.updated;
      result.stats.palettesSkipped = paletteResult.skipped;
      result.importedPaletteIds = paletteResult.ids;
      result.warnings.push(...paletteResult.warnings);
    }

    // Step 2: Import brands
    onProgress?.({
      phase: 'brands',
      current: 0,
      total: data.brands.length,
      message: 'Importing brands...'
    });
    
    const brandResult = await executeBrandImport(data.brands, options, onProgress);
    result.stats.brandsCreated = brandResult.created;
    result.stats.brandsUpdated = brandResult.updated;
    result.stats.brandsSkipped = brandResult.skipped;
    result.importedBrandIds = brandResult.ids;
    result.warnings.push(...brandResult.warnings);

    // Step 3: Import layer mappings (if included)
    if (options.importMappings && data.layerMappings) {
      await executeLayerMappingImport(data.layerMappings);
      result.stats.mappingsUpdated = true;
    }

    // Step 4: Import rules (TODO: when rules engine is integrated)
    if (options.importRules && data.rules && data.rules.length > 0) {
      // TODO: Execute rules import
      result.stats.rulesCreated = 0;
    }

    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error
        ? `Import execution failed: ${error.message}`
        : 'Import execution failed'
    );
  }

  return result;
}

/**
 * Execute palette import (optimized with batching and progress tracking)
 */
async function executePaletteImport(
  palettes: Palette[],
  options: ImportOptions,
  onProgress?: ImportProgressCallback
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  ids: string[];
  warnings: string[];
}> {
  const result = {
    created: 0,
    updated: 0,
    skipped: 0,
    ids: [] as string[],
    warnings: [] as string[],
  };

  const paletteStore = usePaletteStore.getState();
  const existingPalettes = paletteStore.getAllPalettes();

  // Filter selected palettes
  let palettesToImport = palettes;
  if (options.selectedPaletteIds && options.selectedPaletteIds.length > 0) {
    palettesToImport = palettes.filter((p) =>
      options.selectedPaletteIds!.includes(p.id)
    );
  }
  
  // Batch updates: collect all changes, save once at end
  const palettesToAdd: Palette[] = [];
  const palettesToUpdate: { index: number; palette: Palette }[] = [];

  for (let idx = 0; idx < palettesToImport.length; idx++) {
    const palette = palettesToImport[idx];
    
    // Report progress
    onProgress?.({
      phase: 'palettes',
      current: idx + 1,
      total: palettesToImport.length,
      message: `Importing palette: ${palette.name}`
    });
    
    // Yield to UI every 10 items
    if (idx % 10 === 0 && idx > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const existing = existingPalettes.find(
      (p) => p.name.toLowerCase() === palette.name.toLowerCase()
    );

    if (existing) {
      // Handle conflict based on strategy
      if (options.mergeStrategy === 'skip') {
        result.skipped++;
        continue;
      } else if (options.mergeStrategy === 'rename') {
        // Import with renamed name
        const newName = generateUniquePaletteName(palette.name);
        const newPalette: Palette = {
          ...palette,
          id: generateId(),
          name: newName,
          createdAt: Date.now(),
        };

        // Collect for batch add
        palettesToAdd.push(newPalette);

        result.created++;
        result.ids.push(newPalette.id);
        result.warnings.push(`Palette "${palette.name}" imported as "${newName}"`);
      } else if (options.mergeStrategy === 'overwrite') {
        // Collect for batch update
        const index = paletteStore.palettes.findIndex((p) => p.id === existing.id);
        if (index !== -1) {
          palettesToUpdate.push({
            index,
            palette: {
              ...palette,
              id: existing.id, // Keep existing ID
              createdAt: existing.createdAt,
            }
          });
        }

        result.updated++;
        result.ids.push(existing.id);
        result.warnings.push(`Palette "${palette.name}" overwritten`);
      } else if (options.mergeStrategy === 'merge') {
        // Collect for batch update (merge)
        const index = paletteStore.palettes.findIndex((p) => p.id === existing.id);
        if (index !== -1) {
          palettesToUpdate.push({
            index,
            palette: {
              ...existing,
              steps: { ...existing.steps, ...palette.steps },
            }
          });
        }

        result.updated++;
        result.ids.push(existing.id);
        result.warnings.push(`Palette "${palette.name}" merged`);
      }
    } else {
      // No conflict - create new palette
      const newPalette: Palette = {
        ...palette,
        id: generateId(),
        createdAt: Date.now(),
      };

      // Collect for batch add
      palettesToAdd.push(newPalette);

      result.created++;
      result.ids.push(newPalette.id);
    }
  }
  
  // Apply all updates in batch (single save operation)
  if (palettesToAdd.length > 0) {
    paletteStore.palettes.push(...palettesToAdd);
  }
  if (palettesToUpdate.length > 0) {
    palettesToUpdate.forEach(({ index, palette }) => {
      paletteStore.palettes[index] = palette;
    });
  }
  
  // Save once at the end if there were any changes
  if (palettesToAdd.length > 0 || palettesToUpdate.length > 0) {
    paletteStore.savePalettes();
  }

  return result;
}

/**
 * Execute brand import (optimized with batching and progress tracking)
 */
async function executeBrandImport(
  brands: Brand[],
  options: ImportOptions,
  onProgress?: ImportProgressCallback
): Promise<{
  created: number;
  updated: number;
  skipped: number;
  ids: string[];
  warnings: string[];
}> {
  const result = {
    created: 0,
    updated: 0,
    skipped: 0,
    ids: [] as string[],
    warnings: [] as string[],
  };

  const brandStore = useBrandStore.getState();
  const existingBrands = brandStore.brands;

  // Filter selected brands
  let brandsToImport = brands;
  if (options.selectedBrandIds && options.selectedBrandIds.length > 0) {
    brandsToImport = brands.filter((b) =>
      options.selectedBrandIds!.includes(b.id)
    );
  }
  
  // Batch updates: collect all changes
  const brandsToCreate: Brand[] = [];

  for (let idx = 0; idx < brandsToImport.length; idx++) {
    const brand = brandsToImport[idx];
    
    // Report progress
    onProgress?.({
      phase: 'brands',
      current: idx + 1,
      total: brandsToImport.length,
      message: `Importing brand: ${brand.name}`
    });
    
    // Yield to UI every 10 items
    if (idx % 10 === 0 && idx > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    const existing = existingBrands.find(
      (b) => b.name.toLowerCase() === brand.name.toLowerCase()
    );

    if (existing) {
      // Handle conflict based on strategy
      if (options.mergeStrategy === 'skip') {
        result.skipped++;
        continue;
      } else if (options.mergeStrategy === 'rename') {
        // Import with renamed name
        const newName = generateUniqueBrandName(brand.name);
        const newBrand: Brand = {
          ...brand,
          id: generateId(),
          name: newName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          syncedAt: undefined,
        };

        // Collect for batch creation
        brandsToCreate.push(newBrand);

        result.created++;
        result.ids.push(newBrand.id);
        result.warnings.push(`Brand "${brand.name}" imported as "${newName}"`);
      } else if (options.mergeStrategy === 'overwrite') {
        // Update existing brand (use store action for proper Map maintenance)
        brandStore.updateBrand(existing.id, {
          ...brand,
          id: existing.id, // Keep existing ID
          createdAt: existing.createdAt,
          updatedAt: Date.now(),
        });

        result.updated++;
        result.ids.push(existing.id);
        result.warnings.push(`Brand "${brand.name}" overwritten`);
      } else if (options.mergeStrategy === 'merge') {
        // Merge collections (keep existing, add new ones) - use store action
        const mergedCollections = [
          ...(existing.collections || []),
          ...(brand.collections || []),
        ];

        brandStore.updateBrand(existing.id, {
          collections: mergedCollections,
          updatedAt: Date.now(),
        });

        result.updated++;
        result.ids.push(existing.id);
        result.warnings.push(`Brand "${brand.name}" merged`);
      }
    } else {
      // No conflict - create new brand
      const newBrand: Brand = {
        ...brand,
        id: generateId(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncedAt: undefined,
      };

      brandStore.brands.push(newBrand);
      brandStore.saveBrands();

      result.created++;
      result.ids.push(newBrand.id);
    }
  }

  // Update layer config with new brand names
  const allBrandNames = brandStore.brands.map((b) => b.name);
  useLayerMappingStore.getState().updateThemeAndBrandModes(allBrandNames);

  return result;
}

/**
 * Execute layer mapping import
 */
async function executeLayerMappingImport(
  config: LayerMappingConfig
): Promise<void> {
  const layerMappingStore = useLayerMappingStore.getState();

  // Import config JSON
  const configJson = JSON.stringify(config);
  layerMappingStore.importConfig(configJson);
}

/**
 * Generate unique palette name
 */
function generateUniquePaletteName(baseName: string): string {
  const paletteStore = usePaletteStore.getState();
  const existingPalettes = paletteStore.getAllPalettes();
  let counter = 1;
  let newName = `${baseName} (${counter})`;

  while (existingPalettes.some((p) => p.name === newName)) {
    counter++;
    newName = `${baseName} (${counter})`;
  }

  return newName;
}

/**
 * Generate unique brand name
 */
function generateUniqueBrandName(baseName: string): string {
  const brandStore = useBrandStore.getState();
  const existingBrands = brandStore.brands;
  let counter = 1;
  let newName = `${baseName} (${counter})`;

  while (existingBrands.some((b) => b.name === newName)) {
    counter++;
    newName = `${baseName} (${counter})`;
  }

  return newName;
}
