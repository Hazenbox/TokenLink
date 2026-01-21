/**
 * Alias represents an edge in the variable graph,
 * showing that one variable references another.
 */
export interface Alias {
  id: string;
  fromVariableId: string;
  toVariableId: string;
  modeMap: ModeMapping[];
  isBroken: boolean;
  isCrossCollection: boolean;
}

/**
 * ModeMapping represents how modes are mapped in an alias
 * (e.g., Light mode in source maps to Light mode in target)
 */
export interface ModeMapping {
  fromModeId: string;
  toModeId: string;
  fromModeName: string;
  toModeName: string;
}

/**
 * Create an alias ID from source and target variable IDs
 */
export function createAliasId(fromId: string, toId: string): string {
  return `${fromId}->${toId}`;
}
