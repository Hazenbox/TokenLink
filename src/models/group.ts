/**
 * Group represents a nested grouping within a collection.
 * In Figma, groups are derived from variable names using slashes (e.g., "color/primary")
 */
export interface Group {
  id: string;
  name: string;
  collectionId: string;
  variableIds: string[];
  parentGroupId?: string;
}

/**
 * Extract group name from a variable name path
 * e.g., "color/primary/default" -> "color/primary"
 */
export function extractGroupName(variableName: string): string | null {
  const parts = variableName.split('/');
  if (parts.length <= 1) {
    return null;
  }
  return parts.slice(0, -1).join('/');
}

/**
 * Extract variable base name from full path
 * e.g., "color/primary/default" -> "default"
 */
export function extractVariableBaseName(variableName: string): string {
  const parts = variableName.split('/');
  return parts[parts.length - 1];
}
