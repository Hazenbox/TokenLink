/**
 * Export Service
 * Unified export orchestration for brands, palettes, rules, and configurations
 */

import { useBrandStore } from '@/store/brand-store';
import { usePaletteStore } from '@/store/palette-store';
import { useLayerMappingStore } from '@/store/layer-mapping-store';
import {
  VarCarExport,
  ExportOptions,
  ExportStatistics,
  EXPORT_SCHEMA_VERSION,
  EXPORTER_NAME,
} from '@/models/export-types';
import { Brand } from '@/models/brand';
import { Palette } from '@/store/palette-store';

/**
 * Get plugin version from package.json
 */
const PLUGIN_VERSION = '0.1.0';

/**
 * Calculate export statistics
 */
function calculateStatistics(
  brands: Brand[],
  palettes: Palette[]
): ExportStatistics {
  let totalVariables = 0;
  let totalCollections = 0;

  brands.forEach((brand) => {
    if (brand.collections) {
      totalCollections += brand.collections.length;
      brand.collections.forEach((collection) => {
        totalVariables += collection.variableIds?.length || 0;
      });
    }
  });

  return {
    brandsCount: brands.length,
    palettesCount: palettes.length,
    rulesCount: 0, // TODO: Add when rules engine is integrated
    totalVariables,
    totalCollections,
  };
}

/**
 * Export all plugin data to VarCar format
 */
export function exportEverything(options: ExportOptions = {}): VarCarExport {
  const {
    includePalettes = true,
    includeRules = false,
    includeMappings = false,
    author,
    description,
    selectedBrandIds,
    selectedPaletteIds,
  } = options;

  // Get brands from store
  const brandStore = useBrandStore.getState();
  let brands = brandStore.brands;

  // Filter selected brands if specified
  if (selectedBrandIds && selectedBrandIds.length > 0) {
    brands = brands.filter((b) => selectedBrandIds.includes(b.id));
  }

  // Get palettes from store
  const paletteStore = usePaletteStore.getState();
  let palettes: Palette[] = [];
  
  if (includePalettes) {
    palettes = paletteStore.getAllPalettes();
    
    // Filter selected palettes if specified
    if (selectedPaletteIds && selectedPaletteIds.length > 0) {
      palettes = palettes.filter((p) => selectedPaletteIds.includes(p.id));
    }
  }

  // Get layer mappings if requested
  let layerMappings = undefined;
  if (includeMappings) {
    const layerMappingStore = useLayerMappingStore.getState();
    layerMappings = layerMappingStore.config;
  }

  // TODO: Get rules when rules engine is integrated
  const rules = includeRules ? [] : undefined;

  // Calculate statistics
  const stats = calculateStatistics(brands, palettes);

  // Create export structure
  const exportData: VarCarExport = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportDate: new Date().toISOString(),
    exporter: EXPORTER_NAME,
    exporterVersion: PLUGIN_VERSION,
    
    // Core data
    brands,
    palettes,
    rules,
    layerMappings,
    
    // Metadata
    metadata: {
      author,
      description,
      // TODO: Add Figma file ID/key if available
      exportOptions: {
        includePalettes,
        includeRules,
        includeMappings,
      },
    },
    
    // Statistics
    stats,
  };

  return exportData;
}

/**
 * Export to JSON string
 */
export function exportToJSON(options: ExportOptions = {}): string {
  const exportData = exportEverything(options);
  return JSON.stringify(exportData, null, 2);
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(options: ExportOptions = {}): string {
  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, -5); // Remove milliseconds and 'Z'

  const parts = ['varcar-export', timestamp];

  // Add description to filename if provided
  if (options.description) {
    const sanitized = options.description
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .slice(0, 30);
    parts.splice(1, 0, sanitized);
  }

  return `${parts.join('-')}.json`;
}

/**
 * Download export as JSON file
 */
export function downloadExport(options: ExportOptions = {}): void {
  const json = exportToJSON(options);
  const filename = generateExportFilename(options);

  // Create blob and download
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate export data structure
 */
export function validateExportData(data: VarCarExport): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.schemaVersion) {
    errors.push('Missing schemaVersion');
  }

  if (!data.exportDate) {
    errors.push('Missing exportDate');
  }

  if (!data.exporter) {
    errors.push('Missing exporter');
  }

  if (!data.exporterVersion) {
    errors.push('Missing exporterVersion');
  }

  if (!data.brands || !Array.isArray(data.brands)) {
    errors.push('Missing or invalid brands array');
  }

  if (!data.palettes || !Array.isArray(data.palettes)) {
    errors.push('Missing or invalid palettes array');
  }

  if (!data.metadata) {
    errors.push('Missing metadata');
  }

  if (!data.stats) {
    errors.push('Missing stats');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
