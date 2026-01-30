/**
 * Import Service
 * Handles parsing, validation, and importing of VarCar export files
 */

import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';
import { useLayerMappingStore } from '@/store/layer-mapping-store';
import {
  VarCarExport,
  ParseResult,
  ValidationResult,
  ImportOptions,
  ImportResult,
  ImportPreview,
  EXPORT_SCHEMA_VERSION,
} from '@/models/export-types';
import { detectConflicts, hasBlockingConflicts } from './conflict-detector';
import { Brand } from '@/models/brand';
import { Palette } from '@/store/palette-store';

/**
 * Parse import file
 */
export async function parseImportFile(file: File): Promise<ParseResult> {
  try {
    const text = await file.text();
    const data = JSON.parse(text) as VarCarExport;

    // Basic validation
    const validation = validateImportStructure(data);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    }

    return {
      success: true,
      data,
      errors: [],
      warnings: validation.warnings,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        error instanceof Error
          ? `Failed to parse JSON: ${error.message}`
          : 'Failed to parse import file',
      ],
      warnings: [],
    };
  }
}

/**
 * Validate import data structure
 */
export function validateImportStructure(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!data.schemaVersion) {
    errors.push('Missing schemaVersion field');
  }

  if (!data.exportDate) {
    errors.push('Missing exportDate field');
  }

  if (!data.exporter) {
    errors.push('Missing exporter field');
  }

  if (!data.exporterVersion) {
    errors.push('Missing exporterVersion field');
  }

  if (!data.brands || !Array.isArray(data.brands)) {
    errors.push('Missing or invalid brands array');
  }

  if (!data.palettes || !Array.isArray(data.palettes)) {
    errors.push('Missing or invalid palettes array');
  }

  if (!data.metadata) {
    errors.push('Missing metadata section');
  }

  if (!data.stats) {
    errors.push('Missing stats section');
  }

  // Check schema version compatibility
  if (data.schemaVersion) {
    const compatibility = checkVersionCompatibility(data.schemaVersion);
    if (!compatibility.compatible) {
      errors.push(compatibility.message!);
    } else if (compatibility.message) {
      warnings.push(compatibility.message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    schemaVersion: data.schemaVersion,
    isCompatible: errors.length === 0,
  };
}

/**
 * Check version compatibility
 */
function checkVersionCompatibility(importVersion: string): {
  compatible: boolean;
  message?: string;
} {
  const [importMajor, importMinor] = importVersion.split('.').map(Number);
  const [currentMajor, currentMinor] = EXPORT_SCHEMA_VERSION
    .split('.')
    .map(Number);

  if (importMajor !== currentMajor) {
    return {
      compatible: false,
      message: `Incompatible schema version. Import: ${importVersion}, Current: ${EXPORT_SCHEMA_VERSION}. Major version mismatch prevents import.`,
    };
  }

  if (importMinor !== currentMinor) {
    return {
      compatible: true,
      message: `Schema version mismatch. Import: ${importVersion}, Current: ${EXPORT_SCHEMA_VERSION}. Minor version difference may cause issues.`,
    };
  }

  return {
    compatible: true,
  };
}

/**
 * Create import preview
 */
export function createImportPreview(data: VarCarExport): ImportPreview {
  const validation = validateImportStructure(data);
  const conflicts = detectConflicts(data);

  const brandStore = useBrandStore.getState();
  const paletteStore = usePaletteStore.getState();
  const existingBrands = brandStore.brands;
  const existingPalettes = paletteStore.getAllPalettes();

  // Calculate estimated changes
  let brandsToCreate = 0;
  let brandsToUpdate = 0;

  data.brands.forEach((brand) => {
    const existing = existingBrands.find((b) => b.name === brand.name);
    if (existing) {
      brandsToUpdate++;
    } else {
      brandsToCreate++;
    }
  });

  let palettesToCreate = 0;
  let palettesToUpdate = 0;

  data.palettes.forEach((palette) => {
    const existing = existingPalettes.find((p) => p.name === palette.name);
    if (existing) {
      palettesToUpdate++;
    } else {
      palettesToCreate++;
    }
  });

  return {
    exportData: data,
    validation,
    conflicts,
    estimatedChanges: {
      brandsToCreate,
      brandsToUpdate,
      palettesToCreate,
      palettesToUpdate,
      totalVariables: data.stats.totalVariables,
    },
  };
}

/**
 * Import data with options
 */
export async function importData(
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
    // Validate data
    const validation = validateImportStructure(data);
    if (!validation.valid) {
      result.errors = validation.errors;
      return result;
    }

    // Detect conflicts
    const conflicts = detectConflicts(data);
    result.conflicts = conflicts;

    // Check for blocking conflicts
    if (hasBlockingConflicts(conflicts) && options.mergeStrategy !== 'overwrite') {
      result.errors.push('Import blocked due to conflicts. Please resolve conflicts or choose overwrite strategy.');
      return result;
    }

    // Import palettes first (brands may reference them)
    if (options.importPalettes !== false) {
      const paletteResult = await importPalettes(data.palettes, options);
      result.stats.palettesCreated = paletteResult.created;
      result.stats.palettesUpdated = paletteResult.updated;
      result.stats.palettesSkipped = paletteResult.skipped;
      result.importedPaletteIds = paletteResult.ids;
      result.warnings.push(...paletteResult.warnings);
    }

    // Import brands
    const brandResult = await importBrands(data.brands, options);
    result.stats.brandsCreated = brandResult.created;
    result.stats.brandsUpdated = brandResult.updated;
    result.stats.brandsSkipped = brandResult.skipped;
    result.importedBrandIds = brandResult.ids;
    result.warnings.push(...brandResult.warnings);

    // Import layer mappings if included
    if (options.importMappings && data.layerMappings) {
      await importLayerMappings(data.layerMappings);
      result.stats.mappingsUpdated = true;
    }

    // TODO: Import rules when rules engine is integrated

    result.success = true;
  } catch (error) {
    result.errors.push(
      error instanceof Error
        ? `Import failed: ${error.message}`
        : 'Import failed with unknown error'
    );
  }

  return result;
}

/**
 * Import palettes
 */
async function importPalettes(
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

  // Filter selected palettes if specified
  let palettesToImport = palettes;
  if (options.selectedPaletteIds && options.selectedPaletteIds.length > 0) {
    palettesToImport = palettes.filter((p) =>
      options.selectedPaletteIds!.includes(p.id)
    );
  }

  for (const palette of palettesToImport) {
    const existing = existingPalettes.find((p) => p.name === palette.name);

    if (existing) {
      if (options.mergeStrategy === 'skip') {
        result.skipped++;
        continue;
      } else if (options.mergeStrategy === 'rename') {
        // Create with new name
        const newName = generateUniquePaletteName(palette.name);
        const newPalette = { ...palette, name: newName };
        // Note: We'll add the palette directly to the store in the next step
        result.created++;
        result.ids.push(palette.id);
        result.warnings.push(`Palette "${palette.name}" renamed to "${newName}"`);
      } else if (options.mergeStrategy === 'overwrite') {
        // Update existing palette
        result.updated++;
        result.ids.push(existing.id);
      }
    } else {
      result.created++;
      result.ids.push(palette.id);
    }
  }

  // Note: Actual palette store updates will be done in import-execution
  return result;
}

/**
 * Import brands
 */
async function importBrands(
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

  // Filter selected brands if specified
  let brandsToImport = brands;
  if (options.selectedBrandIds && options.selectedBrandIds.length > 0) {
    brandsToImport = brands.filter((b) =>
      options.selectedBrandIds!.includes(b.id)
    );
  }

  for (const brand of brandsToImport) {
    const existing = existingBrands.find((b) => b.name === brand.name);

    if (existing) {
      if (options.mergeStrategy === 'skip') {
        result.skipped++;
        continue;
      } else if (options.mergeStrategy === 'rename') {
        const newName = generateUniqueBrandName(brand.name);
        result.created++;
        result.ids.push(brand.id);
        result.warnings.push(`Brand "${brand.name}" renamed to "${newName}"`);
      } else if (options.mergeStrategy === 'overwrite') {
        result.updated++;
        result.ids.push(existing.id);
      }
    } else {
      result.created++;
      result.ids.push(brand.id);
    }
  }

  // Note: Actual brand store updates will be done in import-execution
  return result;
}

/**
 * Import layer mappings
 */
async function importLayerMappings(config: any): Promise<void> {
  const layerMappingStore = useLayerMappingStore.getState();
  // Note: Actual implementation will be done in import-execution
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
