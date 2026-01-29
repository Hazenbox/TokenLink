/**
 * Adapter to convert Figma Variables API data to internal graph model.
 * Handles the transformation from Figma's variable structure to our canonical graph format.
 */

/// <reference types="@figma/plugin-typings" />

import {
  createGraph,
  addCollection,
  addGroup,
  addVariable,
  VariableGraph,
  Collection,
  Group,
  Variable as InternalVariable,
  Mode,
  ModeValueOrAlias,
  CollectionType,
} from '../models';

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Extended Figma Variable with collection data for processing
 */
interface FigmaVariableWithCollection {
  variable: Variable;
  collectionId: string;
  collectionName: string;
  collectionModes: Array<{ modeId: string; name: string }>;
}

// ============================================================================
// Group Extraction
// ============================================================================

/**
 * Extracts group and variable name from a Figma variable name.
 * Examples:
 *   "Colors/Primary" → { group: "Colors", name: "Primary" }
 *   "Spacing/Margins/Small" → { group: "Spacing/Margins", name: "Small" }
 *   "Primary" → { group: "Default", name: "Primary" }
 */
function extractGroupAndName(
  variableName: string,
  defaultGroupName: string
): { group: string; name: string } {
  const lastSlashIndex = variableName.lastIndexOf('/');

  if (lastSlashIndex === -1) {
    // No group in name, use default
    return { group: defaultGroupName, name: variableName };
  }

  return {
    group: variableName.substring(0, lastSlashIndex),
    name: variableName.substring(lastSlashIndex + 1),
  };
}

// ============================================================================
// Collection Type Inference
// ============================================================================

/**
 * Infers collection type from collection name.
 * Uses heuristics to determine if it's primitive, semantic, interaction, theme, or brand.
 */
export function inferCollectionType(collectionName: string): CollectionType {
  const lowerName = collectionName.toLowerCase();

  if (
    lowerName.includes('primitive') ||
    lowerName.includes('base') ||
    lowerName.includes('foundation')
  ) {
    return 'primitive';
  }

  if (lowerName.includes('semantic') || lowerName.includes('token')) {
    return 'semantic';
  }

  if (
    lowerName.includes('interaction') ||
    lowerName.includes('state') ||
    lowerName.includes('hover') ||
    lowerName.includes('active')
  ) {
    return 'interaction';
  }

  if (lowerName.includes('theme') || lowerName.includes('mode')) {
    return 'theme';
  }

  if (lowerName.includes('brand')) {
    return 'brand';
  }

  // Default to semantic if can't determine
  return 'semantic';
}

// ============================================================================
// Value Conversion
// ============================================================================

/**
 * Converts Figma variable value to internal ModeValueOrAlias format
 */
function convertVariableValue(
  value: VariableValue,
  variableType: VariableResolvedDataType
): ModeValueOrAlias {
  // Check if it's an alias
  if (typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
    return {
      type: 'alias',
      variableId: value.id,
      modeId: '', // Will be populated if needed
    };
  }

  // Handle different value types
  if (variableType === 'COLOR' && typeof value === 'object' && 'r' in value) {
    // Convert RGB to hex
    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    return {
      type: 'value',
      value: hex.toUpperCase(),
    };
  }

  // For FLOAT, STRING, BOOLEAN - store as-is
  return {
    type: 'value',
    value: value as string | number | boolean,
  };
}

// ============================================================================
// Main Adapter Function
// ============================================================================

/**
 * Converts Figma Variable Collections and Variables to internal graph model.
 * This is the main entry point for the adapter.
 * 
 * @param figmaCollections - Array of Figma VariableCollection objects
 * @param figmaVariables - Array of Figma Variable objects
 * @returns Complete VariableGraph with collections, groups, variables, and aliases
 */
export function figmaToGraph(
  figmaCollections: VariableCollection[],
  figmaVariables: Variable[]
): VariableGraph {
  const graph = createGraph();

  // Map to track groups we've already created (key: collectionId/groupName)
  const groupMap = new Map<string, string>(); // Maps "collectionId/groupName" → groupId

  // Step 1: Add all collections to the graph
  figmaCollections.forEach((figmaCollection) => {
    const collection: Collection = {
      id: figmaCollection.id,
      name: figmaCollection.name,
      type: inferCollectionType(figmaCollection.name),
    };
    addCollection(graph, collection);
  });

  // Step 2: Process variables and extract groups
  // Create a map of variables by collection for easier processing
  const variablesByCollection = new Map<string, Variable[]>();
  
  figmaVariables.forEach((variable) => {
    const collectionVars = variablesByCollection.get(variable.variableCollectionId) || [];
    collectionVars.push(variable);
    variablesByCollection.set(variable.variableCollectionId, collectionVars);
  });

  // Step 3: For each collection, process its variables
  figmaCollections.forEach((figmaCollection) => {
    const collectionVariables = variablesByCollection.get(figmaCollection.id) || [];
    
    collectionVariables.forEach((figmaVariable) => {
      // Extract group from variable name
      const defaultGroupName = figmaCollection.name || 'Default';
      const { group: groupName, name: variableName } = extractGroupAndName(
        figmaVariable.name,
        defaultGroupName
      );

      // Get or create group
      const groupKey = `${figmaCollection.id}/${groupName}`;
      let groupId = groupMap.get(groupKey);

      if (!groupId) {
        // Create new group
        groupId = `group-${figmaCollection.id}-${groupName.replace(/\//g, '-')}`;
        const group: Group = {
          id: groupId,
          name: groupName,
          collectionId: figmaCollection.id,
        };
        addGroup(graph, group);
        groupMap.set(groupKey, groupId);
      }

      // Convert variable modes
      const modes: Mode[] = [];
      
      // Get all mode values for this variable
      Object.entries(figmaVariable.valuesByMode).forEach(([modeId, value]) => {
        // Find the mode name from the collection
        const modeInfo = figmaCollection.modes.find((m) => m.modeId === modeId);
        const modeName = modeInfo ? modeInfo.name : modeId;

        let modeValue = convertVariableValue(value, figmaVariable.resolvedType);
        
        // If it's an alias, resolve the target mode ID properly
        if (modeValue.type === 'alias') {
          // Find the target variable to get its collection
          const targetVariable = figmaVariables.find(v => v.id === modeValue.variableId);
          
          if (targetVariable) {
            // Find the target variable's collection
            const targetCollection = figmaCollections.find(c => c.id === targetVariable.variableCollectionId);
            
            if (targetCollection) {
              // Find the mode in target collection with the same name as source mode
              const targetMode = targetCollection.modes.find(m => m.name === modeName);
              
              if (targetMode) {
                // Use the target collection's mode ID
                modeValue = {
                  ...modeValue,
                  modeId: targetMode.modeId,
                };
                
                console.log(`[Token Link] Resolved alias: ${figmaVariable.name}.${modeName} → ${targetVariable.name}.${targetMode.name} (mode ID: ${targetMode.modeId})`);
              } else {
                // Fallback: if no matching mode name found, use the first mode of target collection
                console.warn(`[Token Link] No matching mode "${modeName}" found in target collection "${targetCollection.name}", using first mode`);
                modeValue = {
                  ...modeValue,
                  modeId: targetCollection.modes[0]?.modeId || modeId,
                };
              }
            } else {
              console.warn(`[Token Link] Target collection not found for variable ${targetVariable.name}`);
              modeValue = {
                ...modeValue,
                modeId: modeId,
              };
            }
          } else {
            console.warn(`[Token Link] Target variable not found for alias in ${figmaVariable.name}.${modeName}`);
            modeValue = {
              ...modeValue,
              modeId: modeId,
            };
          }
        }

        modes.push({
          id: modeId,
          name: modeName,
          value: modeValue,
        });
      });

      // Create internal variable
      const internalVariable: InternalVariable = {
        id: figmaVariable.id,
        name: variableName,
        groupId: groupId,
        variableType: figmaVariable.resolvedType as any,
        modes,
      };

      // Add variable to graph (this also extracts aliases)
      addVariable(graph, internalVariable);
    });
  });

  return graph;
}

// ============================================================================
// Serialization Helpers
// ============================================================================

/**
 * Converts a VariableGraph (with Maps) to a plain object structure
 * suitable for JSON serialization and transmission to UI.
 */
export function serializeGraph(graph: VariableGraph): {
  collections: Collection[];
  groups: Group[];
  variables: InternalVariable[];
  aliases: any[];
} {
  return {
    collections: Array.from(graph.collections.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    groups: Array.from(graph.groups.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    variables: Array.from(graph.variables.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
    aliases: graph.aliases,
  };
}
