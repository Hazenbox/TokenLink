/**
 * Figma Native JSON Importer
 * Parses and validates Figma's native variable export format
 * Converts it to internal graph model for import
 */

import {
  FigmaNativeExport,
  FigmaNativeParseResult,
  FigmaNativeCollection,
  FigmaNativeVariable,
  FigmaNativeValue,
  FigmaNativeRGBA,
  FigmaNativeAlias,
} from '../models/export';

import {
  VariableGraph,
  createGraph,
  addCollection,
  addGroup,
  addVariable,
  Collection,
  Group,
  Variable as InternalVariable,
  Mode,
  ModeValueOrAlias,
} from '../models';

import { inferCollectionType } from './figmaToGraph';

// ============================================================================
// Format Detection
// ============================================================================

/**
 * Detects the import format from JSON string
 * @param jsonString - Raw JSON string to analyze
 * @returns Format type: 'figzig', 'figma-native', or 'unknown'
 */
export function detectImportFormat(jsonString: string): 'figzig' | 'figma-native' | 'unknown' {
  try {
    const data = JSON.parse(jsonString);
    
    // FigZig format has $schema and metadata.exporter fields
    if (data.$schema && data.metadata?.exporter === 'FigZig') {
      return 'figzig';
    }
    
    // Figma native format has collections array with variables inside each collection
    if (
      data.schemaVersion &&
      Array.isArray(data.collections) &&
      data.collections.length > 0 &&
      data.collections[0].variables !== undefined
    ) {
      return 'figma-native';
    }
    
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// ============================================================================
// JSON Parsing and Validation
// ============================================================================

/**
 * Parses and validates a Figma native JSON export
 * @param jsonString - Raw JSON string to parse
 * @returns Parse result with validation status and data
 */
export function parseFigmaNativeJSON(jsonString: string): FigmaNativeParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const data = JSON.parse(jsonString) as FigmaNativeExport;
    
    // Validate required fields
    if (typeof data.schemaVersion !== 'number') {
      errors.push('Missing or invalid schemaVersion field');
    }
    
    if (!data.lastModified) {
      warnings.push('Missing lastModified field');
    }
    
    if (!Array.isArray(data.collections)) {
      errors.push('Missing or invalid collections array');
      return { valid: false, errors, warnings };
    }
    
    // Validate each collection
    data.collections.forEach((collection, idx) => {
      const prefix = `Collection ${idx} (${collection.name || 'unnamed'})`;
      
      if (!collection.id) {
        errors.push(`${prefix}: Missing id`);
      }
      if (!collection.name) {
        errors.push(`${prefix}: Missing name`);
      }
      if (!Array.isArray(collection.modes)) {
        errors.push(`${prefix}: Missing or invalid modes array`);
      }
      if (!Array.isArray(collection.variables)) {
        errors.push(`${prefix}: Missing or invalid variables array`);
      }
      
      // Validate variables
      collection.variables?.forEach((variable, vIdx) => {
        const vPrefix = `${prefix}, Variable ${vIdx} (${variable.name || 'unnamed'})`;
        
        if (!variable.id) {
          errors.push(`${vPrefix}: Missing id`);
        }
        if (!variable.name) {
          errors.push(`${vPrefix}: Missing name`);
        }
        if (!variable.resolvedType) {
          errors.push(`${vPrefix}: Missing resolvedType`);
        }
        if (!variable.valuesByMode || typeof variable.valuesByMode !== 'object') {
          errors.push(`${vPrefix}: Missing or invalid valuesByMode`);
        }
      });
    });
    
    // Return result
    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }
    
    return {
      valid: true,
      data,
      errors: [],
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`JSON parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings,
    };
  }
}

// ============================================================================
// Value Conversion
// ============================================================================

/**
 * Checks if a value is a Figma native RGBA color
 */
function isFigmaNativeRGBA(value: any): value is FigmaNativeRGBA {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.r === 'number' &&
    typeof value.g === 'number' &&
    typeof value.b === 'number' &&
    typeof value.a === 'number'
  );
}

/**
 * Checks if a value is a Figma native alias
 */
function isFigmaNativeAlias(value: any): value is FigmaNativeAlias {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.type === 'VARIABLE_ALIAS' &&
    typeof value.id === 'string'
  );
}

/**
 * Converts RGBA color (0-1 range) to hex string
 */
function rgbaToHex(rgba: FigmaNativeRGBA): string {
  const r = Math.round(rgba.r * 255);
  const g = Math.round(rgba.g * 255);
  const b = Math.round(rgba.b * 255);
  
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  return hex.toUpperCase();
}

/**
 * Converts a Figma native value to internal ModeValueOrAlias format
 */
function convertFigmaNativeValue(
  value: FigmaNativeValue,
  variableType: string
): ModeValueOrAlias {
  // Handle alias
  if (isFigmaNativeAlias(value)) {
    return {
      type: 'alias',
      variableId: value.id,
      modeId: '', // Will be populated later during alias resolution
    };
  }
  
  // Handle RGBA color
  if (variableType === 'COLOR' && isFigmaNativeRGBA(value)) {
    return {
      type: 'value',
      value: rgbaToHex(value),
    };
  }
  
  // Handle primitive values (string, number, boolean)
  return {
    type: 'value',
    value: value as string | number | boolean,
  };
}

// ============================================================================
// Graph Conversion
// ============================================================================

/**
 * Extracts group and variable name from a Figma variable name
 * Examples:
 *   "Colors/Primary" → { group: "Colors", name: "Primary" }
 *   "Spacing/Margins/Small" → { group: "Spacing/Margins", name: "Small" }
 *   "Primary" → { group: "", name: "Primary" }
 */
function extractGroupAndName(variableName: string): { group: string; name: string } {
  const lastSlashIndex = variableName.lastIndexOf('/');
  
  if (lastSlashIndex === -1) {
    return { group: '', name: variableName };
  }
  
  return {
    group: variableName.substring(0, lastSlashIndex),
    name: variableName.substring(lastSlashIndex + 1),
  };
}

/**
 * Converts Figma native export data to internal graph model
 * @param data - Validated Figma native export data
 * @returns Internal variable graph
 */
export function figmaNativeToGraph(data: FigmaNativeExport): VariableGraph {
  const graph = createGraph();
  
  // Map to track groups (key: collectionId/groupName → groupId)
  const groupMap = new Map<string, string>();
  
  // Map to store variable info for alias resolution
  const variableInfoMap = new Map<string, {
    collectionId: string;
    modes: Array<{ modeId: string; name: string }>;
  }>();
  
  // Step 1: Add all collections to the graph
  data.collections.forEach((figmaCollection) => {
    const collection: Collection = {
      id: figmaCollection.id,
      name: figmaCollection.name,
      type: inferCollectionType(figmaCollection.name),
    };
    addCollection(graph, collection);
  });
  
  // Step 2: Process variables and create groups
  data.collections.forEach((figmaCollection) => {
    figmaCollection.variables.forEach((figmaVariable) => {
      // Extract group from variable name
      const { group: groupName, name: variableName } = extractGroupAndName(figmaVariable.name);
      
      // Get or create group
      const groupKey = `${figmaCollection.id}/${groupName}`;
      let groupId = groupMap.get(groupKey);
      
      if (!groupId) {
        // Create new group
        const cleanGroupName = groupName.replace(/\//g, '-');
        groupId = groupName 
          ? `group-${figmaCollection.id}-${cleanGroupName}`
          : `group-${figmaCollection.id}-default`;
        
        const group: Group = {
          id: groupId,
          name: groupName || figmaCollection.name,
          collectionId: figmaCollection.id,
        };
        addGroup(graph, group);
        groupMap.set(groupKey, groupId);
      }
      
      // Store variable info for alias resolution
      variableInfoMap.set(figmaVariable.id, {
        collectionId: figmaCollection.id,
        modes: figmaCollection.modes,
      });
      
      // Convert variable modes
      const modes: Mode[] = [];
      
      Object.entries(figmaVariable.valuesByMode).forEach(([modeId, value]) => {
        // Find the mode name from the collection
        const modeInfo = figmaCollection.modes.find((m) => m.modeId === modeId);
        const modeName = modeInfo ? modeInfo.name : modeId;
        
        let modeValue = convertFigmaNativeValue(value, figmaVariable.resolvedType);
        
        // Store the source mode ID for alias resolution
        if (modeValue.type === 'alias') {
          modeValue = {
            ...modeValue,
            modeId: modeId, // Temporarily store source mode ID
          };
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
      
      // Add variable to graph
      addVariable(graph, internalVariable);
    });
  });
  
  // Step 3: Resolve alias mode IDs
  // For each alias, find the target variable's mode with the same name as the source mode
  graph.aliases.forEach((alias) => {
    const sourceVar = graph.variables.get(alias.sourceVariableId);
    const targetVar = graph.variables.get(alias.targetVariableId);
    
    if (!sourceVar || !targetVar) {
      console.warn(`[FigZig] Alias resolution failed: source or target variable not found`);
      return;
    }
    
    // Find the source mode
    const sourceMode = sourceVar.modes.find((m) => m.id === alias.sourceModeId);
    if (!sourceMode) {
      console.warn(`[FigZig] Alias resolution failed: source mode not found`);
      return;
    }
    
    // Find the target mode with the same name
    const targetMode = targetVar.modes.find((m) => m.name === sourceMode.name);
    
    if (targetMode) {
      alias.targetModeId = targetMode.id;
    } else {
      // Fallback: use first mode of target variable
      console.warn(
        `[FigZig] No matching mode "${sourceMode.name}" found in target variable, using first mode`
      );
      alias.targetModeId = targetVar.modes[0]?.id || '';
    }
  });
  
  return graph;
}

// ============================================================================
// Statistics and Reporting
// ============================================================================

/**
 * Generates statistics about a Figma native export
 */
export function getFigmaNativeStats(data: FigmaNativeExport): {
  collections: number;
  variables: number;
  aliases: number;
  modes: number;
  colorVariables: number;
  floatVariables: number;
  stringVariables: number;
  booleanVariables: number;
} {
  let totalVariables = 0;
  let totalAliases = 0;
  let totalModes = 0;
  let colorVars = 0;
  let floatVars = 0;
  let stringVars = 0;
  let booleanVars = 0;
  
  data.collections.forEach((collection) => {
    totalModes += collection.modes.length;
    totalVariables += collection.variables.length;
    
    collection.variables.forEach((variable) => {
      // Count variable types
      switch (variable.resolvedType) {
        case 'COLOR': colorVars++; break;
        case 'FLOAT': floatVars++; break;
        case 'STRING': stringVars++; break;
        case 'BOOLEAN': booleanVars++; break;
      }
      
      // Count aliases
      Object.values(variable.valuesByMode).forEach((value) => {
        if (isFigmaNativeAlias(value)) {
          totalAliases++;
        }
      });
    });
  });
  
  return {
    collections: data.collections.length,
    variables: totalVariables,
    aliases: totalAliases,
    modes: totalModes,
    colorVariables: colorVars,
    floatVariables: floatVars,
    stringVariables: stringVars,
    booleanVariables: booleanVars,
  };
}
