import React, { useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useAppSelector } from '../store/hooks';
import CollectionNode from './components/CollectionNode';
import GroupNode from './components/GroupNode';
import VariableNode from './components/VariableNode';

const nodeTypes = {
  collection: CollectionNode,
  group: GroupNode,
  variable: VariableNode,
};

const GraphView: React.FC = () => {
  const graphNodes = useAppSelector(state => state.graph.nodes);
  const graphEdges = useAppSelector(state => state.graph.edges);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);

  // Update local state when Redux state changes
  React.useEffect(() => {
    setNodes(graphNodes);
  }, [graphNodes, setNodes]);

  React.useEffect(() => {
    setEdges(graphEdges);
  }, [graphEdges, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    console.log('Edge clicked:', edge);
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onEdgeClick={onEdgeClick}
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
      minZoom={0.1}
      maxZoom={2}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#2a2a2a" />
      <Controls />
      <MiniMap
        nodeColor={(node) => {
          switch (node.type) {
            case 'collection':
              return '#3b82f6';
            case 'group':
              return '#8b5cf6';
            case 'variable':
              return '#10b981';
            default:
              return '#999';
          }
        }}
        maskColor="rgba(0, 0, 0, 0.6)"
      />
    </ReactFlow>
  );
};

export default GraphView;
