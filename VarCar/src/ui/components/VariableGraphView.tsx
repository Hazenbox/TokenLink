/**
 * Main React Flow graph visualization component for variables
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  NodeChange,
  EdgeChange,
  BackgroundVariant,
  ConnectionMode,
  OnConnectStart,
  OnConnectEnd,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { graphToReactFlow, VariableNodeData, CollectionHeaderData } from '../../adapters/graphToReactFlow';
import { VariableGraph } from '../../models/graph';
import { VariableNode } from './nodes/VariableNode';
import { CollectionHeaderNode } from './nodes/CollectionHeaderNode';
import { AliasEdge } from './edges/AliasEdge';
import { ColumnBackground } from './ColumnBackground';
import { ConnectionPreview } from './ConnectionPreview';
import { LAYOUT_CONFIG, reorderColumns, calculateNodeHeight } from '../../utils/layoutGraph';
import { getTargetHandleValidation, validateConnection } from '../utils/connectionValidation';
import { useMultiSelect } from '../hooks/useMultiSelect';

interface VariableGraphViewProps {
  graph: VariableGraph;
  onNodeClick?: (nodeId: string, modeId?: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  onCreateAlias?: (data: {
    sourceVariableId: string;
    sourceModeId: string;
    targetVariableId: string;
    targetModeId: string;
  }) => void;
  onDeleteAlias?: (data: {
    sourceVariableId: string;
    sourceModeId: string;
    targetVariableId: string;
    targetModeId: string;
    sourceVariableName: string;
    sourceModeName: string;
    sourceGroupName: string;
    sourceCollectionName: string;
    targetVariableName: string;
    targetModeName: string;
    targetGroupName: string;
    targetCollectionName: string;
  }) => void;
  onCollectionContextMenu?: (event: React.MouseEvent, collectionId: string) => void;
  onVariableContextMenu?: (event: React.MouseEvent, variableId: string) => void;
  onModeContextMenu?: (event: React.MouseEvent, modeId: string, variableId: string) => void;
  onCanvasContextMenu?: (event: React.MouseEvent) => void;
  multiSelect: ReturnType<typeof useMultiSelect>;
}

const nodeTypes = {
  variable: VariableNode,
  collectionHeader: CollectionHeaderNode,
};

const edgeTypes = {
  alias: AliasEdge,
};

export function VariableGraphView({
  graph,
  onNodeClick,
  onEdgeClick,
  onCreateAlias,
  onDeleteAlias,
  onCollectionContextMenu,
  onVariableContextMenu,
  onModeContextMenu,
  onCanvasContextMenu,
  multiSelect,
}: VariableGraphViewProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => graphToReactFlow(graph),
    [graph]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Connection preview state
  const [connectionState, setConnectionState] = useState<{
    isConnecting: boolean;
    sourceNode: string | null;
    sourceHandle: string | null;
    cursorPosition: { x: number; y: number } | null;
    validTargets: Set<string>;
    invalidTargets: Map<string, string>;
  }>({
    isConnecting: false,
    sourceNode: null,
    sourceHandle: null,
    cursorPosition: null,
    validTargets: new Set(),
    invalidTargets: new Map(),
  });

  const [proximityHandle, setProximityHandle] = useState<{ handleId: string; isValid: boolean } | null>(null);
  
  // Sync React Flow state when graph changes - set nodes first
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);
  
  // Set edges after nodes are mounted to ensure handles exist
  // React Flow will handle missing handles gracefully
  useEffect(() => {
    if (nodes.length === 0) {
      setEdges([]);
      return;
    }
    
    if (initialEdges.length === 0) {
      setEdges([]);
      return;
    }
    
    // Wait for nodes to render, then set edges
    // React Flow will handle invalid edges gracefully (won't render edges with missing handles)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEdges(initialEdges);
      });
    });
  }, [initialEdges, nodes.length]);
  
  // Track column order for reordering
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  
  // Initialize column order from headers
  useEffect(() => {
    const headerNodes = nodes.filter(n => n.type === 'collectionHeader');
    const order = headerNodes
      .sort((a, b) => a.position.x - b.position.x)
      .map(n => (n.data as CollectionHeaderData).collectionId);
    setColumnOrder(order);
  }, [nodes]);
  
  // Handle ESC key to deselect edges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEdges((eds) => eds.map((edge) => ({ ...edge, selected: false })));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setEdges]);
  
  // Constrain node movement to vertical only within their column
  // Note: We keep the position constraint simple to avoid depending on nodes state
  const onNodesChangeHandler = useCallback(
    (changes: NodeChange[]) => {
      // Apply changes directly - React Flow maintains node positions internally
      // The column constraint is enforced by the layout, not by blocking drag
      onNodesChange(changes);
    },
    [onNodesChange]
  );
  
  // Handle connection start
  const onConnectStart: OnConnectStart = useCallback(
    (event, { nodeId, handleId, handleType }) => {
      if (!handleId) return;

      const { validTargets, invalidTargets } = getTargetHandleValidation(handleId, graph);
      
      setConnectionState({
        isConnecting: true,
        sourceNode: nodeId || null,
        sourceHandle: handleId,
        cursorPosition: null,
        validTargets,
        invalidTargets,
      });
    },
    [graph]
  );

  // Handle connection end
  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      setConnectionState({
        isConnecting: false,
        sourceNode: null,
        sourceHandle: null,
        cursorPosition: null,
        validTargets: new Set(),
        invalidTargets: new Map(),
      });
      setProximityHandle(null);
    },
    []
  );

  // Track mouse movement during connection
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (connectionState.isConnecting) {
        setConnectionState(prev => ({
          ...prev,
          cursorPosition: { x: event.clientX, y: event.clientY },
        }));
      }
    },
    [connectionState.isConnecting]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Enable drag-and-drop alias creation between modes
      if (!params.sourceHandle || !params.targetHandle || !onCreateAlias) {
        return;
      }

      // Parse handle IDs: "${variableId}-${modeId}-source/target"
      const parseHandle = (handle: string): { variableId: string; modeId: string } | null => {
        const parts = handle.split('-');
        if (parts.length < 3) return null;
        
        // Last part is "source" or "target"
        // Second to last is the mode ID
        const modeId = parts[parts.length - 2];
        // Everything before is the variable ID
        const variableId = parts.slice(0, -2).join('-');
        
        return { variableId, modeId };
      };

      const source = parseHandle(params.sourceHandle);
      const target = parseHandle(params.targetHandle);

      if (!source || !target) {
        console.error('[FigZig] Failed to parse handle IDs:', params);
        return;
      }

      // Validate connection before creating
      const validation = validateConnection(params.sourceHandle, params.targetHandle, graph);
      if (!validation.isValid) {
        console.warn('[FigZig] Connection validation failed:', validation.reason);
        // The visual feedback during drag already showed this was invalid
        return;
      }

      // Trigger alias creation
      onCreateAlias({
        sourceVariableId: source.variableId,
        sourceModeId: source.modeId,
        targetVariableId: target.variableId,
        targetModeId: target.modeId,
      });
    },
    [onCreateAlias, graph]
  );
  
  // Handle edge deletion
  const onEdgesChangeHandler = useCallback(
    (changes: EdgeChange[]) => {
      // Find any remove changes (edge deletion)
      const removeChanges = changes.filter(c => c.type === 'remove');
      
      removeChanges.forEach(change => {
        const edge = edges.find(e => e.id === change.id);
        if (edge?.data && onDeleteAlias) {
          console.log('[FigZig] Edge deletion detected:', edge.id);
          
          // Extract alias info from edge data
          const { fromVariableId, toVariableId, sourceModeId, targetModeId,
                  sourceVariableName, targetVariableName, sourceModeName, targetModeName } = edge.data;
          
          // Get collection and group information from graph (using Map.get() instead of find())
          const sourceVariable = graph.variables.get(fromVariableId);
          const targetVariable = graph.variables.get(toVariableId);
          
          if (sourceVariable && targetVariable) {
            const sourceGroup = graph.groups.get(sourceVariable.groupId);
            const targetGroup = graph.groups.get(targetVariable.groupId);
            const sourceCollection = sourceGroup ? graph.collections.get(sourceGroup.collectionId) : undefined;
            const targetCollection = targetGroup ? graph.collections.get(targetGroup.collectionId) : undefined;
            
            // Trigger alias deletion with full context
            onDeleteAlias({
              sourceVariableId: fromVariableId,
              sourceModeId,
              targetVariableId: toVariableId,
              targetModeId,
              sourceVariableName,
              sourceModeName,
              sourceGroupName: sourceGroup?.name || '',
              sourceCollectionName: sourceCollection?.name || 'Unknown',
              targetVariableName,
              targetModeName,
              targetGroupName: targetGroup?.name || '',
              targetCollectionName: targetCollection?.name || 'Unknown',
            });
          }
        }
      });
      
      // Let React Flow handle the edge removal in UI
      onEdgesChange(changes);
    },
    [edges, graph, onEdgesChange, onDeleteAlias]
  );
  
  const onNodeClickHandler = useCallback(
    (event: React.MouseEvent, node: Node<VariableNodeData | CollectionHeaderData>) => {
      // Only trigger click for variable nodes, not collection headers
      if (node.type === 'variable') {
        const isMultiSelect = event.metaKey || event.ctrlKey;
        
        if (isMultiSelect) {
          // Multi-select mode: toggle node selection
          multiSelect.toggleNodeSelection(node.id, true);
        } else {
          // Single-select mode: clear other selections and trigger click
          multiSelect.clearSelection();
          onNodeClick?.(node.id);
        }
      }
    },
    [onNodeClick, multiSelect]
  );
  
  const onEdgeClickHandler = useCallback(
    (event: React.MouseEvent, edge: any) => {
      console.log('[FigZig] Edge clicked:', edge.id);
      onEdgeClick?.(edge.id);
    },
    [onEdgeClick]
  );
  
  // Handle column reordering
  const handleColumnReorder = useCallback((collectionId: string, direction: 'left' | 'right') => {
    setColumnOrder(prevOrder => {
      const currentIndex = prevOrder.indexOf(collectionId);
      if (currentIndex === -1) return prevOrder;
      
      const newIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prevOrder.length) return prevOrder;
      
      // Swap columns in order
      const newOrder = [...prevOrder];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      
      // Update nodes with new positions using functional update
      setNodes(prevNodes => {
        const variableNodes = prevNodes.filter(n => n.type === 'variable') as Node<VariableNodeData>[];
        const headerNodes = prevNodes.filter(n => n.type === 'collectionHeader') as Node<CollectionHeaderData>[];
        
        const { positionedNodes, positionedHeaders } = reorderColumns(variableNodes, headerNodes, newOrder);
        
        return [...positionedHeaders, ...positionedNodes];
      });
      
      return newOrder;
    });
  }, []);
  
  // Enhance nodes with callbacks and connection state
  const enhancedNodes = useMemo(() => {
    return nodes.map(node => {
      if (node.type === 'collectionHeader') {
        const headerData = node.data as CollectionHeaderData;
        const currentIndex = columnOrder.indexOf(headerData.collectionId);
        return {
          ...node,
          data: {
            ...headerData,
            onMoveLeft: () => handleColumnReorder(headerData.collectionId, 'left'),
            onMoveRight: () => handleColumnReorder(headerData.collectionId, 'right'),
            canMoveLeft: currentIndex > 0,
            canMoveRight: currentIndex < columnOrder.length - 1,
            onContextMenu: (e: React.MouseEvent) => {
              onCollectionContextMenu?.(e, headerData.collectionId);
            },
          },
        };
      }
      if (node.type === 'variable') {
        const variableData = node.data as VariableNodeData;
        const isSelected = multiSelect.isNodeSelected(node.id);
        return {
          ...node,
          data: {
            ...variableData,
            graph: graph,
            proximityHandle: proximityHandle,
            isSelected: isSelected,
            onModeClick: (modeId: string, event?: React.MouseEvent) => {
              if (event && (event.metaKey || event.ctrlKey)) {
                // Multi-select mode click
                multiSelect.toggleModeSelection(node.id, modeId, true);
              } else {
                onNodeClick?.(node.id, modeId);
              }
            },
            isModeSelected: (modeId: string) => multiSelect.isModeSelected(node.id, modeId),
            onContextMenu: (e: React.MouseEvent) => {
              onVariableContextMenu?.(e, node.id);
            },
            onModeContextMenu: (e: React.MouseEvent, modeId: string) => {
              onModeContextMenu?.(e, modeId, node.id);
            },
          },
        };
      }
      return node;
    });
  }, [nodes, columnOrder, proximityHandle, handleColumnReorder, onNodeClick, onCollectionContextMenu, onVariableContextMenu, onModeContextMenu, graph]);
  
  // Calculate column data for background rendering
  const columnData = useMemo(() => {
    const collections = new Map<string, {
      collectionId: string;
      collectionName: string;
      collectionType: string;
      x: number;
      width: number;
      height: number;
      groupSeparators?: number[];
    }>();
    
    // First pass: collect column info and initialize tracking
    const columnBounds = new Map<string, { minY: number; maxY: number }>();
    
    enhancedNodes.forEach(node => {
      if (node.type === 'collectionHeader') {
        const headerData = node.data as CollectionHeaderData;
        collections.set(headerData.collectionId, {
          collectionId: headerData.collectionId,
          collectionName: headerData.collectionName,
          collectionType: headerData.collectionType,
          x: node.position.x - 35, // Center header cards in column (280px card in 350px column = 35px padding each side)
          width: LAYOUT_CONFIG.COLUMN_WIDTH,
          height: 0, // Will be calculated
          groupSeparators: [],
        });
        // Initialize bounds with header position
        columnBounds.set(headerData.collectionId, {
          minY: node.position.y,
          maxY: node.position.y + LAYOUT_CONFIG.COLLECTION_HEADER_HEIGHT,
        });
      }
    });
    
    // Second pass: calculate bounds based on all nodes in each column AND group boundaries
    const groupBounds = new Map<string, Map<string, { minY: number; maxY: number }>>();
    
    enhancedNodes.forEach(node => {
      if (node.type === 'variable') {
        const variableData = node.data as VariableNodeData;
        const bounds = columnBounds.get(variableData.collectionId);
        if (bounds) {
          // Calculate dynamic node height based on mode count
          const nodeHeight = calculateNodeHeight(variableData.modes.length);
          const nodeBottomY = node.position.y + nodeHeight;
          bounds.maxY = Math.max(bounds.maxY, nodeBottomY);
          bounds.minY = Math.min(bounds.minY, node.position.y);
          
          // Track group boundaries
          if (!groupBounds.has(variableData.collectionId)) {
            groupBounds.set(variableData.collectionId, new Map());
          }
          const collectionGroups = groupBounds.get(variableData.collectionId)!;
          const groupBound = collectionGroups.get(variableData.groupId);
          if (groupBound) {
            groupBound.maxY = Math.max(groupBound.maxY, nodeBottomY);
            groupBound.minY = Math.min(groupBound.minY, node.position.y);
          } else {
            collectionGroups.set(variableData.groupId, {
              minY: node.position.y,
              maxY: nodeBottomY,
            });
          }
        }
      }
    });
    
    // Calculate individual height for each column and group separators
    collections.forEach((col, collectionId) => {
      const bounds = columnBounds.get(collectionId);
      if (bounds) {
        // Height is from top of column (header start) to bottom of last node + padding
        col.height = bounds.maxY - bounds.minY + LAYOUT_CONFIG.COLUMN_BOTTOM_PADDING;
        
        // Calculate group separator positions
        const collectionGroups = groupBounds.get(collectionId);
        if (collectionGroups && collectionGroups.size > 1) {
          const sortedGroups = Array.from(collectionGroups.values()).sort((a, b) => a.minY - b.minY);
          col.groupSeparators = [];
          for (let i = 0; i < sortedGroups.length - 1; i++) {
            // Add separator at the midpoint between group end and next group start
            const separatorY = sortedGroups[i].maxY + (sortedGroups[i + 1].minY - sortedGroups[i].maxY) / 2;
            col.groupSeparators.push(separatorY);
          }
        }
      } else {
        // Fallback for empty columns
        col.height = LAYOUT_CONFIG.COLLECTION_HEADER_HEIGHT + LAYOUT_CONFIG.COLUMN_BOTTOM_PADDING;
      }
    });
    
    return Array.from(collections.values());
  }, [enhancedNodes]);
  
  const selectionCount = multiSelect.getSelectionCount();

  return (
    <div 
      style={{ width: '100%', height: '100%', position: 'relative', background: '#0D0D0D', overflow: 'hidden' }}
      onMouseMove={handleMouseMove}
    >
      {/* Selection count badge */}
      {selectionCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(139, 126, 255, 0.95)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(139, 126, 255, 0.4)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>{selectionCount} selected</span>
          <button
            onClick={() => multiSelect.clearSelection()}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '14px',
              color: 'white',
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}
      
      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClickHandler}
        onEdgeClick={onEdgeClickHandler}
        onPaneClick={() => {
          setEdges((eds) => eds.map((edge) => ({ ...edge, selected: false })));
          multiSelect.clearSelection();
        }}
        onPaneContextMenu={(event) => {
          event.preventDefault();
          onCanvasContextMenu?.(event);
        }}
        noDragClassName="nodrag"
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        connectionLineStyle={{ display: 'none' }}
        fitView
        fitViewOptions={{ 
          padding: 0.15,
          minZoom: 0.1,
          maxZoom: 1,
        }}
        minZoom={0.05}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'alias',
          animated: false,
          markerEnd: {
            type: 'arrowclosed',
            width: 20,
            height: 20,
            color: 'rgba(148, 163, 184, 0.4)',
          },
          style: { 
            strokeWidth: 1.5,
            stroke: 'rgba(148, 163, 184, 0.4)',
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <ColumnBackground columns={columnData} />
        <Background 
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.0}
          color="#505050"
        />
        <Controls 
          showInteractive={false}
          style={{
            button: {
              backgroundColor: 'rgba(20, 20, 25, 0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: 'none',
              borderRadius: '10px',
              color: '#e8e8ea',
            },
          }}
        />
        <MiniMap 
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            if (node.type === 'collectionHeader') return '#8b7eff';
            return '#5ba4fc';
          }}
          style={{
            backgroundColor: 'rgba(20, 20, 25, 0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: 'none',
            borderRadius: '12px',
          }}
        />
        
        {/* Connection Preview - Inside ReactFlow for context access */}
        {connectionState.isConnecting && (
          <ConnectionPreview
            sourceNode={connectionState.sourceNode}
            sourceHandle={connectionState.sourceHandle}
            cursorPosition={connectionState.cursorPosition}
            validTargets={connectionState.validTargets}
            invalidTargets={connectionState.invalidTargets}
            onTargetProximity={(handleId, isValid) => {
              setProximityHandle(handleId ? { handleId, isValid } : null);
            }}
          />
        )}
      </ReactFlow>
    </div>
  );
}
