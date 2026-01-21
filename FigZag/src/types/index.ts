/**
 * FigZag Types - Central Export
 * 
 * This file serves as the main entry point for all type definitions
 * in the FigZag token graph system.
 */

// ============================================================================
// Core Data Models
// ============================================================================

export type {
  // Color types
  RGB,
  RGBA,
  
  // Collection types
  CollectionType,
  Collection,
  
  // Group types
  Group,
  
  // Mode and value types
  PrimitiveValue,
  AliasReference,
  Mode,
  
  // Variable types
  VariableType,
  Variable,
  
  // Alias types
  Alias,
  
  // Helper types
  VariablePath,
  VariableReference,
} from './models';

// ============================================================================
// Token Graph
// ============================================================================

export { TokenGraph } from './graph';

// ============================================================================
// Rule System
// ============================================================================

export type {
  // Pattern matching
  PatternMatch,
  
  // Rule condition
  RuleCondition,
  
  // Rule action
  ModeMappingStrategy,
  RuleAction,
  
  // Rule definition
  RulePriority,
  RuleScope,
  Rule,
  
  // Rule set
  RuleSet,
  
  // Rule execution
  RuleApplicationResult,
  RuleSetExecutionResult,
  
  // Rule validation
  RuleValidationError,
  RuleValidationResult,
  
  // Rule matching
  RuleMatch,
  RuleEvaluationResult,
  RuleConflict,
  
  // Rule templates
  RuleTemplate,
  RuleTemplateParameter,
} from './rules';

// ============================================================================
// Export System
// ============================================================================

export type {
  // Export metadata
  ExportMetadata,
  
  // Export statistics
  ExportStatistics,
  
  // Export validation
  ValidationIssue,
  ExportValidationResult,
  
  // Export options
  ExportOptions,
  
  // Complete export
  TokenGraphExport,
  
  // Import
  ImportResult,
  ImportOptions,
  
  // Diff
  ChangeType,
  VariableChange,
  AliasChange,
  TokenGraphDiff,
  
  // Export formats
  ExportFormat,
  FormatOptions,
} from './export';

// ============================================================================
// Utilities
// ============================================================================

export {
  // Type guards
  isRGB,
  isRGBA,
  isPrimitiveValue,
  isAliasReference,
  isCollection,
  isCollectionType,
  isGroup,
  isVariableType,
  isMode,
  isVariable,
  isAlias,
  
  // Validation
  validateCollection,
  validateVariable,
  validateAlias,
  
  // Conversion
  rgbToHex,
  rgbaToString,
  hexToRgb,
  primitiveValueToString,
  
  // Comparison
  rgbEquals,
  rgbaEquals,
  primitiveValueEquals,
  
  // Naming
  sanitizeName,
  generateId,
  parseVariablePath,
  buildVariablePath,
  
  // Query helpers
  filterVariablesByType,
  groupVariablesByCollection,
  groupVariablesByGroup,
  
  // Pattern matching
  matchesPattern,
  globToRegex,
} from './utils';

export type {
  ValidationError,
  ValidationResult,
} from './utils';
