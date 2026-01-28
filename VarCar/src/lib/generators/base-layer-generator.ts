/**
 * Base Layer Generator
 * Abstract class for all layer-specific generators
 */

import { LayerDefinition } from '@/models/layer-mapping';
import { VariableRegistry, VariableEntry } from '@/lib/variable-registry';
import { Brand } from '@/models/brand';

export abstract class BaseLayerGenerator {
  constructor(
    protected layer: LayerDefinition,
    protected registry: VariableRegistry,
    protected brand: Brand
  ) {}
  
  /**
   * Generate all variables for this layer
   * Must be implemented by each concrete generator
   */
  abstract generate(): VariableEntry[];
  
  /**
   * Generate a unique variable ID
   */
  protected generateVariableId(): string {
    return this.registry.generateId();
  }
  
  /**
   * Resolve an alias target by name
   * Returns the variable entry if found
   */
  protected resolveAliasTarget(sourceName: string, sourceCollectionId?: string): VariableEntry | undefined {
    return this.registry.findByName(sourceName, sourceCollectionId);
  }
  
  /**
   * Apply naming pattern with parameter substitution
   * Example: "{paletteName}/{step}/{scale}" with {paletteName: "Indigo", step: 600, scale: "Bold"}
   * Returns: "Indigo/600/Bold"
   */
  protected applyNamingPattern(params: Record<string, string | number>): string {
    let pattern = this.layer.namingPattern;
    
    for (const [key, value] of Object.entries(params)) {
      pattern = pattern.replace(`{${key}}`, String(value));
    }
    
    return pattern;
  }
  
  /**
   * Log generation progress
   */
  protected log(message: string): void {
    console.log(`[${this.layer.displayName}] ${message}`);
  }
  
  /**
   * Log warning
   */
  protected warn(message: string): void {
    console.warn(`[${this.layer.displayName}] WARNING: ${message}`);
  }
  
  /**
   * Log error
   */
  protected error(message: string): void {
    console.error(`[${this.layer.displayName}] ERROR: ${message}`);
  }
}
