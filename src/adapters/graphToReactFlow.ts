/**
 * Adapter to convert internal VariableGraph to React Flow nodes and edges format
 */

import { Node, Edge } from '@xyflow/react';
import { VariableGraph, getGroupForVariable, getCollectionForGroup } from '../models/graph';
import { Variable, Collection, Group, Mode, Alias } from '../models/types';
import { layoutGraph, CollectionHeaderData } from '../utils/layoutGraph';
import { devLog, devWarn } from '../utils/logger';

export interface VariableNodeData {
  variableId: string;
  variableName: string;
  variableType?: string;
  groupId: string;
  groupName: string;
  collectionId: string;
  collectionName: string;
  collectionType: string;
  modes: Mode[];
  aliasCount: number;
  graph?: VariableGraph;
  proximityHandle?: { handleId: string; isValid: boolean } | null;
  isSelected?: boolean;
  onModeClick?: (modeId: string, event?: React.MouseEvent) => void;
  isModeSelected?: (modeId: string) => boolean;
  onContextMenu?: (event: React.MouseEvent) => void;
  onModeContextMenu?: (event: React.MouseEvent, modeId: string) => void;
}

export interface AliasEdgeData {
  fromVariableId: string;
  toVariableId: string;
  sourceModeId: string;
  targetModeId: string;
  sourceVariableName: string;
  targetVariableName: string;
  sourceModeName: string;
  targetModeName: string;
  sourceCollectionName: string;
  sourceGroupName: string;
  targetCollectionName: string;
  targetGroupName: string;
}

// Re-export for use in other components
export type { CollectionHeaderData };

/**
 * Converts VariableGraph to React Flow nodes and edges
 * Optimized with pre-built index maps for O(1) lookups
 */
export function graphToReactFlow(graph: VariableGraph): {
  nodes: Node<VariableNodeData | CollectionHeaderData>[];
  edges: Edge<AliasEdgeData>[];
} {
  const variableNodes: Node<VariableNodeData>[] = [];
  const edges: Edge<AliasEdgeData>[] = [];
  
  // Pre-build alias index: variableId → aliases[] for O(1) alias lookups
  const aliasIndex = new Map<string, typeof graph.aliases>();
  graph.aliases.forEach(alias => {
    if (!aliasIndex.has(alias.fromVariableId)) {
      aliasIndex.set(alias.fromVariableId, []);
    }
    aliasIndex.get(alias.fromVariableId)!.push(alias);
  });
  
  // Pre-build lookup maps: variableId → group, groupId → collection
  const variableToGroup = new Map<string, Group>();
  const groupToCollection = new Map<string, Collection>();
  
  graph.variables.forEach(variable => {
    const group = getGroupForVariable(graph, variable.id);
    if (group) {
      variableToGroup.set(variable.id, group);
      if (!groupToCollection.has(group.id)) {
        const collection = getCollectionForGroup(graph, group.id);
        if (collection) {
          groupToCollection.set(group.id, collection);
        }
      }
    }
  });
  
  // Track collections and their variable counts
  const collectionData: Map<string, { collection: Collection; count: number }> = new Map();
  
  // Convert variables to nodes (without positions initially)
  graph.variables.forEach((variable) => {
    // Use pre-built maps for O(1) lookups
    const group = variableToGroup.get(variable.id);
    const collection = group ? groupToCollection.get(group.id) : null;
    
    if (!group || !collection) return;
    
    // Track collection data
    if (!collectionData.has(collection.id)) {
      collectionData.set(collection.id, { collection, count: 0 });
    }
    collectionData.get(collection.id)!.count++;
    
    // Count aliases for this variable using pre-built index (O(1) instead of O(n))
    const aliasCount = aliasIndex.get(variable.id)?.length || 0;
    
    variableNodes.push({
      id: variable.id,
      type: 'variable',
      position: { x: 0, y: 0 }, // Will be calculated by layout algorithm
      data: {
        variableId: variable.id,
        variableName: variable.name,
        variableType: variable.variableType || undefined,
        groupId: group.id,
        groupName: group.name,
        collectionId: collection.id,
        collectionName: collection.name,
        collectionType: collection.type,
        modes: variable.modes,
        aliasCount,
      },
    });
  });
  
  // Create collection header nodes
  const collectionHeaders: Node<CollectionHeaderData>[] = [];
  collectionData.forEach(({ collection, count }, collectionId) => {
    collectionHeaders.push({
      id: `header-${collectionId}`,
      type: 'collectionHeader',
      position: { x: 0, y: 0 }, // Will be calculated by layout algorithm
      data: {
        collectionId: collection.id,
        collectionName: collection.name,
        collectionType: collection.type,
        variableCount: count,
      },
      draggable: false,
      selectable: false,
    });
  });
  
  // Apply layout algorithm to calculate positions
  const { positionedNodes, positionedHeaders } = layoutGraph(variableNodes, collectionHeaders);
  
  // Convert aliases to mode-level edges with validation
  devLog('[Token Link] Creating mode-level edges, total aliases:', graph.aliases.length);
  let validEdgesCreated = 0;
  let skippedEdges = 0;
  
  // Create a map of rendered nodes for quick lookup
  const renderedNodeIds = new Set(variableNodes.map(n => n.id));
  
  graph.aliases.forEach((alias, aliasIndex) => {
    // Validate that variables exist in the graph
    const fromVariable = graph.variables.get(alias.fromVariableId);
    const toVariable = graph.variables.get(alias.toVariableId);
    
    if (!fromVariable || !toVariable) {
      devWarn(`[Token Link] Alias ${aliasIndex}: Skipping - variables not found in graph`, {
        fromVariableId: alias.fromVariableId,
        toVariableId: alias.toVariableId,
        fromExists: !!fromVariable,
        toExists: !!toVariable
      });
      skippedEdges++;
      return;
    }
    
    // Validate that nodes are rendered for both variables
    if (!renderedNodeIds.has(alias.fromVariableId)) {
      devWarn(`[Token Link] Alias ${aliasIndex}: Skipping - source node not rendered`, {
        fromVariable: fromVariable.name,
        fromVariableId: alias.fromVariableId
      });
      skippedEdges++;
      return;
    }
    
    if (!renderedNodeIds.has(alias.toVariableId)) {
      devWarn(`[Token Link] Alias ${aliasIndex}: Skipping - target node not rendered`, {
        toVariable: toVariable.name,
        toVariableId: alias.toVariableId
      });
      skippedEdges++;
      return;
    }
    
    // Get actual mode IDs from variables
    const fromModeIds = new Set(fromVariable.modes.map(m => m.id));
    const toModeIds = new Set(toVariable.modes.map(m => m.id));
    
    // Create an edge for each mode mapping in the alias
    Object.entries(alias.modeMap).forEach(([sourceModeId, targetModeId]) => {
      // Validate source mode exists
      if (!fromModeIds.has(sourceModeId)) {
        const fromModeName = fromVariable.modes.find(m => m.id === sourceModeId)?.name || 'unknown';
        devWarn(`[Token Link] Alias ${aliasIndex}: Skipping edge - source mode "${sourceModeId}" (${fromModeName}) not found in variable "${fromVariable.name}"`);
        skippedEdges++;
        return;
      }
      
      // Validate target mode exists
      if (!toModeIds.has(targetModeId)) {
        const availableModes = toVariable.modes.map(m => `${m.name} (${m.id})`).join(', ');
        devWarn(`[Token Link] Alias ${aliasIndex}: Skipping edge - target mode "${targetModeId}" not found in variable "${toVariable.name}". Available modes: ${availableModes}`);
        skippedEdges++;
        return;
      }
      
      // Get mode names for logging
      const sourceModeName = fromVariable.modes.find(m => m.id === sourceModeId)?.name || sourceModeId;
      const targetModeName = toVariable.modes.find(m => m.id === targetModeId)?.name || targetModeId;
      
      // Get group and collection names for source and target using pre-built maps (O(1) lookups)
      const sourceGroup = variableToGroup.get(alias.fromVariableId);
      const targetGroup = variableToGroup.get(alias.toVariableId);
      const sourceCollection = sourceGroup ? groupToCollection.get(sourceGroup.id) : null;
      const targetCollection = targetGroup ? groupToCollection.get(targetGroup.id) : null;
      
      // Create edge with validated handle IDs
      const sourceHandleId = `${alias.fromVariableId}-${sourceModeId}-source`;
      const targetHandleId = `${alias.toVariableId}-${targetModeId}-target`;
      
      const edge = {
        id: `edge-${alias.fromVariableId}-${sourceModeId}-${alias.toVariableId}-${targetModeId}`,
        source: alias.fromVariableId,
        target: alias.toVariableId,
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        type: 'alias',
        animated: false,
        zIndex: 1,
        markerEnd: {
          type: 'arrowclosed' as const,
          width: 20,
          height: 20,
          color: 'rgba(148, 163, 184, 0.4)',
        },
        style: {
          strokeWidth: 1.5,
          stroke: 'rgba(148, 163, 184, 0.4)',
        },
        data: {
          fromVariableId: alias.fromVariableId,
          toVariableId: alias.toVariableId,
          sourceModeId,
          targetModeId,
          sourceVariableName: fromVariable.name,
          targetVariableName: toVariable.name,
          sourceModeName,
          targetModeName,
          sourceCollectionName: sourceCollection?.name || 'Unknown',
          sourceGroupName: sourceGroup?.name || 'Unknown',
          targetCollectionName: targetCollection?.name || 'Unknown',
          targetGroupName: targetGroup?.name || 'Unknown',
        },
      };
      
      devLog(`[Token Link] ✓ Created edge: ${fromVariable.name}.${sourceModeName} → ${toVariable.name}.${targetModeName}`);
      edges.push(edge);
      validEdgesCreated++;
    });
  });
  
  devLog(`[Token Link] Edge creation complete: ${validEdgesCreated} valid edges, ${skippedEdges} skipped`);
  
  // Combine all nodes (headers + variables)
  const allNodes = [...positionedHeaders, ...positionedNodes];
  
  return { nodes: allNodes, edges };
}
