/**
 * Graph container and utility functions for the variable graph model.
 */

import {
  Collection,
  Group,
  Variable,
  Alias,
  isModeAlias,
} from './types';

// ============================================================================
// Graph Container
// ============================================================================

/**
 * VariableGraph is the main container for all design token entities.
 * Uses Maps for O(1) lookup performance on large token sets.
 * 
 * Index maps provide O(1) lookups for common queries:
 * - groupsByCollection: collectionId → groups[]
 * - variablesByGroup: groupId → variables[]
 * - variablesByCollection: collectionId → variables[]
 * - collectionByName: collectionName → Collection (for name-based lookups)
 * - groupByName: groupName → Group (scoped to collection, key format: "collectionId:groupName")
 * - variableByName: variableName → Variable (scoped to group, key format: "groupId:variableName")
 */
export interface VariableGraph {
  collections: Map<string, Collection>;
  groups: Map<string, Group>;
  variables: Map<string, Variable>;
  aliases: Alias[];
  // Index maps for O(1) lookups
  groupsByCollection: Map<string, Group[]>;  // collectionId → groups
  variablesByGroup: Map<string, Variable[]>;  // groupId → variables
  variablesByCollection: Map<string, Variable[]>;  // collectionId → variables
  collectionByName: Map<string, Collection>;  // collectionName → Collection
  groupByName: Map<string, Group>;  // "collectionId:groupName" → Group
  variableByName: Map<string, Variable>;  // "groupId:variableName" → Variable
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates an empty variable graph with initialized index maps
 */
export function createGraph(): VariableGraph {
  return {
    collections: new Map(),
    groups: new Map(),
    variables: new Map(),
    aliases: [],
    // Initialize index maps
    groupsByCollection: new Map(),
    variablesByGroup: new Map(),
    variablesByCollection: new Map(),
    collectionByName: new Map(),
    groupByName: new Map(),
    variableByName: new Map(),
  };
}

// ============================================================================
// Builder Methods
// ============================================================================

/**
 * Adds a collection to the graph and updates index maps
 */
export function addCollection(
  graph: VariableGraph,
  collection: Collection
): VariableGraph {
  graph.collections.set(collection.id, collection);
  
  // Update collectionByName index
  graph.collectionByName.set(collection.name, collection);
  
  // Initialize groupsByCollection and variablesByCollection if not exists
  if (!graph.groupsByCollection.has(collection.id)) {
    graph.groupsByCollection.set(collection.id, []);
  }
  if (!graph.variablesByCollection.has(collection.id)) {
    graph.variablesByCollection.set(collection.id, []);
  }
  
  return graph;
}

/**
 * Adds a group to the graph and updates index maps
 */
export function addGroup(
  graph: VariableGraph,
  group: Group
): VariableGraph {
  graph.groups.set(group.id, group);
  
  // Update groupsByCollection index
  if (!graph.groupsByCollection.has(group.collectionId)) {
    graph.groupsByCollection.set(group.collectionId, []);
  }
  const groupsInCollection = graph.groupsByCollection.get(group.collectionId)!;
  if (!groupsInCollection.find(g => g.id === group.id)) {
    groupsInCollection.push(group);
  }
  
  // Update groupByName index (key format: "collectionId:groupName")
  const collection = graph.collections.get(group.collectionId);
  if (collection) {
    const nameKey = `${group.collectionId}:${group.name}`;
    graph.groupByName.set(nameKey, group);
  }
  
  // Initialize variablesByGroup if not exists
  if (!graph.variablesByGroup.has(group.id)) {
    graph.variablesByGroup.set(group.id, []);
  }
  
  return graph;
}

/**
 * Adds a variable to the graph and updates index maps
 */
export function addVariable(
  graph: VariableGraph,
  variable: Variable
): VariableGraph {
  graph.variables.set(variable.id, variable);
  
  // Update variablesByGroup index
  if (!graph.variablesByGroup.has(variable.groupId)) {
    graph.variablesByGroup.set(variable.groupId, []);
  }
  const variablesInGroup = graph.variablesByGroup.get(variable.groupId)!;
  if (!variablesInGroup.find(v => v.id === variable.id)) {
    variablesInGroup.push(variable);
  }
  
  // Update variablesByCollection index
  const group = graph.groups.get(variable.groupId);
  if (group) {
    const collectionId = group.collectionId;
    if (!graph.variablesByCollection.has(collectionId)) {
      graph.variablesByCollection.set(collectionId, []);
    }
    const variablesInCollection = graph.variablesByCollection.get(collectionId)!;
    if (!variablesInCollection.find(v => v.id === variable.id)) {
      variablesInCollection.push(variable);
    }
    
    // Update variableByName index (key format: "groupId:variableName")
    const nameKey = `${variable.groupId}:${variable.name}`;
    graph.variableByName.set(nameKey, variable);
  }
  
  // Extract aliases from the variable's modes and add to graph
  variable.modes.forEach((mode) => {
    if (isModeAlias(mode.value)) {
      const aliasValue = mode.value;
      const existingAlias = graph.aliases.find(
        (a) =>
          a.fromVariableId === variable.id &&
          a.toVariableId === aliasValue.variableId
      );

      if (existingAlias) {
        // Update existing alias with new mode mapping
        existingAlias.modeMap[mode.id] = aliasValue.modeId;
      } else {
        // Create new alias
        graph.aliases.push({
          fromVariableId: variable.id,
          toVariableId: aliasValue.variableId,
          modeMap: {
            [mode.id]: aliasValue.modeId,
          },
        });
      }
    }
  });

  return graph;
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Finds a variable by its path (collection/group/name)
 * Returns null if not found
 * Uses index maps for O(1) lookups instead of O(n) searches
 */
export function getVariableByPath(
  graph: VariableGraph,
  collectionName: string,
  groupName: string,
  variableName: string
): Variable | null {
  // Find collection by name using index
  const collection = graph.collectionByName.get(collectionName);
  if (!collection) return null;

  // Find group by name and collection using index
  const groupNameKey = `${collection.id}:${groupName}`;
  const group = graph.groupByName.get(groupNameKey);
  if (!group) return null;

  // Find variable by name and group using index
  const variableNameKey = `${group.id}:${variableName}`;
  const variable = graph.variableByName.get(variableNameKey);

  return variable || null;
}

/**
 * Gets all aliases that involve a specific variable
 * (either as source or target)
 */
export function getAliasesForVariable(
  graph: VariableGraph,
  variableId: string
): Alias[] {
  return graph.aliases.filter(
    (alias) =>
      alias.fromVariableId === variableId ||
      alias.toVariableId === variableId
  );
}

/**
 * Gets all variables in a specific group
 * Uses index map for O(1) lookup instead of O(n) filter
 */
export function getVariablesInGroup(
  graph: VariableGraph,
  groupId: string
): Variable[] {
  // Use index map if available, fallback to filter for backward compatibility
  if (graph.variablesByGroup.has(groupId)) {
    return graph.variablesByGroup.get(groupId)!;
  }
  // Fallback for graphs without index (shouldn't happen, but safe)
  return Array.from(graph.variables.values()).filter(
    (v) => v.groupId === groupId
  );
}

/**
 * Gets all groups in a specific collection
 * Uses index map for O(1) lookup instead of O(n) filter
 */
export function getGroupsInCollection(
  graph: VariableGraph,
  collectionId: string
): Group[] {
  // Use index map if available, fallback to filter for backward compatibility
  if (graph.groupsByCollection.has(collectionId)) {
    return graph.groupsByCollection.get(collectionId)!;
  }
  // Fallback for graphs without index (shouldn't happen, but safe)
  return Array.from(graph.groups.values()).filter(
    (g) => g.collectionId === collectionId
  );
}

/**
 * Gets the collection that contains a specific group
 */
export function getCollectionForGroup(
  graph: VariableGraph,
  groupId: string
): Collection | null {
  const group = graph.groups.get(groupId);
  if (!group) return null;
  return graph.collections.get(group.collectionId) || null;
}

/**
 * Gets the group that contains a specific variable
 */
export function getGroupForVariable(
  graph: VariableGraph,
  variableId: string
): Group | null {
  const variable = graph.variables.get(variableId);
  if (!variable) return null;
  return graph.groups.get(variable.groupId) || null;
}

// ============================================================================
// Graph Statistics
// ============================================================================

/**
 * Returns basic statistics about the graph
 */
export function getGraphStats(graph: VariableGraph): {
  collectionCount: number;
  groupCount: number;
  variableCount: number;
  aliasCount: number;
} {
  return {
    collectionCount: graph.collections.size,
    groupCount: graph.groups.size,
    variableCount: graph.variables.size,
    aliasCount: graph.aliases.length,
  };
}

// ============================================================================
// Graph Validation
// ============================================================================

/**
 * Validation result with errors and warnings
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates the graph for structural integrity
 * Checks for orphaned nodes, broken references, etc.
 */
export function validateGraph(graph: VariableGraph): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for orphaned groups (groups without a valid collection)
  graph.groups.forEach((group) => {
    if (!graph.collections.has(group.collectionId)) {
      errors.push(
        `Group "${group.name}" (${group.id}) references non-existent collection ${group.collectionId}`
      );
    }
  });

  // Check for orphaned variables (variables without a valid group)
  graph.variables.forEach((variable) => {
    if (!graph.groups.has(variable.groupId)) {
      errors.push(
        `Variable "${variable.name}" (${variable.id}) references non-existent group ${variable.groupId}`
      );
    }
  });

  // Check for broken aliases (aliases referencing non-existent variables)
  graph.aliases.forEach((alias) => {
    if (!graph.variables.has(alias.fromVariableId)) {
      errors.push(
        `Alias references non-existent source variable ${alias.fromVariableId}`
      );
    }
    if (!graph.variables.has(alias.toVariableId)) {
      errors.push(
        `Alias references non-existent target variable ${alias.toVariableId}`
      );
    }
  });

  // Check for variables with no modes
  graph.variables.forEach((variable) => {
    if (variable.modes.length === 0) {
      warnings.push(
        `Variable "${variable.name}" (${variable.id}) has no modes defined`
      );
    }
  });

  // Check for circular dependencies (simple check - variable aliasing itself)
  graph.aliases.forEach((alias) => {
    if (alias.fromVariableId === alias.toVariableId) {
      errors.push(
        `Circular alias detected: variable ${alias.fromVariableId} aliases itself`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Detects circular dependencies in the alias graph
 * Returns an array of variable IDs that form cycles
 */
export function detectCircularDependencies(
  graph: VariableGraph
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(variableId: string, path: string[]): void {
    visited.add(variableId);
    recursionStack.add(variableId);
    path.push(variableId);

    // Get all variables this variable aliases
    const aliases = graph.aliases.filter(
      (a) => a.fromVariableId === variableId
    );

    for (const alias of aliases) {
      const targetId = alias.toVariableId;

      if (!visited.has(targetId)) {
        dfs(targetId, [...path]);
      } else if (recursionStack.has(targetId)) {
        // Found a cycle
        const cycleStart = path.indexOf(targetId);
        cycles.push([...path.slice(cycleStart), targetId]);
      }
    }

    recursionStack.delete(variableId);
  }

  // Check each variable
  graph.variables.forEach((variable) => {
    if (!visited.has(variable.id)) {
      dfs(variable.id, []);
    }
  });

  return cycles;
}

/**
 * Checks if adding a new alias would create a circular dependency
 * @param graph - Current graph state
 * @param fromVariableId - Source variable ID
 * @param toVariableId - Target variable ID
 * @returns true if adding this alias would create a cycle, false otherwise
 */
export function wouldCreateCycle(
  graph: VariableGraph,
  fromVariableId: string,
  toVariableId: string
): boolean {
  // Self-alias check
  if (fromVariableId === toVariableId) {
    return true;
  }
  
  // Check if target variable eventually aliases back to source
  // Use DFS to traverse alias chain starting from toVariableId
  const visited = new Set<string>();
  
  function canReachTarget(currentId: string, targetId: string): boolean {
    if (currentId === targetId) return true;
    if (visited.has(currentId)) return false;
    
    visited.add(currentId);
    
    // Get all variables this variable aliases to
    const aliases = graph.aliases.filter(a => a.fromVariableId === currentId);
    
    for (const alias of aliases) {
      if (canReachTarget(alias.toVariableId, targetId)) {
        return true;
      }
    }
    
    return false;
  }
  
  return canReachTarget(toVariableId, fromVariableId);
}
