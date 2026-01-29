/**
 * Color Mode Collection Generator
 * 
 * Generates the "02 Colour Mode" collection which implements the Root system.
 * This collection creates variables like "Grey/Semi semantics/Root/[Colour Mode] Surface"
 * that alias to different semi-semantic variables based on Light/Dark mode.
 * 
 * Key Features:
 * - Root, Root +1, Root +2, Root +3, Root +4, Root +5 variables
 * - Light mode: Root = 2500, direction = -1 (darker = lower numbers)
 * - Dark mode: Root = 200, direction = +1 (darker = higher numbers)
 * - All 8 scale types (Surface, High, Medium, Low, Heavy, Bold, Bold A11Y, Minimal)
 */

import {
  FigmaCollection,
  FigmaVariable,
  VariableValueByMode,
  CollectionMode
} from '@/models/brand';
import {
  getRootStep,
  getRootOffset,
  generateRootVariableName,
  getRootTargetVariable
} from '@/lib/colors/root-system';
import { Step } from '@/lib/colors/color-utils';

/**
 * Scale types (emphasis levels)
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
 * Root offsets to generate (Root, Root +1, ..., Root +5)
 */
const ROOT_OFFSETS = [0, 1, 2, 3, 4, 5] as const;

/**
 * Generate Color Mode collection
 * 
 * Creates a collection with 2 modes (Light, Dark) containing Root variables
 * that alias to semi-semantic variables
 * 
 * @param brandId - Brand ID for generating collection ID
 * @param semiSemanticCollection - The 00_Semi semantics collection to reference
 * @param semiSemanticVariables - Variables from semi-semantics collection
 * @param colorFamilies - Array of color family names (e.g., ["Grey", "Indigo", "Saffron"])
 * @returns FigmaCollection with modes and variables
 */
export function generateColorModeCollection(
  brandId: string,
  semiSemanticCollection: FigmaCollection,
  semiSemanticVariables: FigmaVariable[],
  colorFamilies: string[]
): {
  collection: FigmaCollection;
  variables: FigmaVariable[];
} {
  const collectionId = `col_${brandId}_color_mode`;
  
  // Create modes
  const lightModeId = `mode_${collectionId}_light`;
  const darkModeId = `mode_${collectionId}_dark`;
  
  const modes: CollectionMode[] = [
    { modeId: lightModeId, name: 'Light' },
    { modeId: darkModeId, name: 'Dark' }
  ];
  
  const variables: FigmaVariable[] = [];
  
  // For each color family
  for (const colorFamily of colorFamilies) {
    // For each root offset
    for (const offset of ROOT_OFFSETS) {
      // For each scale type
      for (const scaleType of SCALE_TYPES) {
        // Generate variable name
        const varName = generateRootVariableName(colorFamily, offset, scaleType);
        const varId = `var_${collectionId}_${colorFamily}_Root${offset > 0 ? `_plus${offset}` : ''}_${scaleType.replace(/\s+/g, '_')}`;
        
        // Get target semi-semantic variables for Light and Dark modes
        const lightTarget = getRootTargetVariable(colorFamily, offset, scaleType, true);
        const darkTarget = getRootTargetVariable(colorFamily, offset, scaleType, false);
        
        // Find the semi-semantic variable IDs
        const lightSemiVar = semiSemanticVariables.find(v => v.name === lightTarget);
        const darkSemiVar = semiSemanticVariables.find(v => v.name === darkTarget);
        
        if (!lightSemiVar || !darkSemiVar) {
          console.warn(`[ColorMode] Missing semi-semantic variable: ${lightTarget} or ${darkTarget}`);
          continue;
        }
        
        // Create alias values for each mode
        const valuesByMode: VariableValueByMode = {
          [lightModeId]: {
            type: 'ALIAS',
            aliasId: lightSemiVar.id,
            aliasCollectionId: semiSemanticCollection.id
          },
          [darkModeId]: {
            type: 'ALIAS',
            aliasId: darkSemiVar.id,
            aliasCollectionId: semiSemanticCollection.id
          }
        };
        
        // Resolve final values
        const lightMode = semiSemanticCollection.modes[0]; // Semi-semantics has single mode
        const resolvedValuesByMode = {
          [lightModeId]: lightSemiVar.resolvedValuesByMode[lightMode.modeId] || '#000000',
          [darkModeId]: darkSemiVar.resolvedValuesByMode[lightMode.modeId] || '#ffffff'
        };
        
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
  
  // Create collection
  const collection: FigmaCollection = {
    id: collectionId,
    name: '02 Colour Mode',
    modes,
    defaultModeId: lightModeId,
    variableIds: variables.map(v => v.id),
    remote: false,
    collectionType: 'color-mode',
    sourceCollectionId: semiSemanticCollection.id
  };
  
  console.log(`[ColorMode] Generated ${variables.length} variables for collection ${collection.name}`);
  
  return { collection, variables };
}

/**
 * Helper: Get color families from palette assignments
 */
export function getColorFamiliesFromPaletteAssignments(
  paletteAssignments: Record<string, { paletteId: string; paletteName: string }>
): string[] {
  return Object.keys(paletteAssignments);
}
