import React from 'react';
import { Handle, Position } from 'reactflow';

interface VariableNodeProps {
  data: {
    variable: any;
    label: string;
    fullName: string;
    type: string;
    hasAlias: boolean;
  };
}

const VariableNode: React.FC<VariableNodeProps> = ({ data }) => {
  const typeColors: Record<string, string> = {
    COLOR: '#10b981',
    FLOAT: '#3b82f6',
    STRING: '#f59e0b',
    BOOLEAN: '#ec4899',
  };

  const color = typeColors[data.type] || '#6b7280';

  return (
    <div
      style={{
        padding: '6px 8px',
        borderRadius: '4px',
        background: data.hasAlias ? color + '40' : color + '20',
        border: `1px solid ${color}`,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        color: '#ffffff',
        fontWeight: data.hasAlias ? 600 : 400,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
      title={data.fullName}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: '6px', height: '6px' }}
      />
      {data.label}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, width: '6px', height: '6px' }}
      />
    </div>
  );
};

export default VariableNode;
