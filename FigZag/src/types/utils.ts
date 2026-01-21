/**
 * Type Utilities and Validation Helpers
 * 
 * Provides runtime type checking, validation functions, and helper utilities
 * for working with the token graph types.
 */

import {
  Collection,
  CollectionType,
  Group,
  Variable,
  VariableType,
  Mode,
  Alias,
  RGB,
  RGBA,
  PrimitiveValue,
  AliasReference
} from './models';

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard for RGB color
 */
export function isRGB(value: unknown): value is RGB {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.r === 'number' &&
    typeof obj.g === 'number' &&
    typeof obj.b === 'number' &&
    obj.r >= 0 && obj.r <= 1 &&
    obj.g >= 0 && obj.g <= 1 &&
    obj.b >= 0 && obj.b <= 1
  );
}

/**
 * Type guard for RGBA color
 */
export function isRGBA(value: unknown): value is RGBA {
  if (!isRGB(value)) return false;
  const obj = value as unknown as Record<string, unknown>;
  return typeof obj.a === 'number' && obj.a >= 0 && obj.a <= 1;
}

/**
 * Type guard for PrimitiveValue
 */
export function isPrimitiveValue(value: unknown): value is PrimitiveValue {
  if (value === null || value === undefined) return false;
  
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return true;
  }
  
  return isRGB(value) || isRGBA(value);
}

/**
 * Type guard for AliasReference
 */
export function isAliasReference(value: unknown): value is AliasReference {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.variableId === 'string' &&
    typeof obj.modeId === 'string'
  );
}

/**
 * Type guard for Collection
 */
export function isCollection(value: unknown): value is Collection {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    isCollectionType(obj.type) &&
    Array.isArray(obj.modes) &&
    obj.modes.every((m: unknown) => typeof m === 'string')
  );
}

/**
 * Type guard for CollectionType
 */
export function isCollectionType(value: unknown): value is CollectionType {
  return (
    value === 'primitive' ||
    value === 'semantic' ||
    value === 'interaction' ||
    value === 'theme'
  );
}

/**
 * Type guard for Group
 */
export function isGroup(value: unknown): value is Group {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.collectionId === 'string'
  );
}

/**
 * Type guard for VariableType
 */
export function isVariableType(value: unknown): value is VariableType {
  return (
    value === 'COLOR' ||
    value === 'FLOAT' ||
    value === 'STRING' ||
    value === 'BOOLEAN'
  );
}

/**
 * Type guard for Mode
 */
export function isMode(value: unknown): value is Mode {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  
  const hasId = typeof obj.id === 'string';
  const hasName = typeof obj.name === 'string';
  const hasValidValue = obj.value === undefined || isPrimitiveValue(obj.value);
  const hasValidAlias = obj.alias === undefined || isAliasReference(obj.alias);
  const hasEitherValueOrAlias = obj.value !== undefined || obj.alias !== undefined;
  
  return hasId && hasName && hasValidValue && hasValidAlias && hasEitherValueOrAlias;
}

/**
 * Type guard for Variable
 */
export function isVariable(value: unknown): value is Variable {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    isVariableType(obj.type) &&
    typeof obj.groupId === 'string' &&
    typeof obj.collectionId === 'string' &&
    Array.isArray(obj.modes) &&
    obj.modes.every(isMode)
  );
}

/**
 * Type guard for Alias
 */
export function isAlias(value: unknown): value is Alias {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.fromVariableId === 'string' &&
    typeof obj.toVariableId === 'string' &&
    typeof obj.modeMap === 'object' &&
    obj.modeMap !== null
  );
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate a Collection object
 */
export function validateCollection(collection: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isCollection(collection)) {
    errors.push({
      field: 'collection',
      message: 'Invalid collection object',
      value: collection
    });
    return { valid: false, errors };
  }
  
  if (!collection.id || collection.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Collection ID cannot be empty'
    });
  }
  
  if (!collection.name || collection.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Collection name cannot be empty'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate a Variable object
 */
export function validateVariable(variable: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isVariable(variable)) {
    errors.push({
      field: 'variable',
      message: 'Invalid variable object',
      value: variable
    });
    return { valid: false, errors };
  }
  
  if (!variable.id || variable.id.trim() === '') {
    errors.push({
      field: 'id',
      message: 'Variable ID cannot be empty'
    });
  }
  
  if (!variable.name || variable.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Variable name cannot be empty'
    });
  }
  
  if (variable.modes.length === 0) {
    errors.push({
      field: 'modes',
      message: 'Variable must have at least one mode'
    });
  }
  
  // Validate each mode
  variable.modes.forEach((mode, index) => {
    if (!mode.value && !mode.alias) {
      errors.push({
        field: `modes[${index}]`,
        message: 'Mode must have either a value or an alias'
      });
    }
    
    if (mode.value && mode.alias) {
      errors.push({
        field: `modes[${index}]`,
        message: 'Mode cannot have both value and alias'
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate an Alias object
 */
export function validateAlias(alias: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!isAlias(alias)) {
    errors.push({
      field: 'alias',
      message: 'Invalid alias object',
      value: alias
    });
    return { valid: false, errors };
  }
  
  if (alias.fromVariableId === alias.toVariableId) {
    errors.push({
      field: 'toVariableId',
      message: 'Alias cannot reference itself'
    });
  }
  
  if (Object.keys(alias.modeMap).length === 0) {
    errors.push({
      field: 'modeMap',
      message: 'Alias must have at least one mode mapping'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// Conversion Utilities
// ============================================================================

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Convert RGBA to rgba() CSS string
 */
export function rgbaToString(rgba: RGBA): string {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${rgba.a})`;
}

/**
 * Convert hex color string to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

/**
 * Convert a primitive value to a display string
 */
export function primitiveValueToString(value: PrimitiveValue): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (isRGBA(value)) return rgbaToString(value);
  if (isRGB(value)) return rgbToHex(value);
  return String(value);
}

// ============================================================================
// Comparison Utilities
// ============================================================================

/**
 * Deep equality check for RGB colors
 */
export function rgbEquals(a: RGB, b: RGB, epsilon = 0.001): boolean {
  return (
    Math.abs(a.r - b.r) < epsilon &&
    Math.abs(a.g - b.g) < epsilon &&
    Math.abs(a.b - b.b) < epsilon
  );
}

/**
 * Deep equality check for RGBA colors
 */
export function rgbaEquals(a: RGBA, b: RGBA, epsilon = 0.001): boolean {
  return rgbEquals(a, b, epsilon) && Math.abs(a.a - b.a) < epsilon;
}

/**
 * Compare two primitive values for equality
 */
export function primitiveValueEquals(
  a: PrimitiveValue,
  b: PrimitiveValue,
  epsilon = 0.001
): boolean {
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'string' || typeof a === 'boolean') {
    return a === b;
  }
  
  if (typeof a === 'number' && typeof b === 'number') {
    return Math.abs(a - b) < epsilon;
  }
  
  if (isRGBA(a) && isRGBA(b)) {
    return rgbaEquals(a, b, epsilon);
  }
  
  if (isRGB(a) && isRGB(b)) {
    return rgbEquals(a, b, epsilon);
  }
  
  return false;
}

// ============================================================================
// Naming Utilities
// ============================================================================

/**
 * Sanitize a name for use as an identifier
 */
export function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate a unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Parse a variable path into components
 */
export function parseVariablePath(path: string): {
  collection: string;
  group: string;
  variable: string;
} | null {
  const parts = path.split('/');
  if (parts.length !== 3) return null;
  
  const [collection, group, variable] = parts;
  return { collection, group, variable };
}

/**
 * Build a variable path from components
 */
export function buildVariablePath(
  collection: string,
  group: string,
  variable: string
): string {
  return `${collection}/${group}/${variable}`;
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Filter variables by type
 */
export function filterVariablesByType(
  variables: Variable[],
  type: VariableType
): Variable[] {
  return variables.filter(v => v.type === type);
}

/**
 * Group variables by collection
 */
export function groupVariablesByCollection(
  variables: Variable[]
): Record<string, Variable[]> {
  return variables.reduce((acc, variable) => {
    const collectionId = variable.collectionId;
    if (!acc[collectionId]) {
      acc[collectionId] = [];
    }
    acc[collectionId].push(variable);
    return acc;
  }, {} as Record<string, Variable[]>);
}

/**
 * Group variables by group
 */
export function groupVariablesByGroup(
  variables: Variable[]
): Record<string, Variable[]> {
  return variables.reduce((acc, variable) => {
    const groupId = variable.groupId;
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(variable);
    return acc;
  }, {} as Record<string, Variable[]>);
}

// ============================================================================
// Pattern Matching
// ============================================================================

/**
 * Check if a string matches a pattern (string or regex)
 */
export function matchesPattern(value: string, pattern: string | RegExp): boolean {
  if (typeof pattern === 'string') {
    return value === pattern;
  }
  return pattern.test(value);
}

/**
 * Create a regex from a glob pattern
 * Supports * and ? wildcards
 */
export function globToRegex(glob: string): RegExp {
  const escaped = glob
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}
