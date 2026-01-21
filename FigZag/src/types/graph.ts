/**
 * Token Graph Model
 * 
 * Provides the root container for the entire token graph with helper methods
 * for traversal, queries, and graph operations.
 */

import {
  Collection,
  Group,
  Variable,
  Alias,
  VariablePath,
  VariableReference,
  Mode
} from './models';

// ============================================================================
// Token Graph
// ============================================================================

/**
 * TokenGraph is the root container for the entire design token system
 * It contains all collections, groups, variables, and their relationships
 */
export class TokenGraph {
  readonly collections: Collection[];
  readonly groups: Group[];
  readonly variables: Variable[];
  readonly aliases: Alias[];

  constructor(
    collections: Collection[] = [],
    groups: Group[] = [],
    variables: Variable[] = [],
    aliases: Alias[] = []
  ) {
    this.collections = collections;
    this.groups = groups;
    this.variables = variables;
    this.aliases = aliases;
  }

  // ============================================================================
  // Lookup Methods
  // ============================================================================

  /**
   * Find a collection by ID
   */
  getCollectionById(id: string): Collection | undefined {
    return this.collections.find(c => c.id === id);
  }

  /**
   * Find a collection by name
   */
  getCollectionByName(name: string): Collection | undefined {
    return this.collections.find(c => c.name === name);
  }

  /**
   * Find a group by ID
   */
  getGroupById(id: string): Group | undefined {
    return this.groups.find(g => g.id === id);
  }

  /**
   * Find a variable by ID
   */
  getVariableById(id: string): Variable | undefined {
    return this.variables.find(v => v.id === id);
  }

  /**
   * Find a variable by name within a specific collection
   */
  getVariableByName(name: string, collectionId: string): Variable | undefined {
    return this.variables.find(
      v => v.name === name && v.collectionId === collectionId
    );
  }

  // ============================================================================
  // Collection Queries
  // ============================================================================

  /**
   * Get all groups within a specific collection
   */
  getGroupsInCollection(collectionId: string): Group[] {
    return this.groups.filter(g => g.collectionId === collectionId);
  }

  /**
   * Get all variables within a specific collection
   */
  getVariablesInCollection(collectionId: string): Variable[] {
    return this.variables.filter(v => v.collectionId === collectionId);
  }

  /**
   * Get all variables within a specific group
   */
  getVariablesInGroup(groupId: string): Variable[] {
    return this.variables.filter(v => v.groupId === groupId);
  }

  // ============================================================================
  // Alias Queries
  // ============================================================================

  /**
   * Get all aliases where a variable is the source (from)
   */
  getAliasesFrom(variableId: string): Alias[] {
    return this.aliases.filter(a => a.fromVariableId === variableId);
  }

  /**
   * Get all aliases where a variable is the target (to)
   */
  getAliasesTo(variableId: string): Alias[] {
    return this.aliases.filter(a => a.toVariableId === variableId);
  }

  /**
   * Check if a variable has any aliases pointing to it
   */
  isAliasTarget(variableId: string): boolean {
    return this.getAliasesTo(variableId).length > 0;
  }

  /**
   * Check if a variable is aliased to another variable
   */
  isAliasSource(variableId: string): boolean {
    return this.getAliasesFrom(variableId).length > 0;
  }

  /**
   * Get all variables that a given variable depends on (direct dependencies)
   */
  getDirectDependencies(variableId: string): Variable[] {
    const variable = this.getVariableById(variableId);
    if (!variable) return [];

    const dependencyIds = new Set<string>();

    // Check each mode for alias references
    for (const mode of variable.modes) {
      if (mode.alias) {
        dependencyIds.add(mode.alias.variableId);
      }
    }

    return Array.from(dependencyIds)
      .map(id => this.getVariableById(id))
      .filter((v): v is Variable => v !== undefined);
  }

  /**
   * Get all variables that depend on a given variable (direct dependents)
   */
  getDirectDependents(variableId: string): Variable[] {
    const dependentIds = new Set<string>();

    // Find all variables that have this variable as an alias
    for (const variable of this.variables) {
      for (const mode of variable.modes) {
        if (mode.alias?.variableId === variableId) {
          dependentIds.add(variable.id);
          break;
        }
      }
    }

    return Array.from(dependentIds)
      .map(id => this.getVariableById(id))
      .filter((v): v is Variable => v !== undefined);
  }

  /**
   * Get the full dependency chain for a variable (recursive)
   * Returns all variables in the dependency tree
   */
  getAllDependencies(variableId: string, visited = new Set<string>()): Variable[] {
    if (visited.has(variableId)) {
      return []; // Circular dependency detected
    }

    visited.add(variableId);
    const directDeps = this.getDirectDependencies(variableId);
    const allDeps = [...directDeps];

    for (const dep of directDeps) {
      const nestedDeps = this.getAllDependencies(dep.id, visited);
      allDeps.push(...nestedDeps);
    }

    return allDeps;
  }

  // ============================================================================
  // Validation Methods
  // ============================================================================

  /**
   * Check for circular dependencies in the graph
   * Returns an array of variable IDs that are part of circular dependencies
   */
  findCircularDependencies(): string[] {
    const circularIds = new Set<string>();

    for (const variable of this.variables) {
      const visited = new Set<string>();
      if (this.hasCircularDependency(variable.id, visited)) {
        circularIds.add(variable.id);
      }
    }

    return Array.from(circularIds);
  }

  /**
   * Check if a specific variable has a circular dependency
   */
  private hasCircularDependency(
    variableId: string,
    visited: Set<string>,
    path: Set<string> = new Set()
  ): boolean {
    if (path.has(variableId)) {
      return true; // Circular dependency found
    }

    if (visited.has(variableId)) {
      return false; // Already checked this path
    }

    visited.add(variableId);
    path.add(variableId);

    const deps = this.getDirectDependencies(variableId);
    for (const dep of deps) {
      if (this.hasCircularDependency(dep.id, visited, path)) {
        return true;
      }
    }

    path.delete(variableId);
    return false;
  }

  /**
   * Find all broken aliases (aliases pointing to non-existent variables)
   */
  findBrokenAliases(): Alias[] {
    return this.aliases.filter(alias => {
      const fromExists = this.getVariableById(alias.fromVariableId) !== undefined;
      const toExists = this.getVariableById(alias.toVariableId) !== undefined;
      return !fromExists || !toExists;
    });
  }

  /**
   * Find all orphaned variables (variables not in any collection or group)
   */
  findOrphanedVariables(): Variable[] {
    return this.variables.filter(variable => {
      const hasCollection = this.getCollectionById(variable.collectionId) !== undefined;
      const hasGroup = this.getGroupById(variable.groupId) !== undefined;
      return !hasCollection || !hasGroup;
    });
  }

  // ============================================================================
  // Path Resolution
  // ============================================================================

  /**
   * Generate a human-readable path for a variable
   * Format: "collection/group/variable"
   */
  getVariablePath(variableId: string): VariablePath | undefined {
    const variable = this.getVariableById(variableId);
    if (!variable) return undefined;

    const group = this.getGroupById(variable.groupId);
    const collection = this.getCollectionById(variable.collectionId);

    if (!group || !collection) return undefined;

    return `${collection.name}/${group.name}/${variable.name}`;
  }

  /**
   * Find a variable by its path
   */
  getVariableByPath(path: VariablePath): Variable | undefined {
    const parts = path.split('/');
    if (parts.length !== 3) return undefined;

    const [collectionName, groupName, variableName] = parts;

    const collection = this.getCollectionByName(collectionName);
    if (!collection) return undefined;

    const group = this.groups.find(
      g => g.name === groupName && g.collectionId === collection.id
    );
    if (!group) return undefined;

    return this.variables.find(
      v => v.name === variableName && v.groupId === group.id
    );
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get summary statistics about the graph
   */
  getStatistics() {
    return {
      totalCollections: this.collections.length,
      totalGroups: this.groups.length,
      totalVariables: this.variables.length,
      totalAliases: this.aliases.length,
      brokenAliases: this.findBrokenAliases().length,
      circularDependencies: this.findCircularDependencies().length,
      orphanedVariables: this.findOrphanedVariables().length,
    };
  }

  // ============================================================================
  // Graph Manipulation
  // ============================================================================

  /**
   * Create a new graph with additional entities
   */
  withEntities(
    collections: Collection[] = [],
    groups: Group[] = [],
    variables: Variable[] = [],
    aliases: Alias[] = []
  ): TokenGraph {
    return new TokenGraph(
      [...this.collections, ...collections],
      [...this.groups, ...groups],
      [...this.variables, ...variables],
      [...this.aliases, ...aliases]
    );
  }

  /**
   * Create a filtered subgraph containing only specified collections
   */
  filterByCollections(collectionIds: string[]): TokenGraph {
    const collectionSet = new Set(collectionIds);
    
    const filteredCollections = this.collections.filter(c => 
      collectionSet.has(c.id)
    );
    
    const filteredGroups = this.groups.filter(g => 
      collectionSet.has(g.collectionId)
    );
    
    const filteredVariables = this.variables.filter(v => 
      collectionSet.has(v.collectionId)
    );
    
    const variableIdSet = new Set(filteredVariables.map(v => v.id));
    const filteredAliases = this.aliases.filter(a => 
      variableIdSet.has(a.fromVariableId) && variableIdSet.has(a.toVariableId)
    );

    return new TokenGraph(
      filteredCollections,
      filteredGroups,
      filteredVariables,
      filteredAliases
    );
  }

  /**
   * Convert the graph to a plain JSON object
   */
  toJSON() {
    return {
      collections: this.collections,
      groups: this.groups,
      variables: this.variables,
      aliases: this.aliases,
    };
  }

  /**
   * Create a TokenGraph from a plain JSON object
   */
  static fromJSON(json: {
    collections: Collection[];
    groups: Group[];
    variables: Variable[];
    aliases: Alias[];
  }): TokenGraph {
    return new TokenGraph(
      json.collections,
      json.groups,
      json.variables,
      json.aliases
    );
  }
}
