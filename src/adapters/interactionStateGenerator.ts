/**
 * Interaction State Collection Generator
 * 
 * Generates the "4 Interaction state" collection which creates interactive variants.
 * This collection has 4 modes: Idle, Hover, Pressed, Focus
 * 
 * Variables alias to Color Mode Root variables with offsets:
 * - Idle → Root +0
 * - Hover → Root +1 (one step darker)
 * - Pressed → Root +2 (two steps darker)
 * - Focus → Root +0 (same as Idle, but with focus ring)
 * 
 * Variable naming pattern:
 * "Grey/Default/Ghost/[Interaction state] Surface"
 */

import {
  FigmaCollection,
  FigmaVariable,
  VariableValueByMode,
  CollectionMode
} from '@/models/brand';
import {
  getInteractionStateOffsets,
  generateRootVariableName
} from '@/lib/colors/root-system';

/**
 * Scale types
 */
const SCALE_TYPES = [
  'Surface',
  'High',
  'Medium',
  'Low',
  'Heavy',
  'Bold',
  'Bold A11Y',
  'Minimal'
] as const;

/**
 * Fill Emphasis variants (used in variable paths)
 */
const FILL_EMPHASIS_VARIANTS = [
  'Ghost',
  'Minimal',
  'Subtle',
  'Bold'
] as const;

/**
 * Background Level variants (used in variable paths)
 */
const BACKGROUND_LEVELS = [
  'Default',
  'Level 1',
  'Level 2',
  'Bold',
  'Elevated'
] as const;

/**
 * Generate Interaction State variable name
 * 
 * @param colorFamily - Color family (e.g., "Grey")
 * @param bgLevel - Background level (e.g., "Default")
 * @param fillEmphasis - Fill emphasis (e.g., "Ghost")
 * @param scaleType - Scale type (e.g., "Surface")
 * @returns Variable name like "Grey/Default/Ghost/[Interaction state] Surface"
 */
function generateInteractionStateVariableName(
  colorFamily: string,
  bgLevel: string,
  fillEmphasis: string,
  scaleType: string
): string {
  return `${colorFamily}/${bgLevel}/${fillEmphasis}/[Interaction state] ${scaleType}`;
}

/**
 * Generate Interaction State collection
 * 
 * @param brandId - Brand ID
 * @param colorModeCollection - The 02 Colour Mode collection
 * @param colorModeVariables - Variables from Color Mode collection
 * @param colorFamilies - Color families
 * @returns Collection and variables
 */
export function generateInteractionStateCollection(
  brandId: string,
  colorModeCollection: FigmaCollection,
  colorModeVariables: FigmaVariable[],
  colorFamilies: string[]
): {
  collection: FigmaCollection;
  variables: FigmaVariable[];
} {
  const collectionId = `col_${brandId}_interaction_state`;
  
  // Create modes
  const idleModeId = `mode_${collectionId}_idle`;
  const hoverModeId = `mode_${collectionId}_hover`;
  const pressedModeId = `mode_${collectionId}_pressed`;
  const focusModeId = `mode_${collectionId}_focus`;
  
  const modes: CollectionMode[] = [
    { modeId: idleModeId, name: 'Idle' },
    { modeId: hoverModeId, name: 'Hover' },
    { modeId: pressedModeId, name: 'Pressed' },
    { modeId: focusModeId, name: 'Focus' }
  ];
  
  const variables: FigmaVariable[] = [];
  const offsets = getInteractionStateOffsets();
  
  // Get Color Mode's Light and Dark mode IDs
  const lightModeId = colorModeCollection.modes.find(m => m.name === 'Light')?.modeId;
  const darkModeId = colorModeCollection.modes.find(m => m.name === 'Dark')?.modeId;
  
  if (!lightModeId || !darkModeId) {
    throw new Error('[InteractionState] Color Mode collection missing Light or Dark mode');
  }
  
  // For each color family
  for (const colorFamily of colorFamilies) {
    // For each background level
    for (const bgLevel of BACKGROUND_LEVELS) {
      // For each fill emphasis
      for (const fillEmphasis of FILL_EMPHASIS_VARIANTS) {
        // For each scale type
        for (const scaleType of SCALE_TYPES) {
          const varName = generateInteractionStateVariableName(
            colorFamily,
            bgLevel,
            fillEmphasis,
            scaleType
          );
          const varId = `var_${collectionId}_${colorFamily}_${bgLevel.replace(/\s+/g, '_')}_${fillEmphasis}_${scaleType.replace(/\s+/g, '_')}`;
          
          // Determine which Root offset to use based on fill emphasis
          // Ghost uses Root, Minimal uses Root+1, Subtle uses Root+2, Bold uses custom
          let baseRootOffset = 0;
          if (fillEmphasis === 'Minimal') baseRootOffset = 1;
          else if (fillEmphasis === 'Subtle') baseRootOffset = 2;
          else if (fillEmphasis === 'Bold') baseRootOffset = 0; // Bold uses primaryStep, simplified to 0 for now
          
          // Create aliases for each interaction state
          const valuesByMode: VariableValueByMode = {};
          const resolvedValuesByMode: { [modeId: string]: string } = {};
          
          // Map interaction states to root offsets
          const stateToOffset = {
            [idleModeId]: baseRootOffset + offsets.idle,      // +0
            [hoverModeId]: baseRootOffset + offsets.hover,    // +1
            [pressedModeId]: baseRootOffset + offsets.pressed, // +2
            [focusModeId]: baseRootOffset + offsets.focus     // +0 (same as idle)
          };
          
          // For each interaction state mode
          for (const [stateModeId, rootOffset] of Object.entries(stateToOffset)) {
            // Find the corresponding Color Mode Root variable
            const rootVarName = generateRootVariableName(colorFamily, rootOffset, scaleType);
            const rootVar = colorModeVariables.find(v => v.name === rootVarName);
            
            if (!rootVar) {
              console.warn(`[InteractionState] Missing Color Mode variable: ${rootVarName}`);
              continue;
            }
            
            // Alias to the Color Mode Root variable
            valuesByMode[stateModeId] = {
              type: 'ALIAS',
              aliasId: rootVar.id,
              aliasCollectionId: colorModeCollection.id
            };
            
            // Resolve value (use Light mode from Color Mode as default)
            resolvedValuesByMode[stateModeId] = rootVar.resolvedValuesByMode[lightModeId] || '#000000';
          }
          
          // Create variable
          variables.push({
            id: varId,
            name: varName,
            resolvedType: 'COLOR',
            variableCollectionId: collectionId,
            valuesByMode,
            resolvedValuesByMode
          });
        }
      }
    }
  }
  
  const collection: FigmaCollection = {
    id: collectionId,
    name: '4 Interaction state',
    modes,
    defaultModeId: idleModeId,
    variableIds: variables.map(v => v.id),
    remote: false,
    collectionType: 'interaction-state',
    sourceCollectionId: colorModeCollection.id
  };
  
  console.log(`[InteractionState] Generated ${variables.length} variables for collection ${collection.name}`);
  
  return { collection, variables };
}
