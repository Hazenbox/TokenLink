/**
 * Rule evaluator - evaluates rules against the graph and generates alias operations.
 * Supports both dry-run (preview) and apply (execute) modes.
 */

import { VariableGraph, wouldCreateCycle } from '../models';
import { Rule } from '../models/rules';
import {
  EvaluationResult,
  EvaluationStep,
  EvaluationMode,
  AliasOperation,
  createEvaluationResult,
  createEvaluationStep,
} from './types';
import { matchVariables, getVariablePath } from './ruleMatcher';
import { validateAliasDirection } from '../utils/aliasValidation';

// ============================================================================
// Rule Evaluation
// ============================================================================

/**
 * Evaluates a single rule and generates an evaluation step
 * @param graph - Variable graph
 * @param rule - Rule to evaluate
 * @returns Evaluation step with results
 */
export function evaluateRule(
  graph: VariableGraph,
  rule: Rule
): EvaluationStep {
  const step = createEvaluationStep(rule.id, rule.name);

  // Check if rule is enabled
  if (rule.enabled === false) {
    step.status = 'skipped';
    step.skipReason = 'Rule is disabled';
    return step;
  }

  // Match variables
  const matchResult = matchVariables(graph, rule);

  if (matchResult.error) {
    step.status = 'error';
    step.error = matchResult.error;
    return step;
  }

  if (matchResult.matches.length === 0) {
    step.status = 'skipped';
    step.skipReason = 'No variables matched the rule condition';
    return step;
  }

  // Filter matches that would create circular dependencies or backwards aliases
  const validMatches = matchResult.matches.filter((match) => {
    // Check for circular dependency
    const wouldCycle = wouldCreateCycle(
      graph,
      match.sourceVariable.id,
      match.targetVariable.id
    );

    if (wouldCycle) {
      const sourcePath = getVariablePath(graph, match.sourceVariable);
      const targetPath = getVariablePath(graph, match.targetVariable);
      step.warnings.push(
        `Skipped ${sourcePath} → ${targetPath}: would create circular dependency`
      );
      return false;
    }

    // Check for backwards alias (primitives should never be aliased)
    const aliasValidation = validateAliasDirection(
      match.sourceCollectionType,
      match.targetCollectionType
    );

    if (!aliasValidation.valid) {
      const sourcePath = getVariablePath(graph, match.sourceVariable);
      const targetPath = getVariablePath(graph, match.targetVariable);
      step.warnings.push(
        `Skipped ${sourcePath} → ${targetPath}: ${aliasValidation.error}`
      );
      return false;
    }

    return true;
  });

  step.matchedVariables = validMatches;
  step.aliasCount = validMatches.reduce(
    (sum, match) => sum + match.modeMappings.length,
    0
  );

  if (validMatches.length === 0) {
    if (matchResult.matches.length > 0) {
      step.status = 'skipped';
      step.skipReason = 'All matches were filtered out (circular dependencies or invalid alias directions)';
    } else {
      step.status = 'skipped';
      step.skipReason = 'No variables matched the rule condition';
    }
  } else {
    step.status = 'matched';
  }

  return step;
}

/**
 * Evaluates multiple rules and returns a complete result
 * @param graph - Variable graph
 * @param rules - Array of rules to evaluate
 * @param mode - Evaluation mode (dry-run or apply)
 * @returns Complete evaluation result
 */
export function evaluateRules(
  graph: VariableGraph,
  rules: Rule[],
  mode: EvaluationMode = 'dry-run'
): EvaluationResult {
  const result = createEvaluationResult(mode);

  // Evaluate each rule
  for (const rule of rules) {
    try {
      const step = evaluateRule(graph, rule);
      result.steps.push(step);

      if (step.status === 'matched') {
        result.totalMatched += step.matchedVariables.length;
        result.totalAliases += step.aliasCount;
      }

      if (step.warnings.length > 0) {
        result.warnings.push(...step.warnings);
      }
    } catch (error) {
      const errorStep = createEvaluationStep(rule.id, rule.name, 'error');
      errorStep.error = error instanceof Error ? error.message : 'Unknown error';
      result.steps.push(errorStep);
      result.errors.push(`Rule ${rule.name}: ${errorStep.error}`);
    }
  }

  // Check if evaluation succeeded
  result.success = result.errors.length === 0 && result.steps.length > 0;

  return result;
}

// ============================================================================
// Alias Operation Generation
// ============================================================================

/**
 * Generates alias operations from evaluation result
 * Note: Operations are only generated from matched variables that have
 * already been validated for circular dependencies and backwards aliases
 * @param result - Evaluation result
 * @returns Array of alias operations to execute
 */
export function generateAliasOperations(
  result: EvaluationResult
): AliasOperation[] {
  const operations: AliasOperation[] = [];

  for (const step of result.steps) {
    if (step.status !== 'matched') {
      continue;
    }

    for (const match of step.matchedVariables) {
      // Note: Direction validation already performed in dry-run phase (line 76-88)
      // Collection types are immutable, so no need to re-validate here
      // Backend (code.ts) also validates direction as the final security boundary

      for (const modeMapping of match.modeMappings) {
        operations.push({
          sourceVariableId: match.sourceVariable.id,
          sourceVariableName: match.sourceVariable.name,
          sourceModeId: modeMapping.sourceModeId,
          sourceModeName: modeMapping.sourceModeName,
          targetVariableId: match.targetVariable.id,
          targetVariableName: match.targetVariable.name,
          targetModeId: modeMapping.targetModeId,
          targetModeName: modeMapping.targetModeName,
          ruleId: step.ruleId,
          ruleName: step.ruleName,
        });
      }
    }
  }

  return operations;
}

// ============================================================================
// Result Formatting
// ============================================================================

/**
 * Formats evaluation result as a human-readable summary
 */
export function formatEvaluationSummary(result: EvaluationResult): string {
  const lines: string[] = [];

  lines.push(`=== Rule Evaluation Summary (${result.mode.toUpperCase()}) ===`);
  lines.push('');

  if (result.errors.length > 0) {
    lines.push('ERRORS:');
    result.errors.forEach((error) => lines.push(`  - ${error}`));
    lines.push('');
  }

  lines.push(`Total Rules Evaluated: ${result.steps.length}`);
  lines.push(`Variables Matched: ${result.totalMatched}`);
  lines.push(`Aliases to Create: ${result.totalAliases}`);
  lines.push('');

  lines.push('Step-by-Step Results:');
  result.steps.forEach((step, index) => {
    lines.push(`\n${index + 1}. ${step.ruleName} (${step.status})`);

    if (step.status === 'matched') {
      lines.push(`   Matched ${step.matchedVariables.length} variable(s)`);
      lines.push(`   Will create ${step.aliasCount} alias(es)`);

      step.matchedVariables.forEach((match) => {
        lines.push(`   - ${match.sourceVariable.name} → ${match.targetVariable.name}`);
        match.modeMappings.forEach((mapping) => {
          lines.push(
            `     Mode: ${mapping.sourceModeName} → ${mapping.targetModeName}`
          );
        });
      });
    } else if (step.status === 'skipped') {
      lines.push(`   Reason: ${step.skipReason}`);
    } else if (step.status === 'error') {
      lines.push(`   Error: ${step.error}`);
    }

    if (step.warnings.length > 0) {
      lines.push('   Warnings:');
      step.warnings.forEach((warning) => lines.push(`     - ${warning}`));
    }
  });

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('WARNINGS:');
    result.warnings.forEach((warning) => lines.push(`  - ${warning}`));
  }

  lines.push('');
  lines.push(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);

  return lines.join('\n');
}

/**
 * Formats evaluation result as structured data for UI display
 */
export interface FormattedStep {
  ruleId: string;
  ruleName: string;
  status: 'matched' | 'skipped' | 'error';
  matchCount: number;
  aliasCount: number;
  details: string[];
  warnings: string[];
  error?: string;
}

export function formatEvaluationResult(result: EvaluationResult): {
  summary: {
    mode: string;
    totalRules: number;
    totalMatched: number;
    totalAliases: number;
    success: boolean;
  };
  steps: FormattedStep[];
  errors: string[];
  warnings: string[];
} {
  return {
    summary: {
      mode: result.mode,
      totalRules: result.steps.length,
      totalMatched: result.totalMatched,
      totalAliases: result.totalAliases,
      success: result.success,
    },
    steps: result.steps.map((step) => ({
      ruleId: step.ruleId,
      ruleName: step.ruleName,
      status: step.status,
      matchCount: step.matchedVariables.length,
      aliasCount: step.aliasCount,
      details: step.matchedVariables.map(
        (match) =>
          `${match.sourceVariable.name} → ${match.targetVariable.name} (${match.modeMappings.length} mode(s))`
      ),
      warnings: step.warnings,
      error: step.error,
    })),
    errors: result.errors,
    warnings: result.warnings,
  };
}
