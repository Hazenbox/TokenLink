import { CollectionType } from '../common/types';

/**
 * Collection represents a top-level grouping of variables in Figma.
 * Collections can be typed as primitive, semantic, interaction, or theme.
 */
export interface Collection {
  id: string;
  name: string;
  type: CollectionType;
  modes: CollectionMode[];
  variableIds: string[];
}

/**
 * CollectionMode represents a mode within a collection (e.g., Light, Dark)
 */
export interface CollectionMode {
  modeId: string;
  name: string;
}

/**
 * Detect collection type based on name patterns
 */
export function detectCollectionType(name: string): CollectionType {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('primitive') || lowerName.includes('base') || lowerName.includes('core')) {
    return 'primitive';
  }
  
  if (lowerName.includes('semantic')) {
    return 'semantic';
  }
  
  if (lowerName.includes('interaction') || lowerName.includes('state')) {
    return 'interaction';
  }
  
  if (lowerName.includes('theme') || lowerName.includes('brand')) {
    return 'theme';
  }
  
  // Default to semantic if can't detect
  return 'semantic';
}
