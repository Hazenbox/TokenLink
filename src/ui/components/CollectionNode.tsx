import React from 'react';
import { Handle, Position } from 'reactflow';

interface CollectionNodeProps {
  data: {
    collection: any;
    label: string;
    collectionType: string;
    variableCount: number;
  };
}

const CollectionNode: React.FC<CollectionNodeProps> = ({ data }) => {
  const typeColors: Record<string, string> = {
    primitive: '#3b82f6',
    semantic: '#8b5cf6',
    interaction: '#f59e0b',
    theme: '#ec4899',
  };

  const bgColor = typeColors[data.collectionType] || '#6b7280';

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '8px',
        background: bgColor + '20',
        border: `2px solid ${bgColor}`,
        minHeight: '100px',
        width: '100%',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: bgColor }} />
      <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#ffffff' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '11px', color: '#999' }}>
        {data.collectionType.toUpperCase()} • {data.variableCount} variables
      </div>
      <Handle type="source" position={Position.Right} style={{ background: bgColor }} />
    </div>
  );
};

export default CollectionNode;
