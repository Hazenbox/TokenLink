import React from 'react';
import { Handle, Position } from 'reactflow';

interface GroupNodeProps {
  data: {
    group: any;
    label: string;
    variableCount: number;
  };
}

const GroupNode: React.FC<GroupNodeProps> = ({ data }) => {
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '6px',
        background: '#8b5cf620',
        border: '1px solid #8b5cf6',
        minHeight: '80px',
        width: '100%',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: '#8b5cf6' }} />
      <div style={{ marginBottom: '6px', fontWeight: 500, fontSize: '12px', color: '#ffffff' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '10px', color: '#999' }}>
        {data.variableCount} variables
      </div>
      <Handle type="source" position={Position.Right} style={{ background: '#8b5cf6' }} />
    </div>
  );
};

export default GroupNode;
