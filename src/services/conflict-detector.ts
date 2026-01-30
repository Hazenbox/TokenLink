/**
 * Conflict Detector Service
 * Detects conflicts between imported data and existing data
 */

import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';
import { Brand } from '@/models/brand';
import { Palette } from '@/store/palette-store';
import {
  Conflict,
  VarCarExport,
  EXPORT_SCHEMA_VERSION,
} from '@/models/export-types';

/**
 * Detect all conflicts in import data
 */
export function detectConflicts(importData: VarCarExport): Conflict[] {
  const conflicts: Conflict[] = [];

  // Check schema version compatibility
  const versionConflict = checkSchemaVersion(importData);
  if (versionConflict) {
    conflicts.push(versionConflict);
  }

  // Check for duplicate brands
  const brandConflicts = detectBrandConflicts(importData.brands);
  conflicts.push(...brandConflicts);

  // Check for duplicate palettes
  const paletteConflicts = detectPaletteConflicts(importData.palettes);
  conflicts.push(...paletteConflicts);

  // Check for missing palette references
  const missingPaletteConflicts = detectMissingPaletteReferences(
    importData.brands,
    importData.palettes
  );
  conflicts.push(...missingPaletteConflicts);

  return conflicts;
}

/**
 * Check schema version compatibility
 */
function checkSchemaVersion(importData: VarCarExport): Conflict | null {
  const importVersion = importData.schemaVersion;
  const currentVersion = EXPORT_SCHEMA_VERSION;

  // Parse version numbers
  const [importMajor, importMinor] = importVersion.split('.').map(Number);
  const [currentMajor, currentMinor] = currentVersion.split('.').map(Number);

  // Major version mismatch is an error
  if (importMajor !== currentMajor) {
    return {
      type: 'schema-version',
      severity: 'error',
      entityType: 'brand',
      entityId: 'schema',
      entityName: 'Schema Version',
      message: `Incompatible schema version. Import: ${importVersion}, Current: ${currentVersion}. Major version mismatch.`,
      suggestedResolution: 'skip',
    };
  }

  // Minor version difference is a warning
  if (importMinor !== currentMinor) {
    return {
      type: 'schema-version',
      severity: 'warning',
      entityType: 'brand',
      entityId: 'schema',
      entityName: 'Schema Version',
      message: `Schema version mismatch. Import: ${importVersion}, Current: ${currentVersion}. Minor version difference may cause issues.`,
      suggestedResolution: undefined,
    };
  }

  return null;
}

/**
 * Detect duplicate brand names
 */
function detectBrandConflicts(importBrands: Brand[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const brandStore = useBrandStore.getState();
  const existingBrands = brandStore.brands;

  importBrands.forEach((importBrand) => {
    const existing = existingBrands.find(
      (b) => b.name.toLowerCase() === importBrand.name.toLowerCase()
    );

    if (existing) {
      conflicts.push({
        type: 'duplicate-brand',
        severity: 'warning',
        entityType: 'brand',
        entityId: importBrand.id,
        entityName: importBrand.name,
        message: `Brand "${importBrand.name}" already exists`,
        existingItem: existing,
        importedItem: importBrand,
        suggestedResolution: 'rename',
      });
    }
  });

  return conflicts;
}

/**
 * Detect duplicate palette names
 */
function detectPaletteConflicts(importPalettes: Palette[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const paletteStore = usePaletteStore.getState();
  const existingPalettes = paletteStore.getAllPalettes();

  importPalettes.forEach((importPalette) => {
    const existing = existingPalettes.find(
      (p) => p.name.toLowerCase() === importPalette.name.toLowerCase()
    );

    if (existing) {
      conflicts.push({
        type: 'duplicate-palette',
        severity: 'warning',
        entityType: 'palette',
        entityId: importPalette.id,
        entityName: importPalette.name,
        message: `Palette "${importPalette.name}" already exists`,
        existingItem: existing,
        importedItem: importPalette,
        suggestedResolution: 'rename',
      });
    }
  });

  return conflicts;
}

/**
 * Detect missing palette references in brands
 */
function detectMissingPaletteReferences(
  importBrands: Brand[],
  importPalettes: Palette[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const paletteStore = usePaletteStore.getState();
  const existingPalettes = paletteStore.getAllPalettes();

  // Combine existing and import palettes for reference check
  const allPaletteIds = new Set([
    ...existingPalettes.map((p) => p.id),
    ...importPalettes.map((p) => p.id),
  ]);

  importBrands.forEach((brand) => {
    // Check for deprecated colors structure (backward compatibility)
    if (brand.colors) {
      const { primary, secondary, sparkle, neutral, semantic } = brand.colors;
      
      const paletteRefs = [
        primary,
        secondary,
        sparkle,
        neutral,
        semantic?.positive,
        semantic?.negative,
        semantic?.warning,
        semantic?.informative,
      ].filter(Boolean);

      paletteRefs.forEach((ref) => {
        if (ref && !allPaletteIds.has(ref.paletteId)) {
          conflicts.push({
            type: 'missing-palette',
            severity: 'error',
            entityType: 'brand',
            entityId: brand.id,
            entityName: brand.name,
            message: `Brand "${brand.name}" references missing palette "${ref.paletteName}" (ID: ${ref.paletteId})`,
            suggestedResolution: 'skip',
          });
        }
      });
    }

    // Check collections for palette assignments
    if (brand.collections) {
      brand.collections.forEach((collection) => {
        if (collection.paletteAssignments) {
          Object.entries(collection.paletteAssignments).forEach(
            ([groupName, assignment]) => {
              if (!allPaletteIds.has(assignment.paletteId)) {
                conflicts.push({
                  type: 'missing-palette',
                  severity: 'error',
                  entityType: 'brand',
                  entityId: brand.id,
                  entityName: brand.name,
                  message: `Brand "${brand.name}" collection "${collection.name}" references missing palette "${assignment.paletteName}" (ID: ${assignment.paletteId})`,
                  suggestedResolution: 'skip',
                });
              }
            }
          );
        }
      });
    }
  });

  return conflicts;
}

/**
 * Group conflicts by severity
 */
export function groupConflictsBySeverity(conflicts: Conflict[]): {
  errors: Conflict[];
  warnings: Conflict[];
} {
  return {
    errors: conflicts.filter((c) => c.severity === 'error'),
    warnings: conflicts.filter((c) => c.severity === 'warning'),
  };
}

/**
 * Check if conflicts prevent import
 */
export function hasBlockingConflicts(conflicts: Conflict[]): boolean {
  return conflicts.some((c) => c.severity === 'error');
}
