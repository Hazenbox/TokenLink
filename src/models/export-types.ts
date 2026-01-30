/**
 * Export/Import Types for VarCar Plugin
 * Defines the unified export format for brands, palettes, rules, and configurations
 */

import { Brand } from './brand';
import { Palette } from '@/store/palette-store';
import { LayerMappingConfig } from './layer-mapping';

// ============================================================================
// Schema Version Constants
// ============================================================================

/**
 * Current schema version following semantic versioning
 */
export const EXPORT_SCHEMA_VERSION = '1.0.0';

/**
 * Exporter name
 */
export const EXPORTER_NAME = 'VarCar';

// ============================================================================
// Export Format Types
// ============================================================================

/**
 * Export options for selective export
 */
export interface ExportOptions {
  includePalettes?: boolean;
  includeRules?: boolean;
  includeMappings?: boolean;
  author?: string;
  description?: string;
  selectedBrandIds?: string[];      // Export only specific brands
  selectedPaletteIds?: string[];   // Export only specific palettes
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  author?: string;
  description?: string;
  sourceFileId?: string;
  sourceFileKey?: string;
  exportOptions: {
    includePalettes: boolean;
    includeRules: boolean;
    includeMappings: boolean;
  };
}

/**
 * Export statistics
 */
export interface ExportStatistics {
  brandsCount: number;
  palettesCount: number;
  rulesCount?: number;
  totalVariables: number;
  totalCollections: number;
}

/**
 * Complete VarCar export structure
 */
export interface VarCarExport {
  schemaVersion: string;           // "1.0.0"
  exportDate: string;               // ISO timestamp
  exporter: string;                 // "VarCar"
  exporterVersion: string;          // Plugin version
  
  // Core data
  brands: Brand[];
  palettes: Palette[];
  rules?: any[];                    // Rule[] when rules engine is implemented
  layerMappings?: LayerMappingConfig;
  
  // Metadata
  metadata: ExportMetadata;
  
  // Statistics
  stats: ExportStatistics;
}

// ============================================================================
// Import Types
// ============================================================================

/**
 * Import options for conflict resolution
 */
export interface ImportOptions {
  mergeStrategy: 'skip' | 'overwrite' | 'rename' | 'merge';
  selectedBrandIds?: string[];      // Import only specific brands
  selectedPaletteIds?: string[];   // Import only specific palettes
  importPalettes?: boolean;
  importRules?: boolean;
  importMappings?: boolean;
}

/**
 * Conflict type
 */
export type ConflictType = 'duplicate-brand' | 'duplicate-palette' | 'missing-palette' | 'schema-version' | 'invalid-data';

/**
 * Conflict information
 */
export interface Conflict {
  type: ConflictType;
  severity: 'error' | 'warning';
  entityType: 'brand' | 'palette' | 'rule' | 'mapping';
  entityId: string;
  entityName: string;
  message: string;
  existingItem?: any;
  importedItem?: any;
  suggestedResolution?: 'skip' | 'overwrite' | 'rename';
}

/**
 * Parse result from import file
 */
export interface ParseResult {
  success: boolean;
  data?: VarCarExport;
  errors: string[];
  warnings: string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  schemaVersion?: string;
  isCompatible?: boolean;
}

/**
 * Import result with statistics
 */
export interface ImportResult {
  success: boolean;
  stats: {
    brandsCreated: number;
    brandsUpdated: number;
    brandsSkipped: number;
    palettesCreated: number;
    palettesUpdated: number;
    palettesSkipped: number;
    rulesCreated?: number;
    mappingsUpdated?: boolean;
  };
  errors: string[];
  warnings: string[];
  conflicts: Conflict[];
  importedBrandIds: string[];
  importedPaletteIds: string[];
}

/**
 * Import preview data (before actual import)
 */
export interface ImportPreview {
  exportData: VarCarExport;
  validation: ValidationResult;
  conflicts: Conflict[];
  estimatedChanges: {
    brandsToCreate: number;
    brandsToUpdate: number;
    palettesToCreate: number;
    palettesToUpdate: number;
    totalVariables: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Export/Import event for tracking
 */
export interface ExportImportEvent {
  type: 'export' | 'import';
  timestamp: number;
  filename?: string;
  stats: Partial<ExportStatistics> | Partial<ImportResult['stats']>;
  success: boolean;
  errorMessage?: string;
}
