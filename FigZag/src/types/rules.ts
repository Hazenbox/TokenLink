/**
 * Rule Definition Schema
 * 
 * Defines the structure for rule-based automation of variable aliasing.
 * Rules allow batch operations and eliminate manual repetition.
 */

import { CollectionType, VariablePath } from './models';

// ============================================================================
// Rule Condition Types
// ============================================================================

/**
 * Pattern matching type for rules
 * Can be an exact string match or a regular expression
 */
export type PatternMatch = string | RegExp;

/**
 * RuleCondition defines when a rule should be applied
 * All specified conditions must match for the rule to trigger (AND logic)
 */
export interface RuleCondition {
  /** Match collection by name or type */
  collection?: string | CollectionType;
  
  /** Match group by name (supports regex) */
  group?: PatternMatch;
  
  /** Match variable by name (supports regex) */
  variableName?: PatternMatch;
  
  /** Match specific mode name */
  mode?: string;
  
  /** Match by collection type */
  collectionType?: CollectionType;
  
  /** Additional custom conditions (for future extensibility) */
  custom?: Record<string, unknown>;
}

// ============================================================================
// Rule Action Types
// ============================================================================

/**
 * Mode mapping strategy
 * - 'exact': Map mode names exactly (e.g., "light" -> "light")
 * - 'default': Map all modes to target's default mode
 * - 'custom': Use custom mode mapping
 */
export type ModeMappingStrategy = 'exact' | 'default' | 'custom';

/**
 * RuleAction defines what should happen when a rule matches
 */
export interface RuleAction {
  /** 
   * Target to alias to, in path format: "collection/group/variable"
   * Example: "primitive/color/blue-500"
   */
  aliasTo: VariablePath;
  
  /** 
   * How to map modes from source to target
   * - If 'exact', mode names must match
   * - If 'default', all source modes map to target's default mode
   * - If 'custom', use the modeMapping
   */
  modeMappingStrategy?: ModeMappingStrategy;
  
  /** 
   * Custom mode mapping when strategy is 'custom'
   * Maps source mode name to target mode name
   * Example: { "hover": "default", "pressed": "dark" }
   */
  modeMapping?: Record<string, string>;
  
  /** 
   * Whether to override existing aliases
   * Default: false (only apply to variables with primitive values)
   */
  overrideExisting?: boolean;
}

// ============================================================================
// Rule Types
// ============================================================================

/**
 * Rule priority level
 * Higher priority rules are evaluated first
 */
export type RulePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Rule execution scope
 * - 'all': Apply to all matching variables
 * - 'collection': Apply within a single collection
 * - 'group': Apply within a single group
 */
export type RuleScope = 'all' | 'collection' | 'group';

/**
 * Rule represents a complete automation rule
 */
export interface Rule {
  /** Unique identifier for this rule */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Optional description explaining what this rule does */
  readonly description?: string;
  
  /** Condition that must match for the rule to apply */
  readonly when: RuleCondition;
  
  /** Action to perform when condition matches */
  readonly then: RuleAction;
  
  /** Whether this rule is currently enabled */
  enabled: boolean;
  
  /** Priority level for rule evaluation */
  priority?: RulePriority;
  
  /** Scope of rule execution */
  scope?: RuleScope;
  
  /** Tags for organization and filtering */
  tags?: string[];
  
  /** Timestamp when rule was created */
  createdAt?: string; // ISO 8601 timestamp
  
  /** Timestamp when rule was last modified */
  updatedAt?: string; // ISO 8601 timestamp
  
  /** User or system that created the rule */
  createdBy?: string;
}

// ============================================================================
// Rule Set Types
// ============================================================================

/**
 * RuleSet is a collection of rules that can be managed together
 * Rules are evaluated in order based on priority
 */
export interface RuleSet {
  /** Unique identifier for this rule set */
  readonly id: string;
  
  /** Name of the rule set */
  readonly name: string;
  
  /** Optional description */
  readonly description?: string;
  
  /** Array of rules in this set */
  rules: Rule[];
  
  /** Schema version for compatibility */
  version: string;
  
  /** Timestamp when rule set was created */
  createdAt?: string;
  
  /** Timestamp when rule set was last modified */
  updatedAt?: string;
}

// ============================================================================
// Rule Execution Types
// ============================================================================

/**
 * Result of applying a single rule to a variable
 */
export interface RuleApplicationResult {
  /** The rule that was applied */
  ruleId: string;
  
  /** The variable that was affected */
  variableId: string;
  
  /** Whether the rule was successfully applied */
  success: boolean;
  
  /** Error message if application failed */
  error?: string;
  
  /** What changed (for audit trail) */
  changes?: {
    before: string; // Description of state before
    after: string; // Description of state after
  };
}

/**
 * Result of executing a rule set
 */
export interface RuleSetExecutionResult {
  /** The rule set that was executed */
  ruleSetId: string;
  
  /** Timestamp when execution started */
  startedAt: string;
  
  /** Timestamp when execution completed */
  completedAt: string;
  
  /** Total number of rules evaluated */
  rulesEvaluated: number;
  
  /** Number of rules that matched variables */
  rulesMatched: number;
  
  /** Number of variables affected */
  variablesAffected: number;
  
  /** Individual results for each rule application */
  results: RuleApplicationResult[];
  
  /** Any errors that occurred during execution */
  errors: string[];
}

// ============================================================================
// Rule Validation Types
// ============================================================================

/**
 * Validation error for a rule
 */
export interface RuleValidationError {
  /** The field that has an error */
  field: string;
  
  /** Error message */
  message: string;
  
  /** Severity of the error */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Result of validating a rule
 */
export interface RuleValidationResult {
  /** Whether the rule is valid */
  valid: boolean;
  
  /** List of validation errors */
  errors: RuleValidationError[];
  
  /** List of warnings (non-blocking issues) */
  warnings: RuleValidationError[];
}

// ============================================================================
// Rule Match Types
// ============================================================================

/**
 * Information about a variable that matches a rule
 */
export interface RuleMatch {
  /** The rule that matched */
  ruleId: string;
  
  /** The variable that matched */
  variableId: string;
  
  /** The mode that matched (if mode-specific) */
  modeId?: string;
  
  /** Confidence score (0-1) for fuzzy matching */
  confidence?: number;
  
  /** Which conditions matched */
  matchedConditions: string[];
}

/**
 * Result of evaluating rules (dry-run)
 */
export interface RuleEvaluationResult {
  /** Total number of rules evaluated */
  totalRules: number;
  
  /** Rules that matched at least one variable */
  matchedRules: number;
  
  /** All matches found */
  matches: RuleMatch[];
  
  /** Estimated number of changes */
  estimatedChanges: number;
  
  /** Any conflicts detected */
  conflicts: RuleConflict[];
}

/**
 * Conflict between multiple rules
 */
export interface RuleConflict {
  /** The variable where conflict occurs */
  variableId: string;
  
  /** The conflicting rules */
  ruleIds: string[];
  
  /** Description of the conflict */
  description: string;
  
  /** Suggested resolution */
  suggestion?: string;
}

// ============================================================================
// Rule Templates
// ============================================================================

/**
 * Common rule templates for quick setup
 */
export interface RuleTemplate {
  /** Template identifier */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Category for organization */
  category: 'aliasing' | 'mode-mapping' | 'collection' | 'custom';
  
  /** Template rule (with placeholders) */
  template: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>;
  
  /** Parameters that can be customized */
  parameters: RuleTemplateParameter[];
}

/**
 * Parameter for a rule template
 */
export interface RuleTemplateParameter {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: 'string' | 'pattern' | 'collection' | 'mode';
  
  /** Description of the parameter */
  description: string;
  
  /** Default value */
  defaultValue?: unknown;
  
  /** Whether this parameter is required */
  required: boolean;
}
