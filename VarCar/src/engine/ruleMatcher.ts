/**
 * Rule matcher - finds variables that match rule conditions.
 */

import {
  VariableGraph,
  Variable,
  Collection,
  CollectionType,
  Group,
  getVariablesInGroup,
  getGroupsInCollection,
  getCollectionForGroup,
  getGroupForVariable,
} from '../models';
import { Rule, parseAliasPath } from '../models/rules';
import { VariableMatch } from './types';

// ============================================================================
// Source Variable Matching
// ============================================================================

/**
 * Finds all variables that match the rule's "when" condition
 * @param graph - Variable graph to search
 * @param rule - Rule with conditions
 * @returns Array of variables that match the condition
 */
export function findMatchingVariables(
  graph: VariableGraph,
  rule: Rule
): Variable[] {
  const matched: Variable[] = [];

  // Get all variables
  const allVariables = Array.from(graph.variables.values());

  for (const variable of allVariables) {
    if (matchesCondition(graph, variable, rule)) {
      matched.push(variable);
    }
  }

  return matched;
}

/**
 * Checks if a variable matches the rule condition
 */
function matchesCondition(
  graph: VariableGraph,
  variable: Variable,
  rule: Rule
): boolean {
  const { when } = rule;

  // Get variable's group and collection
  const group = getGroupForVariable(graph, variable.id);
  if (!group) return false;

  const collection = getCollectionForGroup(graph, group.id);
  if (!collection) return false;

  // Check collection condition
  if (when.collection) {
    if (collection.name !== when.collection) {
      return false;
    }
  }

  // Check group condition
  if (when.group) {
    if (group.name !== when.group) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// Target Variable Resolution
// ============================================================================

/**
 * Resolves target variables from the "then.aliasTo" path
 * @param graph - Variable graph to search
 * @param rule - Rule with target path
 * @returns Array of target variables, or null if path is invalid
 */
export function resolveTargetVariables(
  graph: VariableGraph,
  rule: Rule
): Variable[] | null {
  const { aliasTo } = rule.then;

  // Parse the alias path
  const parsed = parseAliasPath(aliasTo);
  if (!parsed) {
    return null;
  }

  const { collection: collectionName, group: groupName, variable: variableName } = parsed;

  // Find the collection
  const collection = Array.from(graph.collections.values()).find(
    (c) => c.name === collectionName
  );
  if (!collection) {
    return null;
  }

  // Find the group
  const groups = getGroupsInCollection(graph, collection.id);
  const group = groups.find((g) => g.name === groupName);
  if (!group) {
    return null;
  }

  // If a specific variable is specified, find it
  if (variableName) {
    const variables = getVariablesInGroup(graph, group.id);
    const targetVariable = variables.find((v) => v.name === variableName);
    return targetVariable ? [targetVariable] : null;
  }

  // Otherwise, return all variables in the group
  return getVariablesInGroup(graph, group.id);
}

// ============================================================================
// Mode Mapping
// ============================================================================

/**
 * Maps modes between source and target variables
 * Strategy: Match by mode name first, then use first available mode
 */
export function mapModes(
  sourceVariable: Variable,
  targetVariable: Variable
): Array<{
  sourceModeId: string;
  sourceModeName: string;
  targetModeId: string;
  targetModeName: string;
}> {
  const mappings: Array<{
    sourceModeId: string;
    sourceModeName: string;
    targetModeId: string;
    targetModeName: string;
  }> = [];

  // For each source mode, find a matching target mode
  for (const sourceMode of sourceVariable.modes) {
    // Try to find a target mode with the same name
    let targetMode = targetVariable.modes.find(
      (tm) => tm.name === sourceMode.name
    );

    // If no matching name, use the first available mode
    if (!targetMode && targetVariable.modes.length > 0) {
      targetMode = targetVariable.modes[0];
    }

    if (targetMode) {
      mappings.push({
        sourceModeId: sourceMode.id,
        sourceModeName: sourceMode.name,
        targetModeId: targetMode.id,
        targetModeName: targetMode.name,
      });
    }
  }

  return mappings;
}

// ============================================================================
// Variable Matching
// ============================================================================

/**
 * Creates variable matches by pairing source variables with target variables
 * @param graph - Variable graph
 * @param rule - Rule to apply
 * @returns Array of variable matches, or error message if matching fails
 */
export function matchVariables(
  graph: VariableGraph,
  rule: Rule
): { matches: VariableMatch[]; error?: string } {
  // Find source variables
  const sourceVariables = findMatchingVariables(graph, rule);

  if (sourceVariables.length === 0) {
    return {
      matches: [],
      error: 'No variables match the rule condition',
    };
  }

  // Resolve target variables
  const targetVariables = resolveTargetVariables(graph, rule);

  if (!targetVariables) {
    return {
      matches: [],
      error: `Invalid target path: ${rule.then.aliasTo}`,
    };
  }

  if (targetVariables.length === 0) {
    return {
      matches: [],
      error: `No target variables found at path: ${rule.then.aliasTo}`,
    };
  }

  // Create matches
  const matches: VariableMatch[] = [];

  // Strategy: match each source variable with a target variable
  // If there's one target, all sources point to it
  // If there are multiple targets, match by name (or use first target as fallback)
  for (const sourceVar of sourceVariables) {
    let targetVar: Variable | undefined;

    if (targetVariables.length === 1) {
      // Single target: all sources alias to this one
      targetVar = targetVariables[0];
    } else {
      // Multiple targets: try to match by name
      targetVar = targetVariables.find((tv) => tv.name === sourceVar.name);

      // Fallback: use first target
      if (!targetVar) {
        targetVar = targetVariables[0];
      }
    }

    if (targetVar) {
      const modeMappings = mapModes(sourceVar, targetVar);

      if (modeMappings.length > 0) {
        matches.push({
          sourceVariable: sourceVar,
          targetVariable: targetVar,
          sourceCollectionType: getVariableCollectionType(graph, sourceVar),
          targetCollectionType: getVariableCollectionType(graph, targetVar),
          modeMappings,
        });
      }
    }
  }

  return { matches };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Gets the collection type for a variable
 */
export function getVariableCollectionType(graph: VariableGraph, variable: Variable): CollectionType {
  const group = getGroupForVariable(graph, variable.id);
  const collection = group ? getCollectionForGroup(graph, group.id) : null;
  
  // Default to 'semantic' if collection type cannot be determined
  return collection?.type || 'semantic';
}

/**
 * Gets a human-readable path for a variable
 */
export function getVariablePath(graph: VariableGraph, variable: Variable): string {
  const group = getGroupForVariable(graph, variable.id);
  const collection = group ? getCollectionForGroup(graph, group.id) : null;

  if (collection && group) {
    return `${collection.name}/${group.name}/${variable.name}`;
  }

  return variable.name;
}
