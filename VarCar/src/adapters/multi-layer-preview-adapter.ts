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
      variableIds: [],  // Will be filled after grouping
      remote: false,
      hiddenFromPublishing: false,
      generationType: collectionName.includes('Primitives') ? 'primitives' : 'semantic'
    };
    
    // GROUP variables by name (multiple modes → single variable)
    const variablesByName = new Map<string, GeneratedVariable[]>();
    vars.forEach(v => {
      if (!variablesByName.has(v.name)) {
        variablesByName.set(v.name, []);
      }
      variablesByName.get(v.name)!.push(v);
    });
    
    // Convert grouped variables to FigmaVariable format
    const figmaVars: FigmaVariable[] = [];
    variablesByName.forEach((modeEntries, varName) => {
      const figmaVar = convertToFigmaVariableMultiMode(modeEntries, collection);
      figmaVars.push(figmaVar);
    });
    
    // Update variableIds in collection
    collection.variableIds = figmaVars.map(v => v.id);
    
    collections.push(collection);
    // FIX: Use collection.name (clean) as key, not collection.id (has ml_ prefix)
    variablesByCollection.set(collection.name, figmaVars);
    
    console.log(`[Preview Adapter] Collection "${collectionName}": ${figmaVars.length} variables, ${modeNames.length} modes`);
  });
  
  return { collections, variablesByCollection };
}

/**
 * Convert multiple GeneratedVariable entries (same name, different modes) 
 * into ONE FigmaVariable with multiple valuesByMode entries
 */
function convertToFigmaVariableMultiMode(
  modeEntries: GeneratedVariable[],
  collection: FigmaCollection
): FigmaVariable {
  // Use first entry for common properties
  const first = modeEntries[0];
  const varId = `var_${first.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Build valuesByMode and resolvedValuesByMode for ALL modes
  const valuesByMode: VariableValueByMode = {};
  const resolvedValuesByMode: Record<string, string> = {};
  
  modeEntries.forEach(entry => {
    // Find mode ID for this entry's mode name
    const mode = collection.modes.find(m => m.name === entry.mode);
    if (!mode) {
      console.warn(`[Preview Adapter] Mode not found: ${entry.mode}`);
      return;
    }
    
    const modeId = mode.modeId;
    
    // Set value for this mode
    if (entry.isAliased && entry.aliasTo) {
      // Aliased variable
      valuesByMode[modeId] = {
        type: 'ALIAS',
        aliasId: entry.aliasTo.paletteName || 'unknown',
        aliasCollectionId: entry.collection
      };
      // Use resolved value if available, otherwise placeholder
      resolvedValuesByMode[modeId] = entry.value || '#888888';
    } else if (entry.value) {
      // Direct RGB value
      valuesByMode[modeId] = {
        type: 'COLOR',
        value: entry.value
      };
      resolvedValuesByMode[modeId] = entry.value;
    }
  });
  
  return {
    id: varId,
    name: first.name,
    key: first.name,
    variableCollectionId: collection.id,
    resolvedType: 'COLOR',
    valuesByMode,
    resolvedValuesByMode,
    scopes: ['ALL_SCOPES'],
    hiddenFromPublishing: false,
    description: first.isAliased ? `Aliases to: ${first.aliasTo?.paletteName || 'unknown'}` : '',
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
