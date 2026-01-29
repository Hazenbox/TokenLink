/**
 * Graph layout utilities for organizing nodes in a systematic column-based layout
 */

import { Node } from '@xyflow/react';
import { VariableNodeData } from '../adapters/graphToReactFlow';

// Layout configuration constants
// These values control the visual layout of the graph
export const LAYOUT_CONFIG = {
  // Column dimensions
  COLUMN_WIDTH: 350,              // Width of each collection column
  COLLECTION_GAP: 100,            // Gap between collection columns
  NODE_HEIGHT: 120,                // Default height of each variable node (for backwards compatibility)
  
  // Dynamic node height configuration
  NODE_BASE_HEIGHT: 100,           // Base height for header + group + padding
  MODE_ROW_HEIGHT: 24,             // Height per mode row
  NODE_PADDING: 16,                // Internal padding
  MIN_NODE_HEIGHT: 120,            // Minimum node height
  MAX_NODE_HEIGHT: 400,            // Maximum node height (scrollable after this)
  
  // Vertical spacing - auto-calculated based on layout
  VERTICAL_SPACING: 30,            // Space between nodes within the same group
  GROUP_SPACING: 80,               // Extra space between different groups in a column
  COLLECTION_HEADER_HEIGHT: 80,   // Estimated height of the collection header node
  HEADER_TO_NODE_GAP: 40,         // Gap between bottom of header and first node
  COLUMN_BOTTOM_PADDING: 100,     // Extra padding at the bottom of columns
  
  // Starting positions
  START_X: 50,                     // X offset for the first column
  START_Y: 0,                      // Y offset for the top of the graph
};

/**
 * Calculate dynamic node height based on mode count
 * @param modeCount - Number of modes in the variable
 * @returns Calculated height in pixels
 */
export function calculateNodeHeight(modeCount: number): number {
  const height = LAYOUT_CONFIG.NODE_BASE_HEIGHT + 
                 (modeCount * LAYOUT_CONFIG.MODE_ROW_HEIGHT) + 
                 LAYOUT_CONFIG.NODE_PADDING;
  return Math.min(Math.max(height, LAYOUT_CONFIG.MIN_NODE_HEIGHT), LAYOUT_CONFIG.MAX_NODE_HEIGHT);
}

export interface CollectionHeaderData {
  collectionId: string;
  collectionName: string;
  collectionType: string;
  variableCount: number;
}

interface NodesByCollection {
  [collectionId: string]: Node<VariableNodeData>[];
}

interface NodesByGroup {
  [groupId: string]: Node<VariableNodeData>[];
}

/**
 * Calculate positions for nodes using a column-based layout
 * Each collection gets its own column, with variables stacked vertically by group
 */
export function layoutGraph(
  nodes: Node<VariableNodeData>[],
  collectionHeaders: Node<CollectionHeaderData>[]
): {
  positionedNodes: Node<VariableNodeData>[];
  positionedHeaders: Node<CollectionHeaderData>[];
} {
  // Group nodes by collection
  const nodesByCollection: NodesByCollection = {};
  nodes.forEach(node => {
    const collectionId = node.data.collectionId;
    if (!nodesByCollection[collectionId]) {
      nodesByCollection[collectionId] = [];
    }
    nodesByCollection[collectionId].push(node);
  });

  // Get sorted collection IDs for consistent column order
  const collectionIds = Object.keys(nodesByCollection).sort((a, b) => {
    // Sort by collection name for alphabetical order
    const nameA = nodes.find(n => n.data.collectionId === a)?.data.collectionName || '';
    const nameB = nodes.find(n => n.data.collectionId === b)?.data.collectionName || '';
    return nameA.localeCompare(nameB);
  });

  const positionedNodes: Node<VariableNodeData>[] = [];
  const positionedHeaders: Node<CollectionHeaderData>[] = [];

  // Layout each collection in its own column
  collectionIds.forEach((collectionId, columnIndex) => {
    const columnX = LAYOUT_CONFIG.START_X + (columnIndex * (LAYOUT_CONFIG.COLUMN_WIDTH + LAYOUT_CONFIG.COLLECTION_GAP));
    const collectionNodes = nodesByCollection[collectionId];

    // Position collection header
    const header = collectionHeaders.find(h => h.data.collectionId === collectionId);
    if (header) {
      positionedHeaders.push({
        ...header,
        position: {
          x: columnX,
          y: LAYOUT_CONFIG.START_Y,
        },
      });
    }

    // Group nodes by group within this collection
    const nodesByGroup: NodesByGroup = {};
    collectionNodes.forEach(node => {
      const groupId = node.data.groupId;
      if (!nodesByGroup[groupId]) {
        nodesByGroup[groupId] = [];
      }
      nodesByGroup[groupId].push(node);
    });

    // Get sorted group IDs for consistent order
    const groupIds = Object.keys(nodesByGroup).sort((a, b) => {
      const nameA = collectionNodes.find(n => n.data.groupId === a)?.data.groupName || '';
      const nameB = collectionNodes.find(n => n.data.groupId === b)?.data.groupName || '';
      return nameA.localeCompare(nameB);
    });

    // Stack nodes vertically, grouped by group
    // Start Y position: header position + header height + gap
    let currentY = LAYOUT_CONFIG.START_Y + LAYOUT_CONFIG.COLLECTION_HEADER_HEIGHT + LAYOUT_CONFIG.HEADER_TO_NODE_GAP;

    groupIds.forEach((groupId, groupIndex) => {
      const groupNodes = nodesByGroup[groupId];

      // Sort nodes within group by name
      groupNodes.sort((a, b) => 
        a.data.variableName.localeCompare(b.data.variableName)
      );

      // Position each node in the group with dynamic heights
      groupNodes.forEach((node, nodeIndex) => {
        positionedNodes.push({
          ...node,
          position: {
            x: columnX,
            y: currentY,
          },
        });
        
        // Calculate dynamic height for this node and advance Y position
        const nodeHeight = calculateNodeHeight(node.data.modes.length);
        currentY += nodeHeight + LAYOUT_CONFIG.VERTICAL_SPACING;
      });
      
      // Add extra spacing between groups (but not after the last group)
      if (groupIndex < groupIds.length - 1) {
        currentY += LAYOUT_CONFIG.GROUP_SPACING;
      }
    });
  });

  return { positionedNodes, positionedHeaders };
}

/**
 * Get collection color based on collection type
 */
export function getCollectionColor(collectionType: string): string {
  const colors: Record<string, string> = {
    primitive: '#10b981', // green
    semantic: '#3b82f6', // blue
    interaction: '#8b5cf6', // purple
    theme: '#f59e0b', // amber
    brand: '#ef4444', // red
  };
  return colors[collectionType] || '#6b7280'; // default gray
}

/**
 * Reorder columns based on a new collection order
 * Recalculates all node positions based on the new order
 */
export function reorderColumns(
  nodes: Node<VariableNodeData>[],
  headers: Node<CollectionHeaderData>[],
  newOrder: string[]  // Array of collection IDs in new order
): {
  positionedNodes: Node<VariableNodeData>[];
  positionedHeaders: Node<CollectionHeaderData>[];
} {
  const positionedNodes: Node<VariableNodeData>[] = [];
  const positionedHeaders: Node<CollectionHeaderData>[] = [];

  // Layout each collection according to new order
  newOrder.forEach((collectionId, columnIndex) => {
    const columnX = LAYOUT_CONFIG.START_X + (columnIndex * (LAYOUT_CONFIG.COLUMN_WIDTH + LAYOUT_CONFIG.COLLECTION_GAP));
    
    // Position collection header
    const header = headers.find(h => h.data.collectionId === collectionId);
    if (header) {
      positionedHeaders.push({
        ...header,
        position: {
          x: columnX,
          y: LAYOUT_CONFIG.START_Y,
        },
      });
    }

    // Get all nodes in this collection
    const collectionNodes = nodes.filter(n => n.data.collectionId === collectionId);

    // Group nodes by group within this collection
    const nodesByGroup: NodesByGroup = {};
    collectionNodes.forEach(node => {
      const groupId = node.data.groupId;
      if (!nodesByGroup[groupId]) {
        nodesByGroup[groupId] = [];
      }
      nodesByGroup[groupId].push(node);
    });

    // Get sorted group IDs
    const groupIds = Object.keys(nodesByGroup).sort((a, b) => {
      const nameA = collectionNodes.find(n => n.data.groupId === a)?.data.groupName || '';
      const nameB = collectionNodes.find(n => n.data.groupId === b)?.data.groupName || '';
      return nameA.localeCompare(nameB);
    });

    // Stack nodes vertically, grouped by group
    // Start Y position: header position + header height + gap
    let currentY = LAYOUT_CONFIG.START_Y + LAYOUT_CONFIG.COLLECTION_HEADER_HEIGHT + LAYOUT_CONFIG.HEADER_TO_NODE_GAP;

    groupIds.forEach((groupId, groupIndex) => {
      const groupNodes = nodesByGroup[groupId];

      // Sort nodes within group by name
      groupNodes.sort((a, b) => 
        a.data.variableName.localeCompare(b.data.variableName)
      );

      // Position each node in the group with dynamic heights
      groupNodes.forEach((node, nodeIndex) => {
        positionedNodes.push({
          ...node,
          position: {
            x: columnX,
            y: currentY,
          },
        });
        
        // Calculate dynamic height for this node and advance Y position
        const nodeHeight = calculateNodeHeight(node.data.modes.length);
        currentY += nodeHeight + LAYOUT_CONFIG.VERTICAL_SPACING;
      });
      
      // Add extra spacing between groups (but not after the last group)
      if (groupIndex < groupIds.length - 1) {
        currentY += LAYOUT_CONFIG.GROUP_SPACING;
      }
    });
  });

  return { positionedNodes, positionedHeaders };
}
