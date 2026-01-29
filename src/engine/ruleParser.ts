/**
 * Rule parser and loader for the rule engine.
 * Handles parsing, validation, and loading of rules from JSON.
 */

import { Rule, validateRule, RuleValidationResult } from '../models/rules';

// ============================================================================
// Parser Functions
// ============================================================================

/**
 * Parses a JSON string into a Rule object
 * @param jsonString - JSON string representing a rule
 * @returns Parsed rule or null if parsing fails
 */
export function parseRule(jsonString: string): { rule: Rule | null; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const validation = validateRule(parsed);
    
    if (!validation.valid) {
      return {
        rule: null,
        error: `Invalid rule: ${validation.errors.join(', ')}`,
      };
    }
    
    return { rule: parsed as Rule };
  } catch (error) {
    return {
      rule: null,
      error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Parses multiple rules from a JSON array string
 * @param jsonString - JSON string representing an array of rules
 * @returns Array of parsed rules with any errors
 */
export function parseRules(jsonString: string): {
  rules: Rule[];
  errors: Array<{ index: number; error: string }>;
} {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      return {
        rules: [],
        errors: [{ index: -1, error: 'Expected an array of rules' }],
      };
    }
    
    const rules: Rule[] = [];
    const errors: Array<{ index: number; error: string }> = [];
    
    parsed.forEach((item, index) => {
      const validation = validateRule(item);
      if (validation.valid) {
        rules.push(item as Rule);
      } else {
        errors.push({
          index,
          error: validation.errors.join(', '),
        });
      }
    });
    
    return { rules, errors };
  } catch (error) {
    return {
      rules: [],
      errors: [
        {
          index: -1,
          error: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ],
    };
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates multiple rules and returns a summary
 */
export function validateRules(rules: Rule[]): {
  valid: boolean;
  errors: Array<{ ruleId: string; errors: string[] }>;
} {
  const errors: Array<{ ruleId: string; errors: string[] }> = [];
  
  rules.forEach((rule) => {
    const validation = validateRule(rule);
    if (!validation.valid) {
      errors.push({
        ruleId: rule.id,
        errors: validation.errors,
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks for duplicate rule IDs
 */
export function checkDuplicateRuleIds(rules: Rule[]): {
  hasDuplicates: boolean;
  duplicates: string[];
} {
  const idMap = new Map<string, number>();
  const duplicates: string[] = [];
  
  rules.forEach((rule) => {
    const count = idMap.get(rule.id) || 0;
    idMap.set(rule.id, count + 1);
  });
  
  idMap.forEach((count, id) => {
    if (count > 1) {
      duplicates.push(id);
    }
  });
  
  return {
    hasDuplicates: duplicates.length > 0,
    duplicates,
  };
}

// ============================================================================
// Rule Serialization
// ============================================================================

/**
 * Serializes a rule to a JSON string
 */
export function serializeRule(rule: Rule, pretty: boolean = true): string {
  return JSON.stringify(rule, null, pretty ? 2 : 0);
}

/**
 * Serializes multiple rules to a JSON string
 */
export function serializeRules(rules: Rule[], pretty: boolean = true): string {
  return JSON.stringify(rules, null, pretty ? 2 : 0);
}

// ============================================================================
// Rule Filtering
// ============================================================================

/**
 * Filters rules to return only enabled rules
 */
export function getEnabledRules(rules: Rule[]): Rule[] {
  return rules.filter((rule) => rule.enabled !== false);
}

/**
 * Gets a rule by ID
 */
export function getRuleById(rules: Rule[], ruleId: string): Rule | null {
  return rules.find((rule) => rule.id === ruleId) || null;
}

// ============================================================================
// Rule Transformation
// ============================================================================

/**
 * Normalizes rules by ensuring all optional fields have default values
 */
export function normalizeRule(rule: Rule): Rule {
  return {
    ...rule,
    enabled: rule.enabled !== false,
    description: rule.description || '',
  };
}

/**
 * Normalizes an array of rules
 */
export function normalizeRules(rules: Rule[]): Rule[] {
  return rules.map(normalizeRule);
}
