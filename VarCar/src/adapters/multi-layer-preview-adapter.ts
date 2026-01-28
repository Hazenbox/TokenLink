/**
 * Multi-Layer Preview Adapter
 * Converts multi-layer generated variables to Figma preview format
 */

import {
  Brand,
  FigmaCollection,
  FigmaVariable,
  VariableValueByMode,
  GeneratedVariable
} from '@/models/brand';
import { BrandGenerator } from '@/lib/brand-generator';

/**
 * Convert multi-layer generated variables to preview format
 */
export function convertMultiLayerToPreview(
  brand: Brand
): {
  collections: FigmaCollection[];
  variablesByCollection: Map<string, FigmaVariable[]>;
} {
  console.log('[Preview Adapter] Generating multi-layer variables...');
  
  // 1. Generate multi-layer variables using the new system
  const generated = BrandGenerator.generateBrandWithLayers(brand);
  
  console.log(`[Preview Adapter] Generated ${generated.variables.length} variables`);
  
  // 2. Group variables by collection
  const collectionMap = new Map<string, GeneratedVariable[]>();
  generated.variables.forEach(v => {
    if (!collectionMap.has(v.collection)) {
      collectionMap.set(v.collection, []);
    }
    collectionMap.get(v.collection)!.push(v);
  });
  
  console.log(`[Preview Adapter] Grouped into ${collectionMap.size} collections`);
  
  // 3. Create FigmaCollection objects with proper modes
  const collections: FigmaCollection[] = [];
  const variablesByCollection = new Map<string, FigmaVariable[]>();
  
  // Track collection order (Layer 0 → Layer 8)
  const orderedCollections = Array.from(collectionMap.entries())
    .sort(([nameA], [nameB]) => {
      // Extract layer number from collection name
      const getLayerOrder = (name: string) => {
        if (name.startsWith('00_')) return 0;
        if (name.startsWith('02 ')) return 2;
        const match = name.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 99;
      };
      return getLayerOrder(nameA) - getLayerOrder(nameB);
    });
  
  orderedCollections.forEach(([collectionName, vars]) => {
    // Extract unique modes from variables in this collection
    const modeNames = [...new Set(vars.map(v => v.mode))];
    
    // Create collection object
    const collection: FigmaCollection = {
      id: `ml_${collectionName.replace(/\s+/g, '_')}`,
      name: collectionName,
      modes: modeNames.map((modeName, idx) => ({
        modeId: `mode_${idx}`,
        name: modeName
      })),
      defaultModeId: 'mode_0',
      variableIds: vars.map(v => `var_${v.name.replace(/[^a-zA-Z0-9]/g, '_')}`),
      remote: false,
      hiddenFromPublishing: false,
      generationType: collectionName.includes('Primitives') ? 'primitives' : 'semantic'
    };
    
    collections.push(collection);
    
    // Convert variables to FigmaVariable format
    const figmaVars = vars.map(v => convertToFigmaVariable(v, collection));
    variablesByCollection.set(collection.id, figmaVars);
    
    console.log(`[Preview Adapter] Collection "${collectionName}": ${figmaVars.length} variables, ${modeNames.length} modes`);
  });
  
  return { collections, variablesByCollection };
}

/**
 * Convert GeneratedVariable to FigmaVariable format
 */
function convertToFigmaVariable(
  generated: GeneratedVariable,
  collection: FigmaCollection
): FigmaVariable {
  // Find mode ID for this variable's mode
  const mode = collection.modes.find(m => m.name === generated.mode);
  const modeId = mode?.modeId || collection.defaultModeId;
  
  // Build valuesByMode
  const valuesByMode: VariableValueByMode = {};
  
  if (generated.isAliased && generated.aliasTo) {
    // Aliased variable - show alias indicator
    valuesByMode[modeId] = {
      type: 'ALIAS',
      value: generated.aliasTo.paletteName // This contains the source variable name
    };
  } else if (generated.value) {
    // Direct value (RGB color)
    valuesByMode[modeId] = {
      type: 'COLOR',
      value: generated.value
    };
  }
  
  // Build resolvedValuesByMode (for color preview)
  const resolvedValuesByMode: Record<string, string> = {};
  if (generated.value) {
    resolvedValuesByMode[modeId] = generated.value;
  } else {
    // For aliases, use a placeholder or try to resolve
    resolvedValuesByMode[modeId] = '#888888'; // Gray placeholder for aliases
  }
  
  return {
    id: `var_${generated.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
    name: generated.name,
    key: generated.name,
    variableCollectionId: collection.id,
    resolvedType: 'COLOR',
    valuesByMode,
    resolvedValuesByMode,
    scopes: ['ALL_SCOPES'],
    hiddenFromPublishing: false,
    description: generated.isAliased ? `Aliases to: ${generated.aliasTo?.paletteName || 'unknown'}` : '',
    remote: false,
    codeSyntax: {}
  };
}

/**
 * Get layer order for sorting
 */
function getLayerOrder(collectionName: string): number {
  // Map collection names to layer order
  const layerMap: Record<string, number> = {
    '00_Primitives': 0,
    '00_Semi semantics': 1,
    '02 Colour Mode': 2,
    '3 Background Level': 3,
    '2 Fill emphasis': 4,
    '4 Interaction state': 5,
    '1 Appearance': 6,
    '9 Theme': 7,
    '10 Brand': 8
  };
  
  return layerMap[collectionName] ?? 99;
}
