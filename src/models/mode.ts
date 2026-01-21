import { VariableValue } from '../common/types';

/**
 * Mode represents a specific value of a variable in a given mode
 * (e.g., Light mode value vs Dark mode value)
 */
export interface Mode {
  modeId: string;
  name: string;
  value: VariableValue;
}

/**
 * Check if a value is an alias reference
 */
export function isAliasValue(value: VariableValue): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'VARIABLE_ALIAS'
  );
}

/**
 * Get alias ID from value if it's an alias
 */
export function getAliasId(value: VariableValue): string | null {
  if (isAliasValue(value)) {
    return (value as any).id;
  }
  return null;
}
