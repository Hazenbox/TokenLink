/**
 * Variable Registry
 * Tracks all generated variables and their relationships across layers
 */

import { Step } from '@/lib/colors/color-utils';

export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface VariableEntry {
  id: string;  // Generated ID for this variable
  name: string;
  collectionId: string;
  collectionName: string;
  layer: number;
  modeId: string;
  modeName: string;
  value?: RGB;  // Direct RGB value (Layer 0 only)
  aliasToId?: string;    // Reference to another variable ID
  aliasToName?: string;  // Reference to another variable name (for lookup)
  metadata: {
    step?: Step;
    scale?: string;
    appearance?: string;
    state?: string;
    context?: string;
    emphasis?: string;
    level?: string;
  };
}

export class VariableRegistry {
  private variables = new Map<string, VariableEntry>();
  private variablesByCollection = new Map<string, VariableEntry[]>();
  private variablesByName = new Map<string, VariableEntry>();
  private variablesByLayer = new Map<number, VariableEntry[]>();
  private idCounter = 0;
  
  /**
   * Register a variable entry
   */
  register(entry: VariableEntry): void {
    this.variables.set(entry.id, entry);
    
    // Index by collection
    if (!this.variablesByCollection.has(entry.collectionId)) {
      this.variablesByCollection.set(entry.collectionId, []);
    }
    this.variablesByCollection.get(entry.collectionId)!.push(entry);
    
    // Index by name (with collection context for uniqueness)
    const nameKey = `${entry.collectionId}:${entry.name}`;
    this.variablesByName.set(nameKey, entry);
    
    // Index by layer
    if (!this.variablesByLayer.has(entry.layer)) {
      this.variablesByLayer.set(entry.layer, []);
    }
    this.variablesByLayer.get(entry.layer)!.push(entry);
  }
  
  /**
   * Find a variable by name (optionally within a specific collection)
   */
  findByName(name: string, collectionId?: string): VariableEntry | undefined {
    if (collectionId) {
      const nameKey = `${collectionId}:${name}`;
      return this.variablesByName.get(nameKey);
    }
    
    // Search all collections
    for (const [key, variable] of this.variablesByName.entries()) {
      if (key.endsWith(`:${name}`)) {
        return variable;
      }
    }
    
    return undefined;
  }
  
  /**
   * Find all variables in a specific layer
   */
  findByLayer(layer: number): VariableEntry[] {
    return this.variablesByLayer.get(layer) || [];
  }
  
  /**
   * Find all variables in a specific collection
   */
  findByCollection(collectionId: string): VariableEntry[] {
    return this.variablesByCollection.get(collectionId) || [];
  }
  
  /**
   * Get the alias chain for a variable (traces back to primitives)
   */
  getAliasChain(variableId: string): VariableEntry[] {
    const chain: VariableEntry[] = [];
    let current = this.variables.get(variableId);
    
    while (current) {
      chain.push(current);
      if (!current.aliasToId) break;
      current = this.variables.get(current.aliasToId);
    }
    
    return chain;
  }
  
  /**
   * Generate a unique variable ID
   */
  generateId(): string {
    return `var_${Date.now()}_${this.idCounter++}`;
  }
  
  /**
   * Get all variables
   */
  getAllVariables(): VariableEntry[] {
    return Array.from(this.variables.values());
  }
  
  /**
   * Get variables grouped by collection
   */
  getVariablesByCollection(): Map<string, VariableEntry[]> {
    return new Map(this.variablesByCollection);
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    totalVariables: number;
    variablesByLayer: Record<number, number>;
    variablesByCollection: Record<string, number>;
    maxAliasDepth: number;
  } {
    const variablesByLayer: Record<number, number> = {};
    const variablesByCollection: Record<string, number> = {};
    let maxAliasDepth = 0;
    
    for (const variable of this.variables.values()) {
      variablesByLayer[variable.layer] = (variablesByLayer[variable.layer] || 0) + 1;
      variablesByCollection[variable.collectionName] = (variablesByCollection[variable.collectionName] || 0) + 1;
      
      const chain = this.getAliasChain(variable.id);
      maxAliasDepth = Math.max(maxAliasDepth, chain.length);
    }
    
    return {
      totalVariables: this.variables.size,
      variablesByLayer,
      variablesByCollection,
      maxAliasDepth
    };
  }
  
  /**
   * Clear all variables (for testing)
   */
  clear(): void {
    this.variables.clear();
    this.variablesByCollection.clear();
    this.variablesByName.clear();
    this.variablesByLayer.clear();
    this.idCounter = 0;
  }
}
