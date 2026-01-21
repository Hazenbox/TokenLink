import { Mode } from './mode';

/**
 * Variable represents a single variable in Figma with its modes
 */
export interface Variable {
  id: string;
  name: string;
  collectionId: string;
  groupId?: string;
  resolvedType: VariableResolvedType;
  modes: Mode[];
}

/**
 * Variable types supported in Figma
 */
export type VariableResolvedType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

/**
 * Check if a variable has any alias values
 */
export function hasAliases(variable: Variable): boolean {
  return variable.modes.some(mode => {
    const value = mode.value;
    return (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'VARIABLE_ALIAS'
    );
  });
}

/**
 * Get all alias IDs from a variable
 */
export function getAliasIds(variable: Variable): string[] {
  const aliasIds: string[] = [];
  
  variable.modes.forEach(mode => {
    const value = mode.value;
    if (
      typeof value === 'object' &&
      value !== null &&
      'type' in value &&
      value.type === 'VARIABLE_ALIAS' &&
      'id' in value
    ) {
      aliasIds.push(value.id);
    }
  });
  
  return aliasIds;
}
