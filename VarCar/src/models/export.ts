/**
 * Export schema types and functions for variable graph JSON export.
 * Provides a versioned, future-proof schema for exporting variable graphs.
 */

import {
  Collection,
  Group,
  Variable,
  Alias,
} from './types';
import { VariableGraph } from './graph';

// ============================================================================
// Schema Version Constants
// ============================================================================

/**
 * Current schema version following semantic versioning
 */
export const SCHEMA_VERSION = '1.0.0';

/**
 * Schema URL for validation (can be hosted in the future)
 */
export const SCHEMA_URL = 'https://tokenlink.dev/schemas/variable-graph/v1.0';

/**
 * Exporter name
 */
export const EXPORTER_NAME = 'Token Link';

/**
 * Exporter version
 */
export const EXPORTER_VERSION = '1.0.0';

// ============================================================================
// Export Schema Types
// ============================================================================

/**
 * Metadata about the export
 */
export interface ExportMetadata {
  /** ISO 8601 timestamp of when the export was created */
  exportDate: string;
  /** Name of the exporter tool */
  exporter: string;
  /** Version of the exporter tool */
  exporterVersion: string;
  /** Optional Figma file ID */
  figmaFileId?: string;
  /** Optional Figma file key */
  figmaFileKey?: string;
}

/**
 * The graph data structure containing all entities
 */
export interface ExportGraphData {
  collections: Collection[];
  groups: Group[];
  variables: Variable[];
  aliases: Alias[];
}

/**
 * Complete variable graph export structure with versioning and metadata
 */
export interface VariableGraphExport {
  /** JSON Schema reference for validation */
  $schema: string;
  /** Schema version for future compatibility */
  schemaVersion: string;
  /** Export metadata */
  metadata: ExportMetadata;
  /** The variable graph data */
  graph: ExportGraphData;
}

/**
 * Options for exporting a graph
 */
export interface ExportOptions {
  /** Whether to pretty-print the JSON (default: true) */
  prettyPrint?: boolean;
  /** Number of spaces for indentation (default: 2) */
  indent?: number;
  /** Include Figma file metadata if available */
  figmaFileId?: string;
  figmaFileKey?: string;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Converts a VariableGraph (with Maps) to a serializable export structure
 */
export function graphToExportData(graph: VariableGraph): ExportGraphData {
  return {
    collections: Array.from(graph.collections.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    groups: Array.from(graph.groups.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    variables: Array.from(graph.variables.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    aliases: graph.aliases,
  };
}

/**
 * Creates export metadata
 */
export function createExportMetadata(options?: ExportOptions): ExportMetadata {
  const metadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    exporter: EXPORTER_NAME,
    exporterVersion: EXPORTER_VERSION,
  };

  if (options?.figmaFileId) {
    metadata.figmaFileId = options.figmaFileId;
  }

  if (options?.figmaFileKey) {
    metadata.figmaFileKey = options.figmaFileKey;
  }

  return metadata;
}

/**
 * Exports a variable graph to a complete export structure
 */
export function createGraphExport(
  graph: VariableGraph,
  options?: ExportOptions
): VariableGraphExport {
  return {
    $schema: SCHEMA_URL,
    schemaVersion: SCHEMA_VERSION,
    metadata: createExportMetadata(options),
    graph: graphToExportData(graph),
  };
}

/**
 * Exports a variable graph to a JSON string
 * 
 * @param graph - The variable graph to export
 * @param options - Export options
 * @returns JSON string representation of the graph
 */
export function exportGraphToJSON(
  graph: VariableGraph,
  options?: ExportOptions
): string {
  const prettyPrint = options?.prettyPrint !== false; // default true
  const indent = options?.indent ?? 2;

  const exportData = createGraphExport(graph, options);

  return JSON.stringify(
    exportData,
    null,
    prettyPrint ? indent : undefined
  );
}

/**
 * Validates that an export structure is complete and valid
 */
export function validateExport(exportData: VariableGraphExport): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!exportData.$schema) {
    errors.push('Missing $schema field');
  }

  if (!exportData.schemaVersion) {
    errors.push('Missing schemaVersion field');
  }

  if (!exportData.metadata) {
    errors.push('Missing metadata section');
  } else {
    if (!exportData.metadata.exportDate) {
      errors.push('Missing metadata.exportDate');
    }
    if (!exportData.metadata.exporter) {
      errors.push('Missing metadata.exporter');
    }
    if (!exportData.metadata.exporterVersion) {
      errors.push('Missing metadata.exporterVersion');
    }
  }

  if (!exportData.graph) {
    errors.push('Missing graph section');
  } else {
    if (!Array.isArray(exportData.graph.collections)) {
      errors.push('graph.collections must be an array');
    }
    if (!Array.isArray(exportData.graph.groups)) {
      errors.push('graph.groups must be an array');
    }
    if (!Array.isArray(exportData.graph.variables)) {
      errors.push('graph.variables must be an array');
    }
    if (!Array.isArray(exportData.graph.aliases)) {
      errors.push('graph.aliases must be an array');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Options for importing a graph
 */
export interface ImportOptions {
  /** Strategy for handling existing collections */
  mergeStrategy?: 'skip' | 'overwrite' | 'create-new';
  /** Whether to create aliases during import */
  createAliases?: boolean;
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    collectionsCreated: number;
    groupsCreated: number;
    variablesCreated: number;
    aliasesCreated: number;
    skipped: number;
  };
}

/**
 * Parses and validates a JSON string for import
 */
export function parseImportJSON(jsonString: string): {
  valid: boolean;
  data?: VariableGraphExport;
  errors: string[];
} {
  try {
    const data = JSON.parse(jsonString) as VariableGraphExport;
    
    // Validate the parsed data
    const validation = validateExport(data);
    
    if (!validation.valid) {
      return {
        valid: false,
        errors: validation.errors,
      };
    }
    
    return {
      valid: true,
      data,
      errors: [],
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Invalid JSON: ${error instanceof Error ? error.message : 'Parse error'}`],
    };
  }
}

/**
 * Checks if a schema version is compatible with the current version
 */
export function isCompatibleVersion(importVersion: string): {
  compatible: boolean;
  message?: string;
} {
  const [importMajor] = importVersion.split('.').map(Number);
  const [currentMajor] = SCHEMA_VERSION.split('.').map(Number);
  
  if (importMajor > currentMajor) {
    return {
      compatible: false,
      message: `Import requires schema version ${importVersion}, but this tool only supports ${SCHEMA_VERSION}. Please update FigZig.`,
    };
  }
  
  if (importMajor < currentMajor) {
    return {
      compatible: true,
      message: `Import uses older schema version ${importVersion}. It will be migrated to ${SCHEMA_VERSION}.`,
    };
  }
  
  return {
    compatible: true,
  };
}

// ============================================================================
// Figma Native Export Format Types
// ============================================================================

/**
 * RGB color value in Figma's native format
 */
export interface FigmaNativeRGBA {
  r: number;  // 0-1
  g: number;  // 0-1
  b: number;  // 0-1
  a: number;  // 0-1
}

/**
 * Variable alias reference in Figma's native format
 */
export interface FigmaNativeAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

/**
 * Value type for a variable mode - can be a direct value or an alias
 */
export type FigmaNativeValue = FigmaNativeRGBA | FigmaNativeAlias | string | number | boolean;

/**
 * Mode definition in a Figma collection
 */
export interface FigmaNativeMode {
  name: string;
  modeId: string;
}

/**
 * Variable in Figma's native export format
 */
export interface FigmaNativeVariable {
  id: string;
  name: string;
  description?: string;
  key: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, FigmaNativeValue>;
  scopes: string[];
  hiddenFromPublishing: boolean;
  codeSyntax: Record<string, any>;
  variableCollectionId: string;
}

/**
 * Collection in Figma's native export format
 */
export interface FigmaNativeCollection {
  id: string;
  name: string;
  key: string;
  hiddenFromPublishing: boolean;
  defaultModeId: string;
  modes: FigmaNativeMode[];
  remote: boolean;
  variableIds: string[];
  variables: FigmaNativeVariable[];
}

/**
 * Complete Figma native export structure
 */
export interface FigmaNativeExport {
  schemaVersion: number;
  lastModified: string;
  collections: FigmaNativeCollection[];
}

/**
 * Result of parsing a Figma native JSON import
 */
export interface FigmaNativeParseResult {
  valid: boolean;
  data?: FigmaNativeExport;
  errors: string[];
  warnings: string[];
}
