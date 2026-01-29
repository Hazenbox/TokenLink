/**
 * Rule type definitions for the rule engine.
 * Rules define patterns for automatic variable aliasing.
 */

// ============================================================================
// Rule Condition Types
// ============================================================================

/**
 * Condition that matches variables based on their collection and/or group
 */
export interface RuleCondition {
  /** Collection name (exact match) */
  collection?: string;
  /** Group name (exact match) */
  group?: string;
}

// ============================================================================
// Rule Action Types
// ============================================================================

/**
 * Action to perform when a rule matches
 */
export interface RuleAction {
  /** 
   * Target path for aliasing
   * Format: "collection/group" or "collection/group/variable"
   * Examples:
   * - "primitive/default" - alias to variables in the default group of primitive collection
   * - "primitive/colors/blue-500" - alias to specific variable
   */
  aliasTo: string;
}

// ============================================================================
// Rule Definition
// ============================================================================

/**
 * Complete rule definition
 */
export interface Rule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name */
  name: string;
  /** Optional description of what the rule does */
  description?: string;
  /** Condition to match variables */
  when: RuleCondition;
  /** Action to perform on matched variables */
  then: RuleAction;
  /** Whether the rule is enabled (default: true) */
  enabled?: boolean;
}

// ============================================================================
// Rule Validation
// ============================================================================

/**
 * Validation result for a rule
 */
export interface RuleValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a rule structure
 */
export function validateRule(rule: any): RuleValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!rule.id || typeof rule.id !== 'string') {
    errors.push('Rule must have a valid "id" field');
  }

  if (!rule.name || typeof rule.name !== 'string') {
    errors.push('Rule must have a valid "name" field');
  }

  // Check when clause
  if (!rule.when || typeof rule.when !== 'object') {
    errors.push('Rule must have a "when" object');
  } else {
    // At least one condition must be specified
    if (!rule.when.collection && !rule.when.group) {
      errors.push('Rule "when" must specify at least one condition (collection or group)');
    }

    // Validate condition types
    if (rule.when.collection && typeof rule.when.collection !== 'string') {
      errors.push('Rule "when.collection" must be a string');
    }

    if (rule.when.group && typeof rule.when.group !== 'string') {
      errors.push('Rule "when.group" must be a string');
    }
  }

  // Check then clause
  if (!rule.then || typeof rule.then !== 'object') {
    errors.push('Rule must have a "then" object');
  } else {
    if (!rule.then.aliasTo || typeof rule.then.aliasTo !== 'string') {
      errors.push('Rule "then.aliasTo" must be a non-empty string');
    } else {
      // Validate aliasTo format (should have at least one slash)
      const parts = rule.then.aliasTo.split('/');
      if (parts.length < 2) {
        errors.push('Rule "then.aliasTo" must be in format "collection/group" or "collection/group/variable"');
      }
    }
  }

  // Validate optional enabled field
  if (rule.enabled !== undefined && typeof rule.enabled !== 'boolean') {
    errors.push('Rule "enabled" must be a boolean');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Type guard to check if an object is a valid Rule
 */
export function isRule(obj: any): obj is Rule {
  return validateRule(obj).valid;
}

// ============================================================================
// Rule Utilities
// ============================================================================

/**
 * Parse the aliasTo path into components
 */
export interface ParsedAliasPath {
  collection: string;
  group: string;
  variable?: string;
}

/**
 * Parses an aliasTo path string into components
 */
export function parseAliasPath(aliasTo: string): ParsedAliasPath | null {
  const parts = aliasTo.split('/').filter(p => p.trim().length > 0);
  
  if (parts.length < 2) {
    return null;
  }

  return {
    collection: parts[0],
    group: parts[1],
    variable: parts.length > 2 ? parts[2] : undefined,
  };
}

/**
 * Creates a default rule
 */
export function createDefaultRule(): Rule {
  return {
    id: `rule-${Date.now()}`,
    name: 'New Rule',
    description: '',
    when: {
      collection: '',
      group: '',
    },
    then: {
      aliasTo: '',
    },
    enabled: true,
  };
}
