/**
 * Core Data Models for FigZag Token Graph
 * 
 * These types represent the canonical internal data model for Figma Variables,
 * independent of the Figma UI. They form the foundation of the token graph system.
 */

// ============================================================================
// Color Types (matching Figma API)
// ============================================================================

export interface RGB {
  r: number; // 0-1
  g: number; // 0-1
  b: number; // 0-1
}

export interface RGBA extends RGB {
  a: number; // 0-1
}

// ============================================================================
// Collection Types
// ============================================================================

/**
 * Types of variable collections in the design system
 */
export type CollectionType = 'primitive' | 'semantic' | 'interaction' | 'theme';

/**
 * Collection represents a Figma Variable Collection
 * Collections group related variables together (e.g., all primitives, all semantic tokens)
 */
export interface Collection {
  readonly id: string;
  readonly name: string;
  readonly type: CollectionType;
  readonly modes: string[]; // Mode IDs available in this collection
}

// ============================================================================
// Group Types
// ============================================================================

/**
 * Group represents a nested group within a collection
 * Groups organize variables hierarchically (e.g., "color/brand", "spacing/base")
 */
export interface Group {
  readonly id: string;
  readonly name: string;
  readonly collectionId: string;
}

// ============================================================================
// Mode and Value Types
// ============================================================================

/**
 * Possible value types for a variable mode
 * Can be a primitive value (color, number, string) or a boolean
 */
export type PrimitiveValue = string | number | boolean | RGB | RGBA;

/**
 * Reference to another variable's mode (for aliasing)
 */
export interface AliasReference {
  readonly variableId: string;
  readonly modeId: string;
}

/**
 * A mode represents a variant of a variable (e.g., Light, Dark, Default, Hover)
 * Each mode can have either a primitive value or an alias to another variable
 */
export interface Mode {
  readonly id: string;
  readonly name: string;
  readonly value?: PrimitiveValue; // Set if this is a primitive value
  readonly alias?: AliasReference; // Set if this is an alias
}

// ============================================================================
// Variable Types
// ============================================================================

/**
 * Variable types supported by Figma
 */
export type VariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/**
 * Variable represents a design token with one or more modes
 * Variables are the atomic units of the design system
 */
export interface Variable {
  readonly id: string;
  readonly name: string;
  readonly type: VariableType;
  readonly groupId: string;
  readonly collectionId: string;
  readonly modes: Mode[];
}

// ============================================================================
// Alias Types
// ============================================================================

/**
 * Alias represents a relationship edge between two variables
 * The modeMap defines how modes from the source variable map to the target variable
 * 
 * Example: 
 * - fromVariableId: "interaction.hover" 
 * - toVariableId: "primitive.blue-500"
 * - modeMap: { "default": "light", "dark": "dark" }
 */
export interface Alias {
  readonly id: string; // Unique identifier for this alias relationship
  readonly fromVariableId: string; // Source variable (the one being aliased)
  readonly toVariableId: string; // Target variable (what it aliases to)
  readonly modeMap: Record<string, string>; // Maps source mode ID to target mode ID
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Represents a path to a variable in the format "collection/group/variable"
 */
export type VariablePath = string;

/**
 * Represents a full variable reference including mode
 */
export interface VariableReference {
  readonly variableId: string;
  readonly modeId: string;
}
