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
 * Execute full import with proper ordering
 */
export async function executeImport(
  data: VarCarExport,
  options: ImportOptions
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
      const paletteResult = await executePaletteImport(data.palettes, options);
      result.stats.palettesCreated = paletteResult.created;
      result.stats.palettesUpdated = paletteResult.updated;
      result.stats.palettesSkipped = paletteResult.skipped;
      result.importedPaletteIds = paletteResult.ids;
      result.warnings.push(...paletteResult.warnings);
    }

    // Step 2: Import brands
    const brandResult = await executeBrandImport(data.brands, options);
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
 * Execute palette import
 */
async function executePaletteImport(
  palettes: Palette[],
  options: ImportOptions
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

  for (const palette of palettesToImport) {
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

        // Add directly to palette store
        // Note: We're directly modifying the palettes array here
        // In a production app, you'd want to use proper store actions
        paletteStore.palettes.push(newPalette);
        paletteStore.savePalettes();

        result.created++;
        result.ids.push(newPalette.id);
        result.warnings.push(`Palette "${palette.name}" imported as "${newName}"`);
      } else if (options.mergeStrategy === 'overwrite') {
        // Update existing palette
        const index = paletteStore.palettes.findIndex((p) => p.id === existing.id);
        if (index !== -1) {
          paletteStore.palettes[index] = {
            ...palette,
            id: existing.id, // Keep existing ID
            createdAt: existing.createdAt,
          };
          paletteStore.savePalettes();
        }

        result.updated++;
        result.ids.push(existing.id);
        result.warnings.push(`Palette "${palette.name}" overwritten`);
      } else if (options.mergeStrategy === 'merge') {
        // Merge palette steps (keep existing, add new ones)
        const index = paletteStore.palettes.findIndex((p) => p.id === existing.id);
        if (index !== -1) {
          paletteStore.palettes[index] = {
            ...existing,
            steps: { ...existing.steps, ...palette.steps },
          };
          paletteStore.savePalettes();
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

      paletteStore.palettes.push(newPalette);
      paletteStore.savePalettes();

      result.created++;
      result.ids.push(newPalette.id);
    }
  }

  return result;
}

/**
 * Execute brand import
 */
async function executeBrandImport(
  brands: Brand[],
  options: ImportOptions
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

  for (const brand of brandsToImport) {
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

        // Use brand store action to create brand
        brandStore.brands.push(newBrand);
        brandStore.saveBrands();

        result.created++;
        result.ids.push(newBrand.id);
        result.warnings.push(`Brand "${brand.name}" imported as "${newName}"`);
      } else if (options.mergeStrategy === 'overwrite') {
        // Update existing brand
        const index = brandStore.brands.findIndex((b) => b.id === existing.id);
        if (index !== -1) {
          brandStore.brands[index] = {
            ...brand,
            id: existing.id, // Keep existing ID
            createdAt: existing.createdAt,
            updatedAt: Date.now(),
          };
          brandStore.saveBrands();
        }

        result.updated++;
        result.ids.push(existing.id);
        result.warnings.push(`Brand "${brand.name}" overwritten`);
      } else if (options.mergeStrategy === 'merge') {
        // Merge collections (keep existing, add new ones)
        const index = brandStore.brands.findIndex((b) => b.id === existing.id);
        if (index !== -1) {
          const mergedCollections = [
            ...(existing.collections || []),
            ...(brand.collections || []),
          ];

          brandStore.brands[index] = {
            ...existing,
            collections: mergedCollections,
            updatedAt: Date.now(),
          };
          brandStore.saveBrands();
        }

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
