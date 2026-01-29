/**
 * Public API for the internal variable graph model.
 * This module exports all types, interfaces, and utility functions.
 */

// ============================================================================
// Type Exports
// ============================================================================

export type {
  Collection,
  CollectionType,
  Group,
  Variable,
  VariableType,
  Mode,
  ModeValue,
  ModeAlias,
  ModeValueOrAlias,
  Alias,
} from './types';

// ============================================================================
// Type Guard Exports
// ============================================================================

export { isModeValue, isModeAlias } from './types';

// ============================================================================
// Graph Exports
// ============================================================================

export type { VariableGraph, ValidationResult } from './graph';

export {
  // Factory functions
  createGraph,
  
  // Builder methods
  addCollection,
  addGroup,
  addVariable,
  
  // Query helpers
  getVariableByPath,
  getAliasesForVariable,
  getVariablesInGroup,
  getGroupsInCollection,
  getCollectionForGroup,
  getGroupForVariable,
  
  // Graph statistics
  getGraphStats,
  
  // Validation
  validateGraph,
  detectCircularDependencies,
  wouldCreateCycle,
} from './graph';

// ============================================================================
// Rule Exports
// ============================================================================

export type {
  Rule,
  RuleCondition,
  RuleAction,
  RuleValidationResult,
  ParsedAliasPath,
} from './rules';

export {
  validateRule,
  isRule,
  parseAliasPath,
  createDefaultRule,
} from './rules';

// ============================================================================
// Export Exports
// ============================================================================

export type {
  ExportMetadata,
  ExportGraphData,
  VariableGraphExport,
  ExportOptions,
  ImportOptions,
  ImportResult,
} from './export';

export {
  SCHEMA_VERSION,
  SCHEMA_URL,
  EXPORTER_NAME,
  EXPORTER_VERSION,
  graphToExportData,
  createExportMetadata,
  createGraphExport,
  exportGraphToJSON,
  validateExport,
  parseImportJSON,
  isCompatibleVersion,
} from './export';
