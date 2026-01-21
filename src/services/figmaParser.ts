import {
  Collection,
  Variable,
  Group,
  Alias,
  Mode,
  detectCollectionType,
  extractGroupName,
  createAliasId,
  ModeMapping,
} from '@models/index';
import { AliasReference } from '../common/types';

/**
 * Raw data from Figma API
 */
interface FigmaCollectionData {
  id: string;
  name: string;
  modes: Array<{ modeId: string; name: string }>;
  variableIds: string[];
}

interface FigmaVariableData {
  id: string;
  name: string;
  collectionId: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  valuesByMode: Record<string, any>;
}

interface ParsedData {
  collections: Collection[];
  variables: Variable[];
  groups: Group[];
  aliases: Alias[];
}

/**
 * Parse raw Figma data into internal models
 */
export function parseFigmaData(
  collectionsData: FigmaCollectionData[],
  variablesData: FigmaVariableData[]
): ParsedData {
  // Parse collections
  const collections = parseCollections(collectionsData);
  
  // Build variable map for quick lookup
  const variableMap = new Map<string, FigmaVariableData>();
  variablesData.forEach(v => variableMap.set(v.id, v));
  
  // Extract groups from variable names
  const groups = extractGroups(variablesData, collections);
  
  // Parse variables
  const variables = parseVariables(variablesData, collections, groups);
  
  // Build aliases
  const aliases = buildAliases(variables, variableMap, collections);
  
  return { collections, variables, groups, aliases };
}

/**
 * Parse collection data
 */
function parseCollections(collectionsData: FigmaCollectionData[]): Collection[] {
  return collectionsData.map(col => ({
    id: col.id,
    name: col.name,
    type: detectCollectionType(col.name),
    modes: col.modes,
    variableIds: col.variableIds,
  }));
}

/**
 * Extract groups from variable naming patterns
 */
function extractGroups(
  variablesData: FigmaVariableData[],
  collections: Collection[]
): Group[] {
  const groupMap = new Map<string, Group>();
  
  variablesData.forEach(variable => {
    const groupName = extractGroupName(variable.name);
    
    if (groupName) {
      const groupId = `${variable.collectionId}::${groupName}`;
      
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, {
          id: groupId,
          name: groupName,
          collectionId: variable.collectionId,
          variableIds: [],
        });
      }
      
      groupMap.get(groupId)!.variableIds.push(variable.id);
    }
  });
  
  return Array.from(groupMap.values());
}

/**
 * Parse variables with modes
 */
function parseVariables(
  variablesData: FigmaVariableData[],
  collections: Collection[],
  groups: Group[]
): Variable[] {
  const collectionMap = new Map(collections.map(c => [c.id, c]));
  const groupMap = new Map(groups.map(g => [g.id, g]));
  
  return variablesData.map(varData => {
    const collection = collectionMap.get(varData.collectionId);
    const groupName = extractGroupName(varData.name);
    const groupId = groupName ? `${varData.collectionId}::${groupName}` : undefined;
    
    // Build modes array
    const modes: Mode[] = [];
    
    if (collection) {
      collection.modes.forEach(modeInfo => {
        const value = varData.valuesByMode[modeInfo.modeId];
        modes.push({
          modeId: modeInfo.modeId,
          name: modeInfo.name,
          value: value,
        });
      });
    }
    
    return {
      id: varData.id,
      name: varData.name,
      collectionId: varData.collectionId,
      groupId: groupId,
      resolvedType: varData.resolvedType,
      modes: modes,
    };
  });
}

/**
 * Build alias relationships
 */
function buildAliases(
  variables: Variable[],
  variableMap: Map<string, FigmaVariableData>,
  collections: Collection[]
): Alias[] {
  const aliases: Alias[] = [];
  const aliasSet = new Set<string>();
  
  variables.forEach(variable => {
    variable.modes.forEach(mode => {
      const value = mode.value;
      
      // Check if value is an alias
      if (isAliasReference(value)) {
        const toVariableId = value.id;
        const aliasId = createAliasId(variable.id, toVariableId);
        
        // Avoid duplicate aliases
        if (aliasSet.has(aliasId)) {
          return;
        }
        aliasSet.add(aliasId);
        
        // Check if target variable exists
        const targetVariable = variables.find(v => v.id === toVariableId);
        const isBroken = !targetVariable;
        
        // Check if cross-collection
        const isCrossCollection = targetVariable
          ? targetVariable.collectionId !== variable.collectionId
          : false;
        
        // Build mode mappings
        const modeMappings: ModeMapping[] = [];
        variable.modes.forEach(fromMode => {
          const fromValue = fromMode.value;
          if (isAliasReference(fromValue) && fromValue.id === toVariableId) {
            // Find corresponding target mode
            if (targetVariable) {
              targetVariable.modes.forEach(toMode => {
                modeMappings.push({
                  fromModeId: fromMode.modeId,
                  toModeId: toMode.modeId,
                  fromModeName: fromMode.name,
                  toModeName: toMode.name,
                });
              });
            }
          }
        });
        
        aliases.push({
          id: aliasId,
          fromVariableId: variable.id,
          toVariableId: toVariableId,
          modeMap: modeMappings,
          isBroken,
          isCrossCollection,
        });
      }
    });
  });
  
  return aliases;
}

/**
 * Type guard for alias references
 */
function isAliasReference(value: any): value is AliasReference {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.type === 'VARIABLE_ALIAS' &&
    typeof value.id === 'string'
  );
}
