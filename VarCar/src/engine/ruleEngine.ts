/**
 * Main rule engine orchestrator.
 * Coordinates rule loading, evaluation, and execution.
 */

import { VariableGraph } from '../models';
import { Rule } from '../models/rules';
import {
  EvaluationResult,
  EvaluationMode,
  AliasOperation,
} from './types';
import { parseRules, getEnabledRules, normalizeRules } from './ruleParser';
import {
  evaluateRules,
  generateAliasOperations,
  formatEvaluationSummary,
  formatEvaluationResult,
} from './ruleEvaluator';

// ============================================================================
// Rule Engine State
// ============================================================================

/**
 * Rule engine state container
 */
export interface RuleEngineState {
  rules: Rule[];
  lastEvaluationResult: EvaluationResult | null;
}

/**
 * Creates an empty rule engine state
 */
export function createRuleEngineState(): RuleEngineState {
  return {
    rules: [],
    lastEvaluationResult: null,
  };
}

// ============================================================================
// Rule Loading
// ============================================================================

/**
 * Loads rules from JSON string
 * @param jsonString - JSON string containing rules array
 * @returns Result with loaded rules and any errors
 */
export function loadRulesFromJSON(jsonString: string): {
  success: boolean;
  rules: Rule[];
  errors: string[];
} {
  const parseResult = parseRules(jsonString);

  if (parseResult.errors.length > 0) {
    return {
      success: false,
      rules: [],
      errors: parseResult.errors.map(
        (e) => `Error at index ${e.index}: ${e.error}`
      ),
    };
  }

  return {
    success: true,
    rules: normalizeRules(parseResult.rules),
    errors: [],
  };
}

/**
 * Adds a rule to the state
 */
export function addRule(state: RuleEngineState, rule: Rule): RuleEngineState {
  return {
    ...state,
    rules: [...state.rules, rule],
  };
}

/**
 * Updates a rule in the state
 */
export function updateRule(state: RuleEngineState, rule: Rule): RuleEngineState {
  return {
    ...state,
    rules: state.rules.map((r) => (r.id === rule.id ? rule : r)),
  };
}

/**
 * Removes a rule from the state
 */
export function removeRule(state: RuleEngineState, ruleId: string): RuleEngineState {
  return {
    ...state,
    rules: state.rules.filter((r) => r.id !== ruleId),
  };
}

/**
 * Toggles a rule's enabled state
 */
export function toggleRuleEnabled(
  state: RuleEngineState,
  ruleId: string
): RuleEngineState {
  return {
    ...state,
    rules: state.rules.map((r) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ),
  };
}

// ============================================================================
// Rule Evaluation (Dry-Run)
// ============================================================================

/**
 * Performs a dry-run evaluation of rules
 * @param graph - Variable graph
 * @param state - Rule engine state
 * @param options - Evaluation options
 * @returns Evaluation result with preview
 */
export function dryRunRules(
  graph: VariableGraph,
  state: RuleEngineState,
  options: {
    enabledOnly?: boolean;
  } = {}
): EvaluationResult {
  const { enabledOnly = true } = options;

  const rulesToEvaluate = enabledOnly
    ? getEnabledRules(state.rules)
    : state.rules;

  if (rulesToEvaluate.length === 0) {
    const emptyResult: EvaluationResult = {
      mode: 'dry-run',
      steps: [],
      totalMatched: 0,
      totalAliases: 0,
      errors: ['No rules to evaluate'],
      warnings: [],
      success: false,
    };
    return emptyResult;
  }

  return evaluateRules(graph, rulesToEvaluate, 'dry-run');
}

// ============================================================================
// Rule Application (Apply Mode)
// ============================================================================

/**
 * Result of applying rules
 */
export interface ApplyResult {
  evaluationResult: EvaluationResult;
  operations: AliasOperation[];
  success: boolean;
}

/**
 * Evaluates rules in apply mode and generates operations
 * Note: This doesn't execute the operations, just generates them
 * @param graph - Variable graph
 * @param state - Rule engine state
 * @param options - Evaluation options
 * @returns Apply result with operations to execute
 */
export function applyRules(
  graph: VariableGraph,
  state: RuleEngineState,
  options: {
    enabledOnly?: boolean;
  } = {}
): ApplyResult {
  const { enabledOnly = true } = options;

  const rulesToEvaluate = enabledOnly
    ? getEnabledRules(state.rules)
    : state.rules;

  if (rulesToEvaluate.length === 0) {
    const emptyResult: EvaluationResult = {
      mode: 'apply',
      steps: [],
      totalMatched: 0,
      totalAliases: 0,
      errors: ['No rules to evaluate'],
      warnings: [],
      success: false,
    };

    return {
      evaluationResult: emptyResult,
      operations: [],
      success: false,
    };
  }

  const evaluationResult = evaluateRules(graph, rulesToEvaluate, 'apply');
  const operations = generateAliasOperations(evaluationResult);

  return {
    evaluationResult,
    operations,
    success: evaluationResult.success,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Gets a summary of the rule engine state
 */
export function getStateSummary(state: RuleEngineState): {
  totalRules: number;
  enabledRules: number;
  disabledRules: number;
  hasLastEvaluation: boolean;
} {
  const enabledCount = state.rules.filter((r) => r.enabled !== false).length;

  return {
    totalRules: state.rules.length,
    enabledRules: enabledCount,
    disabledRules: state.rules.length - enabledCount,
    hasLastEvaluation: state.lastEvaluationResult !== null,
  };
}

/**
 * Exports rules to JSON string
 */
export function exportRulesToJSON(state: RuleEngineState, pretty: boolean = true): string {
  return JSON.stringify(state.rules, null, pretty ? 2 : 0);
}

/**
 * Gets formatted evaluation result for UI display
 */
export function getFormattedResult(result: EvaluationResult) {
  return formatEvaluationResult(result);
}

/**
 * Gets text summary of evaluation result
 */
export function getTextSummary(result: EvaluationResult): string {
  return formatEvaluationSummary(result);
}

// ============================================================================
// Rule Engine API
// ============================================================================

/**
 * Complete rule engine API
 */
export const RuleEngine = {
  // State management
  createState: createRuleEngineState,
  addRule,
  updateRule,
  removeRule,
  toggleRuleEnabled,

  // Rule loading
  loadRulesFromJSON,
  exportRulesToJSON,

  // Evaluation
  dryRun: dryRunRules,
  apply: applyRules,

  // Utilities
  getStateSummary,
  getFormattedResult,
  getTextSummary,
};

export default RuleEngine;
