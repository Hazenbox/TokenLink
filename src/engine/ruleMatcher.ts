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
 * Uses indexed lookups for O(m) complexity instead of O(n) where m = matching variables
 * @param graph - Variable graph to search
 * @param rule - Rule with conditions
 * @returns Array of variables that match the condition
 */
export function findMatchingVariables(
  graph: VariableGraph,
  rule: Rule
): Variable[] {
  const { when } = rule;
  const matched: Variable[] = [];

  // Optimize: If collection is specified, use index to get only variables in that collection
  if (when.collection) {
    // Find collection by name using index
    const collection = graph.collectionByName.get(when.collection);
    if (!collection) {
      return []; // Collection doesn't exist
    }

    // Get variables in collection using index (O(1) lookup)
    const variablesInCollection = graph.variablesByCollection.get(collection.id) || [];

    // If group is also specified, filter by group
    if (when.group) {
      // Find group by name using index
      const groupNameKey = `${collection.id}:${when.group}`;
      const group = graph.groupByName.get(groupNameKey);
      if (!group) {
        return []; // Group doesn't exist
      }

      // Get variables in group using index (O(1) lookup)
      const variablesInGroup = graph.variablesByGroup.get(group.id) || [];
      matched.push(...variablesInGroup);
    } else {
      // No group filter, return all variables in collection
      matched.push(...variablesInCollection);
    }
  } else if (when.group) {
    // Only group specified (no collection) - need to search all collections
    // This is less common, so we iterate collections
    for (const collection of graph.collections.values()) {
      const groupNameKey = `${collection.id}:${when.group}`;
      const group = graph.groupByName.get(groupNameKey);
      if (group) {
        const variablesInGroup = graph.variablesByGroup.get(group.id) || [];
        matched.push(...variablesInGroup);
      }
    }
  } else {
    // No filters - return all variables (fallback to original behavior)
    matched.push(...Array.from(graph.variables.values()));
  }

  return matched;
}

// ============================================================================
// Target Variable Resolution
// ============================================================================

/**
 * Resolves target variables from the "then.aliasTo" path
 * Uses indexed lookups for O(1) complexity instead of O(n) searches
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

  // Find the collection using index (O(1) lookup)
  const collection = graph.collectionByName.get(collectionName);
  if (!collection) {
    return null;
  }

  // Find the group using index (O(1) lookup)
  const groupNameKey = `${collection.id}:${groupName}`;
  const group = graph.groupByName.get(groupNameKey);
  if (!group) {
    return null;
  }

  // If a specific variable is specified, find it using index (O(1) lookup)
  if (variableName) {
    const variableNameKey = `${group.id}:${variableName}`;
    const targetVariable = graph.variableByName.get(variableNameKey);
    return targetVariable ? [targetVariable] : null;
  }

  // Otherwise, return all variables in the group using index (O(1) lookup)
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
