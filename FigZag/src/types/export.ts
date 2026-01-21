/**
 * JSON Export Schema
 * 
 * Defines the structure for exporting the complete token graph with metadata,
 * enabling audits, versioning, and integration with external pipelines.
 */

import { TokenGraph } from './graph';
import { RuleSet } from './rules';
import { Variable, Alias } from './models';

// ============================================================================
// Export Metadata
// ============================================================================

/**
 * Metadata about the export operation
 */
export interface ExportMetadata {
  /** Schema version for compatibility */
  version: string;
  
  /** ISO 8601 timestamp when export was created */
  exportedAt: string;
  
  /** Figma file ID (if available) */
  figmaFileId?: string;
  
  /** Figma file name */
  figmaFileName?: string;
  
  /** IDs of rules that were applied before export */
  rulesApplied?: string[];
  
  /** User or system that created the export */
  exportedBy?: string;
  
  /** Optional description or notes about this export */
  description?: string;
  
  /** Environment information */
  environment?: {
    /** Plugin version */
    pluginVersion?: string;
    
    /** Figma API version */
    figmaApiVersion?: string;
    
    /** Any additional context */
    [key: string]: unknown;
  };
}

// ============================================================================
// Export Statistics
// ============================================================================

/**
 * Summary statistics about the exported graph
 */
export interface ExportStatistics {
  /** Total number of collections */
  totalCollections: number;
  
  /** Total number of groups */
  totalGroups: number;
  
  /** Total number of variables */
  totalVariables: number;
  
  /** Total number of aliases */
  totalAliases: number;
  
  /** Number of broken aliases (pointing to non-existent variables) */
  brokenAliases: number;
  
  /** Number of circular dependencies detected */
  circularDependencies: number;
  
  /** Number of orphaned variables (not in any valid collection/group) */
  orphanedVariables: number;
  
  /** Breakdown by collection type */
  collectionsByType?: {
    primitive: number;
    semantic: number;
    interaction: number;
    theme: number;
  };
  
  /** Breakdown by variable type */
  variablesByType?: {
    COLOR: number;
    FLOAT: number;
    STRING: number;
    BOOLEAN: number;
  };
  
  /** Mode statistics */
  modeStatistics?: {
    /** Total number of unique modes */
    totalModes: number;
    
    /** Average modes per variable */
    averageModesPerVariable: number;
    
    /** Most common mode names */
    commonModes: { name: string; count: number }[];
  };
  
  /** Alias statistics */
  aliasStatistics?: {
    /** Variables with no aliases */
    primitiveVariables: number;
    
    /** Variables that are aliased */
    aliasedVariables: number;
    
    /** Most referenced variables (top targets) */
    topAliasTargets: { variableId: string; count: number }[];
  };
}

// ============================================================================
// Export Validation
// ============================================================================

/**
 * Validation issue found in the export
 */
export interface ValidationIssue {
  /** Unique identifier for this issue */
  id: string;
  
  /** Type of issue */
  type: 'error' | 'warning' | 'info';
  
  /** Category of the issue */
  category: 'circular-dependency' | 'broken-alias' | 'orphaned-variable' | 'missing-mode' | 'invalid-value' | 'other';
  
  /** Human-readable message */
  message: string;
  
  /** Affected entity ID (variable, alias, etc.) */
  affectedId?: string;
  
  /** Suggested fix */
  suggestion?: string;
  
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Result of validating an export
 */
export interface ExportValidationResult {
  /** Whether the export is valid */
  valid: boolean;
  
  /** All validation issues found */
  issues: ValidationIssue[];
  
  /** Count by type */
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// ============================================================================
// Export Options
// ============================================================================

/**
 * Options for customizing the export
 */
export interface ExportOptions {
  /** Whether to include rules in the export */
  includeRules?: boolean;
  
  /** Whether to include statistics */
  includeStatistics?: boolean;
  
  /** Whether to include validation results */
  includeValidation?: boolean;
  
  /** Whether to include only specific collections */
  collectionIds?: string[];
  
  /** Whether to pretty-print the JSON */
  prettyPrint?: boolean;
  
  /** Additional metadata to include */
  customMetadata?: Record<string, unknown>;
  
  /** Whether to include all variables or only aliased ones */
  includeAllVariables?: boolean;
  
  /** Whether to resolve alias chains (flatten) */
  resolveAliasChains?: boolean;
}

// ============================================================================
// Complete Export Schema
// ============================================================================

/**
 * TokenGraphExport is the complete export structure
 * This is the root object that gets serialized to JSON
 */
export interface TokenGraphExport {
  /** Metadata about this export */
  metadata: ExportMetadata;
  
  /** The complete token graph */
  graph: {
    collections: TokenGraph['collections'];
    groups: TokenGraph['groups'];
    variables: TokenGraph['variables'];
    aliases: TokenGraph['aliases'];
  };
  
  /** Rules that were used (optional) */
  rules?: RuleSet;
  
  /** Statistics about the graph (optional) */
  statistics?: ExportStatistics;
  
  /** Validation results (optional) */
  validation?: ExportValidationResult;
}

// ============================================================================
// Import Types
// ============================================================================

/**
 * Result of importing a token graph
 */
export interface ImportResult {
  /** Whether the import was successful */
  success: boolean;
  
  /** The imported graph (if successful) */
  graph?: TokenGraph;
  
  /** Errors encountered during import */
  errors: string[];
  
  /** Warnings encountered during import */
  warnings: string[];
  
  /** Statistics about what was imported */
  imported: {
    collections: number;
    groups: number;
    variables: number;
    aliases: number;
  };
  
  /** Items that were skipped */
  skipped: {
    collections: number;
    groups: number;
    variables: number;
    aliases: number;
  };
}

/**
 * Options for importing a token graph
 */
export interface ImportOptions {
  /** Whether to validate the import before applying */
  validate?: boolean;
  
  /** Whether to merge with existing graph or replace */
  mergeStrategy?: 'merge' | 'replace' | 'skip-existing';
  
  /** Whether to import rules as well */
  importRules?: boolean;
  
  /** Callback for resolving conflicts */
  conflictResolver?: (
    existingId: string,
    importedId: string
  ) => 'keep-existing' | 'use-imported' | 'merge';
}

// ============================================================================
// Diff Types (for version comparison)
// ============================================================================

/**
 * Type of change in a diff
 */
export type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

/**
 * Change record for a variable
 */
export interface VariableChange {
  /** Type of change */
  type: ChangeType;
  
  /** Variable ID */
  variableId: string;
  
  /** Variable before (if modified or removed) */
  before?: Variable;
  
  /** Variable after (if modified or added) */
  after?: Variable;
  
  /** Specific fields that changed */
  changedFields?: string[];
}

/**
 * Change record for an alias
 */
export interface AliasChange {
  /** Type of change */
  type: ChangeType;
  
  /** Alias ID */
  aliasId: string;
  
  /** Alias before (if modified or removed) */
  before?: Alias;
  
  /** Alias after (if modified or added) */
  after?: Alias;
}

/**
 * Diff between two token graph exports
 */
export interface TokenGraphDiff {
  /** When this diff was created */
  createdAt: string;
  
  /** Source export metadata */
  sourceMetadata: ExportMetadata;
  
  /** Target export metadata */
  targetMetadata: ExportMetadata;
  
  /** Collection changes */
  collections: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  
  /** Group changes */
  groups: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  
  /** Variable changes */
  variables: VariableChange[];
  
  /** Alias changes */
  aliases: AliasChange[];
  
  /** Summary statistics */
  summary: {
    totalChanges: number;
    additions: number;
    removals: number;
    modifications: number;
  };
}

// ============================================================================
// Export Formats
// ============================================================================

/**
 * Available export formats
 */
export type ExportFormat = 'json' | 'csv' | 'yaml' | 'markdown';

/**
 * Format-specific export options
 */
export interface FormatOptions {
  /** For JSON */
  json?: {
    indent?: number;
    sortKeys?: boolean;
  };
  
  /** For CSV */
  csv?: {
    delimiter?: string;
    includeHeaders?: boolean;
    flattenModes?: boolean;
  };
  
  /** For Markdown */
  markdown?: {
    includeTableOfContents?: boolean;
    groupByCollection?: boolean;
  };
}
