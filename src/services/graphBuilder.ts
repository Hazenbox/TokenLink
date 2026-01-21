import { Node, Edge, MarkerType } from 'reactflow';
import { Collection, Variable, Group, Alias } from '@models/index';

/**
 * Build React Flow graph from internal models
 */
export function buildGraph(
  collections: Collection[],
  variables: Variable[],
  groups: Group[],
  aliases: Alias[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Build nodes
  const collectionNodes = buildCollectionNodes(collections);
  const groupNodes = buildGroupNodes(groups, collections);
  const variableNodes = buildVariableNodes(variables, groups, collections);
  
  nodes.push(...collectionNodes, ...groupNodes, ...variableNodes);
  
  // Build edges from aliases
  const aliasEdges = buildAliasEdges(aliases);
  edges.push(...aliasEdges);
  
  return { nodes, edges };
}

/**
 * Build collection nodes
 */
function buildCollectionNodes(collections: Collection[]): Node[] {
  return collections.map((collection, index) => ({
    id: `collection-${collection.id}`,
    type: 'collection',
    data: {
      collection,
      label: collection.name,
      collectionType: collection.type,
      variableCount: collection.variableIds.length,
    },
    position: {
      x: index * 400,
      y: 0,
    },
    style: {
      width: 350,
      minHeight: 100,
    },
  }));
}

/**
 * Build group nodes
 */
function buildGroupNodes(groups: Group[], collections: Collection[]): Node[] {
  const collectionGroupMap = new Map<string, Group[]>();
  
  // Group by collection
  groups.forEach(group => {
    if (!collectionGroupMap.has(group.collectionId)) {
      collectionGroupMap.set(group.collectionId, []);
    }
    collectionGroupMap.get(group.collectionId)!.push(group);
  });
  
  const nodes: Node[] = [];
  let collectionIndex = 0;
  
  collections.forEach(collection => {
    const collectionGroups = collectionGroupMap.get(collection.id) || [];
    
    collectionGroups.forEach((group, groupIndex) => {
      nodes.push({
        id: `group-${group.id}`,
        type: 'group',
        data: {
          group,
          label: group.name,
          variableCount: group.variableIds.length,
        },
        position: {
          x: collectionIndex * 400 + 20,
          y: 150 + groupIndex * 120,
        },
        parentNode: `collection-${collection.id}`,
        extent: 'parent' as const,
        style: {
          width: 310,
          minHeight: 80,
        },
      });
    });
    
    collectionIndex++;
  });
  
  return nodes;
}

/**
 * Build variable nodes
 */
function buildVariableNodes(
  variables: Variable[],
  groups: Group[],
  collections: Collection[]
): Node[] {
  const groupVariableMap = new Map<string, Variable[]>();
  const ungroupedVariables = new Map<string, Variable[]>();
  
  // Organize variables by group or collection
  variables.forEach(variable => {
    if (variable.groupId) {
      if (!groupVariableMap.has(variable.groupId)) {
        groupVariableMap.set(variable.groupId, []);
      }
      groupVariableMap.get(variable.groupId)!.push(variable);
    } else {
      if (!ungroupedVariables.has(variable.collectionId)) {
        ungroupedVariables.set(variable.collectionId, []);
      }
      ungroupedVariables.get(variable.collectionId)!.push(variable);
    }
  });
  
  const nodes: Node[] = [];
  
  // Variables in groups
  groups.forEach(group => {
    const groupVars = groupVariableMap.get(group.id) || [];
    
    groupVars.forEach((variable, varIndex) => {
      nodes.push({
        id: `variable-${variable.id}`,
        type: 'variable',
        data: {
          variable,
          label: variable.name.split('/').pop() || variable.name,
          fullName: variable.name,
          type: variable.resolvedType,
          hasAlias: variable.modes.some(m => isAlias(m.value)),
        },
        position: {
          x: 10 + (varIndex % 3) * 95,
          y: 30 + Math.floor(varIndex / 3) * 35,
        },
        parentNode: `group-${group.id}`,
        extent: 'parent' as const,
        style: {
          width: 90,
          height: 30,
          fontSize: 10,
        },
      });
    });
  });
  
  // Ungrouped variables
  let collectionIndex = 0;
  collections.forEach(collection => {
    const ungrouped = ungroupedVariables.get(collection.id) || [];
    
    ungrouped.forEach((variable, varIndex) => {
      nodes.push({
        id: `variable-${variable.id}`,
        type: 'variable',
        data: {
          variable,
          label: variable.name,
          fullName: variable.name,
          type: variable.resolvedType,
          hasAlias: variable.modes.some(m => isAlias(m.value)),
        },
        position: {
          x: 20 + (varIndex % 3) * 100,
          y: 120 + Math.floor(varIndex / 3) * 40,
        },
        parentNode: `collection-${collection.id}`,
        extent: 'parent' as const,
        style: {
          width: 95,
          height: 35,
          fontSize: 11,
        },
      });
    });
    
    collectionIndex++;
  });
  
  return nodes;
}

/**
 * Build alias edges
 */
function buildAliasEdges(aliases: Alias[]): Edge[] {
  return aliases.map(alias => {
    let edgeColor = '#999';
    let edgeStyle = 'solid';
    
    // Broken aliases are red
    if (alias.isBroken) {
      edgeColor = '#ef4444';
      edgeStyle = 'dashed';
    }
    // Cross-collection aliases are blue
    else if (alias.isCrossCollection) {
      edgeColor = '#3b82f6';
    }
    
    return {
      id: alias.id,
      source: `variable-${alias.fromVariableId}`,
      target: `variable-${alias.toVariableId}`,
      type: 'smoothstep',
      animated: alias.isBroken || alias.isCrossCollection,
      style: {
        stroke: edgeColor,
        strokeWidth: 2,
        strokeDasharray: edgeStyle === 'dashed' ? '5,5' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: edgeColor,
        width: 20,
        height: 20,
      },
      data: {
        alias,
        isBroken: alias.isBroken,
        isCrossCollection: alias.isCrossCollection,
      },
    };
  });
}

/**
 * Check if a value is an alias
 */
function isAlias(value: any): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.type === 'VARIABLE_ALIAS'
  );
}
