/**
 * Core type definitions for the internal variable graph model.
 * These types are completely independent of Figma APIs.
 */

// ============================================================================
// Collection Types
// ============================================================================

/**
 * Type of collection that organizes design tokens hierarchically
 */
export type CollectionType = 'primitive' | 'semantic' | 'interaction' | 'theme' | 'brand';

/**
 * Collection represents a top-level container for variables
 * Examples: "Color Primitives", "Semantic Tokens", "Theme Variables"
 */
export interface Collection {
  id: string;
  name: string;
  type: CollectionType;
}

// ============================================================================
// Group Types
// ============================================================================

/**
 * Group represents a nested organizational unit within a collection
 * Examples: "Colors/Brand", "Spacing/Margins", "States/Hover"
 */
export interface Group {
  id: string;
  name: string;
  collectionId: string;
}

// ============================================================================
// Mode Value Types
// ============================================================================

/**
 * Represents a direct value (color hex, number, string, boolean)
 */
export interface ModeValue {
  type: 'value';
  value: string | number | boolean;
}

/**
 * Represents an alias reference to another variable's mode
 */
export interface ModeAlias {
  type: 'alias';
  variableId: string;
  modeId: string;
}

/**
 * Mode value can be either a direct value or an alias to another variable
 */
export type ModeValueOrAlias = ModeValue | ModeAlias;

// ============================================================================
// Mode Types
// ============================================================================

/**
 * Mode represents a variant of a variable (e.g., Light/Dark, Default/Hover)
 */
export interface Mode {
  id: string;
  name: string;
  value: ModeValueOrAlias;
}

// ============================================================================
// Variable Types
// ============================================================================

/**
 * Variable type classification from Figma
 */
export type VariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/**
 * Variable represents a design token with one or more mode values
 */
export interface Variable {
  id: string;
  name: string;
  groupId: string;
  variableType?: VariableType;
  modes: Mode[];
}

// ============================================================================
// Alias Relationship Types
// ============================================================================

/**
 * Alias represents a relationship between two variables
 * modeMap defines how modes are mapped: sourceModeId -> targetModeId
 */
export interface Alias {
  fromVariableId: string;
  toVariableId: string;
  modeMap: Record<string, string>;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a ModeValueOrAlias is a ModeValue
 */
export function isModeValue(value: ModeValueOrAlias): value is ModeValue {
  return value.type === 'value';
}

/**
 * Type guard to check if a ModeValueOrAlias is a ModeAlias
 */
export function isModeAlias(value: ModeValueOrAlias): value is ModeAlias {
  return value.type === 'alias';
}
