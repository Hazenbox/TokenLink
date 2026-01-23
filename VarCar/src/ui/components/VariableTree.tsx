/**
 * VariableTree Component
 * Renders a hierarchical tree view: Collection → Group → Variable → Modes
 */

import React, { useState } from 'react';

// ============================================================================
// Type Definitions
// ============================================================================

interface Collection {
  id: string;
  name: string;
  type: string;
}

interface Group {
  id: string;
  name: string;
  collectionId: string;
}

interface Mode {
  id: string;
  name: string;
  value: {
    type: 'value' | 'alias';
    value?: string | number | boolean;
    variableId?: string;
    modeId?: string;
  };
}

interface Variable {
  id: string;
  name: string;
  groupId: string;
  variableType?: string;
  modes: Mode[];
}

interface GraphData {
  collections: Collection[];
  groups: Group[];
  variables: Variable[];
  aliases: any[];
}

interface VariableTreeProps {
  data: GraphData;
  onCollectionContextMenu?: (event: React.MouseEvent, collectionId: string) => void;
  onGroupContextMenu?: (event: React.MouseEvent, groupId: string) => void;
  onVariableContextMenu?: (event: React.MouseEvent, variableId: string) => void;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format a mode value for display
 */
function formatModeValue(mode: Mode, variables: Variable[]): string {
  if (mode.value.type === 'alias') {
    // Find the aliased variable
    const targetVariable = variables.find(v => v.id === mode.value.variableId);
    if (targetVariable) {
      return `→ ${targetVariable.name}`;
    }
    return `→ [${mode.value.variableId}]`;
  }
  
  // Direct value
  const value = mode.value.value;
  
  if (typeof value === 'string') {
    // Check if it's a color hex
    if (value.startsWith('#')) {
      return value;
    }
    return `"${value}"`;
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  return String(value);
}

/**
 * Get color preview for color values
 */
function getColorPreview(mode: Mode): string | null {
  if (mode.value.type === 'value' && typeof mode.value.value === 'string') {
    const value = mode.value.value;
    if (value.startsWith('#')) {
      return value;
    }
  }
  return null;
}

// ============================================================================
// Tree Node Components
// ============================================================================

/**
 * Mode Node (Level 4 - Leaf)
 */
const ModeNode: React.FC<{ mode: Mode; variables: Variable[] }> = ({ mode, variables }) => {
  const colorPreview = getColorPreview(mode);
  const formattedValue = formatModeValue(mode, variables);
  const isAlias = mode.value.type === 'alias';
  
  return (
    <div
      style={{
        padding: '4px 8px 4px 60px',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <span style={{ color: '#999', minWidth: '60px' }}>{mode.name}:</span>
      {colorPreview && (
        <div
          style={{
            width: '16px',
            height: '16px',
            backgroundColor: colorPreview,
            border: '1px solid #ddd',
            borderRadius: '3px',
          }}
        />
      )}
      <span
        style={{
          color: isAlias ? '#18a0fb' : '#333',
          fontFamily: isAlias ? 'inherit' : 'monospace',
        }}
      >
        {formattedValue}
      </span>
    </div>
  );
};

/**
 * Variable Node (Level 3)
 */
const VariableNode: React.FC<{ 
  variable: Variable; 
  variables: Variable[];
  onContextMenu?: (event: React.MouseEvent, variableId: string) => void;
}> = ({ 
  variable, 
  variables,
  onContextMenu
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasMultipleModes = variable.modes.length > 1;
  const icon = hasMultipleModes ? (isExpanded ? '▼' : '▶') : '•';
  
  return (
    <div>
      <div
        style={{
          padding: '4px 8px 4px 44px',
          fontSize: '13px',
          cursor: hasMultipleModes ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isExpanded ? '#f9f9f9' : 'transparent',
        }}
        onClick={() => hasMultipleModes && setIsExpanded(!isExpanded)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu?.(e, variable.id);
        }}
        onMouseEnter={(e) => {
          if (hasMultipleModes) {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded && hasMultipleModes) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <span style={{ color: '#999', fontSize: '10px', width: '10px' }}>{icon}</span>
        <span style={{ fontWeight: 500, color: '#333' }}>{variable.name}</span>
        {variable.variableType && (
          <span
            style={{
              fontSize: '10px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {variable.variableType}
          </span>
        )}
        <span style={{ color: '#999', fontSize: '11px' }}>
          ({variable.modes.length} mode{variable.modes.length !== 1 ? 's' : ''})
        </span>
      </div>
      
      {isExpanded && (
        <div>
          {variable.modes.map((mode) => (
            <ModeNode key={mode.id} mode={mode} variables={variables} />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Group Node (Level 2)
 */
const GroupNode: React.FC<{ 
  group: Group; 
  variables: Variable[];
  allVariables: Variable[];
  onGroupContextMenu?: (event: React.MouseEvent, groupId: string) => void;
  onVariableContextMenu?: (event: React.MouseEvent, variableId: string) => void;
}> = ({ group, variables: groupVariables, allVariables, onGroupContextMenu, onVariableContextMenu }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div>
      <div
        style={{
          padding: '6px 8px 6px 28px',
          fontSize: '13px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: isExpanded ? '#f0f7ff' : 'transparent',
          borderLeft: isExpanded ? '2px solid #18a0fb' : '2px solid transparent',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onGroupContextMenu?.(e, group.id);
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        <span style={{ color: '#666', fontSize: '12px' }}>{isExpanded ? '▼' : '▶'}</span>
        <span style={{ fontWeight: 600, color: '#444' }}>{group.name}</span>
        <span style={{ color: '#999', fontSize: '11px' }}>
          ({groupVariables.length} variable{groupVariables.length !== 1 ? 's' : ''})
        </span>
      </div>
      
      {isExpanded && (
        <div>
          {groupVariables.map((variable) => (
            <VariableNode 
              key={variable.id} 
              variable={variable} 
              variables={allVariables}
              onContextMenu={onVariableContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Collection Node (Level 1)
 */
const CollectionNode: React.FC<{ 
  collection: Collection; 
  groups: Group[];
  variables: Variable[];
  onCollectionContextMenu?: (event: React.MouseEvent, collectionId: string) => void;
  onGroupContextMenu?: (event: React.MouseEvent, groupId: string) => void;
  onVariableContextMenu?: (event: React.MouseEvent, variableId: string) => void;
}> = ({ collection, groups: collectionGroups, variables, onCollectionContextMenu, onGroupContextMenu, onVariableContextMenu }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Count total variables in this collection
  const totalVariables = collectionGroups.reduce((sum, group) => {
    const groupVars = variables.filter(v => v.groupId === group.id);
    return sum + groupVars.length;
  }, 0);
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div
        style={{
          padding: '10px 12px',
          fontSize: '14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: isExpanded ? '#e6f4ff' : '#f9f9f9',
          border: '1px solid',
          borderColor: isExpanded ? '#91d5ff' : '#e5e5e5',
          borderRadius: '6px',
          fontWeight: 600,
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCollectionContextMenu?.(e, collection.id);
        }}
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
            e.currentTarget.style.borderColor = '#d5d5d5';
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.backgroundColor = '#f9f9f9';
            e.currentTarget.style.borderColor = '#e5e5e5';
          }
        }}
      >
        <span style={{ color: '#18a0fb', fontSize: '14px' }}>{isExpanded ? '▼' : '▶'}</span>
        <span style={{ color: '#333' }}>{collection.name}</span>
        <span
          style={{
            fontSize: '10px',
            color: '#fff',
            backgroundColor: '#18a0fb',
            padding: '2px 6px',
            borderRadius: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {collection.type}
        </span>
        <span style={{ color: '#999', fontSize: '12px', marginLeft: 'auto' }}>
          {collectionGroups.length} group{collectionGroups.length !== 1 ? 's' : ''} • {totalVariables} variable{totalVariables !== 1 ? 's' : ''}
        </span>
      </div>
      
      {isExpanded && (
        <div style={{ marginTop: '4px', paddingLeft: '4px' }}>
          {collectionGroups.map((group) => {
            const groupVariables = variables.filter(v => v.groupId === group.id);
            return (
              <GroupNode 
                key={group.id} 
                group={group} 
                variables={groupVariables}
                allVariables={variables}
                onGroupContextMenu={onGroupContextMenu}
                onVariableContextMenu={onVariableContextMenu}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Tree Component
// ============================================================================

const VariableTree: React.FC<VariableTreeProps> = ({ 
  data, 
  onCollectionContextMenu,
  onGroupContextMenu,
  onVariableContextMenu
}) => {
  const { collections, groups, variables } = data;
  
  if (collections.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: '#999',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
        <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
          No variable collections found
        </div>
        <div style={{ fontSize: '12px', color: '#bbb' }}>
          Create a variable collection in this Figma file to see it here
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '16px' }}>
      {collections.map((collection) => {
        const collectionGroups = groups.filter(g => g.collectionId === collection.id);
        return (
          <CollectionNode
            key={collection.id}
            collection={collection}
            groups={collectionGroups}
            variables={variables}
            onCollectionContextMenu={onCollectionContextMenu}
            onGroupContextMenu={onGroupContextMenu}
            onVariableContextMenu={onVariableContextMenu}
          />
        );
      })}
    </div>
  );
};

export default VariableTree;
