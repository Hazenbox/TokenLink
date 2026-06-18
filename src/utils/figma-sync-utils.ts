/**
 * Shared utilities for Figma variable sync (pure functions — safe for UI and plugin code).
 */

export const PRIMITIVE_COLLECTION_NAMES = new Set([
  '00_Primitives_Core',
  '00_Primitives_Functional',
]);

/** Legacy single-collection name kept for backwards compatibility */
export const LEGACY_PRIMITIVE_COLLECTION_NAME = '00_Primitives';

export interface SyncVariablePayload {
  name: string;
  mode: string;
  value?: string;
  layer?: number;
  generationType?: string;
  isAliased?: boolean;
  aliasTo?: {
    paletteName: string;
    paletteId?: string;
    step?: number;
    scale?: string;
  };
}

export function cleanCollectionName(name: string): string {
  return name.replace(/^ml_/, '');
}

export function isPrimitiveCollection(name: string): boolean {
  const clean = cleanCollectionName(name);
  return (
    PRIMITIVE_COLLECTION_NAMES.has(clean) ||
    clean === LEGACY_PRIMITIVE_COLLECTION_NAME ||
    clean.startsWith('00_Primitives')
  );
}

export function partitionCollectionsForSync(
  entries: [string, SyncVariablePayload[]][]
): {
  primitiveCollections: [string, SyncVariablePayload[]][];
  aliasedCollections: [string, SyncVariablePayload[]][];
} {
  const primitiveCollections = entries.filter(([name]) => isPrimitiveCollection(name));
  const aliasedCollections = entries.filter(([name]) => !isPrimitiveCollection(name));
  return { primitiveCollections, aliasedCollections };
}

export function sortCollectionsByLayer(
  entries: [string, SyncVariablePayload[]][]
): [string, SyncVariablePayload[]][] {
  return [...entries].sort(([, varsA], [, varsB]) => {
    const layerA = varsA[0]?.layer ?? 0;
    const layerB = varsB[0]?.layer ?? 0;
    return layerA - layerB;
  });
}

export function validatePrimitiveValuesBeforeSync(
  variablesByCollection: Record<string, SyncVariablePayload[]>
): { valid: boolean; missingCount: number; errors: string[] } {
  const errors: string[] = [];
  let missingCount = 0;

  for (const [collectionName, variables] of Object.entries(variablesByCollection)) {
    if (!isPrimitiveCollection(collectionName)) continue;

    for (const variable of variables) {
      if (!variable.isAliased && !variable.value) {
        missingCount++;
      }
    }
  }

  if (missingCount > 0) {
    errors.push(
      `${missingCount} primitive variable(s) have no color value. Generation may have failed — sync aborted.`
    );
  }

  return { valid: missingCount === 0, missingCount, errors };
}
