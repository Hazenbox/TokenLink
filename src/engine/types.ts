/**
 * Type definitions for rule evaluation results and steps.
 */

import { Variable, CollectionType } from '../models';

// ============================================================================
// Match Result Types
// ============================================================================

/**
 * Represents a matched variable pair with mode mappings
 */
export interface VariableMatch {
  /** Source variable that will receive the alias */
  sourceVariable: Variable;
  /** Target variable that will be aliased to */
  targetVariable: Variable;
  /** Source collection type (for validation) */
  sourceCollectionType: CollectionType;
  /** Target collection type (for validation) */
  targetCollectionType: CollectionType;
  /** Mode mappings: source mode ID → target mode ID */
  modeMappings: Array<{
    sourceModeId: string;
    sourceModeName: string;
    targetModeId: string;
    targetModeName: string;
  }>;
}

// ============================================================================
// Evaluation Step Types
// ============================================================================

/**
 * Status of a rule evaluation step
 */
export type EvaluationStepStatus = 'matched' | 'skipped' | 'error';

/**
 * Represents one step in the rule evaluation process
 */
export interface EvaluationStep {
  /** ID of the rule being evaluated */
  ruleId: string;
  /** Name of the rule */
  ruleName: string;
  /** Status of this evaluation step */
  status: EvaluationStepStatus;
  /** Variables matched by this rule */
  matchedVariables: VariableMatch[];
  /** Number of aliases that would be created */
  aliasCount: number;
  /** Error message if status is 'error' */
  error?: string;
  /** Warning messages */
  warnings: string[];
  /** Reason for skipping if status is 'skipped' */
  skipReason?: string;
}

// ============================================================================
// Evaluation Result Types
// ============================================================================

/**
 * Evaluation mode
 */
export type EvaluationMode = 'dry-run' | 'apply';

/**
 * Complete result of rule evaluation
 */
export interface EvaluationResult {
  /** Mode used for evaluation */
  mode: EvaluationMode;
  /** Individual evaluation steps for each rule */
  steps: EvaluationStep[];
  /** Total number of variables matched across all rules */
  totalMatched: number;
  /** Total number of aliases that would be/were created */
  totalAliases: number;
  /** Global errors that prevented evaluation */
  errors: string[];
  /** Global warnings */
  warnings: string[];
  /** Whether the evaluation completed successfully */
  success: boolean;
}

// ============================================================================
// Alias Operation Types
// ============================================================================

/**
 * Represents an alias operation to be executed
 */
export interface AliasOperation {
  /** Source variable ID */
  sourceVariableId: string;
  /** Source variable name (for logging) */
  sourceVariableName: string;
  /** Source mode ID */
  sourceModeId: string;
  /** Source mode name (for logging) */
  sourceModeName: string;
  /** Target variable ID */
  targetVariableId: string;
  /** Target variable name (for logging) */
  targetVariableName: string;
  /** Target mode ID */
  targetModeId: string;
  /** Target mode name (for logging) */
  targetModeName: string;
  /** Rule that generated this operation */
  ruleId: string;
  /** Rule name */
  ruleName: string;
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an empty evaluation result
 */
export function createEvaluationResult(mode: EvaluationMode): EvaluationResult {
  return {
    mode,
    steps: [],
    totalMatched: 0,
    totalAliases: 0,
    errors: [],
    warnings: [],
    success: true,
  };
}

/**
 * Creates an evaluation step with default values
 */
export function createEvaluationStep(
  ruleId: string,
  ruleName: string,
  status: EvaluationStepStatus = 'matched'
): EvaluationStep {
  return {
    ruleId,
    ruleName,
    status,
    matchedVariables: [],
    aliasCount: 0,
    warnings: [],
  };
}
