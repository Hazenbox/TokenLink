/**
 * Custom React Flow node component for variables with mode-level granularity
 */

import React, { useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { VariableNodeData } from '../../../adapters/graphToReactFlow';
import { getCollectionColor } from '../../../utils/layoutGraph';
import { ModeNode } from './ModeNode';

export function VariableNode({ data, selected }: NodeProps<VariableNodeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const [infoHovered, setInfoHovered] = useState(false);
  const accentColor = getCollectionColor(data.collectionType);
  const isNodeSelected = data.isSelected || selected;

  const handleModeClick = (modeId: string, event?: React.MouseEvent) => {
    // Call the callback from data if it exists
    if (data.onModeClick) {
      data.onModeClick(modeId, event);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.onContextMenu) {
      data.onContextMenu(e);
    }
  };

  const handleModeContextMenu = (modeId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (data.onModeContextMenu) {
      data.onModeContextMenu(e, modeId);
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onContextMenu={handleContextMenu}
      style={{
        background: isNodeSelected ? 'rgba(139, 126, 255, 0.08)' : 'var(--card-bg)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: isNodeSelected ? `2px solid ${accentColor}` : `1px solid var(--card-stroke)`,
        borderRadius: '16px',
        padding: '16px 18px',
        minWidth: '240px',
        maxWidth: '280px',
        maxHeight: '400px',
        boxShadow: isNodeSelected
          ? `0 0 0 2px ${accentColor}40, 0 4px 16px rgba(139, 126, 255, 0.2)`
          : 'none',
        cursor: 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {/* Header with Variable name and Info icon */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '8px',
      }}>
        <div 
          style={{ 
            fontWeight: 700, 
            fontSize: '14px',
            color: 'var(--text-color)',
            letterSpacing: '-0.01em',
            lineHeight: '1.4',
            flex: 1,
            paddingRight: '8px',
          }}
        >
          {data.variableName}
        </div>
        
        {/* Info icon with hover tooltip */}
        <div
          style={{ position: 'relative' }}
          onMouseEnter={() => setInfoHovered(true)}
          onMouseLeave={() => setInfoHovered(false)}
        >
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              border: `1.5px solid var(--text-secondary)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'help',
              flexShrink: 0,
            }}
          >
            i
          </div>
          
          {/* Info tooltip */}
          {infoHovered && (
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '24px',
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px 10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 1000,
                whiteSpace: 'nowrap',
                fontSize: '11px',
                pointerEvents: 'none',
              }}
            >
              {data.variableType && (
                <div style={{ marginBottom: '4px', color: 'var(--text-color)' }}>
                  <strong>Type:</strong> {data.variableType}
                </div>
              )}
              <div style={{ marginBottom: '4px', color: 'var(--text-color)' }}>
                <strong>Modes:</strong> {data.modes.length}
              </div>
              {data.aliasCount > 0 && (
                <div style={{ color: 'var(--text-color)' }}>
                  <strong>Aliases:</strong> {data.aliasCount}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Group name */}
      <div 
        style={{ 
          fontSize: '11px', 
          color: 'var(--text-secondary)', 
          marginBottom: '12px',
          fontWeight: 500,
        }}
      >
        {data.groupName}
      </div>
      
      {/* Separator */}
      <div style={{
        height: '1px',
        background: 'var(--border-color)',
        marginBottom: '10px',
      }} />
      
      {/* Mode nodes container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        maxHeight: '250px',
        overflowY: 'auto',
        overflowX: 'visible',
        overflow: 'visible',
        paddingLeft: '24px',
        paddingRight: '24px',
        marginLeft: '-24px',
        marginRight: '-24px',
      }}>
        {data.modes.map((mode) => (
          <ModeNode
            key={mode.id}
            mode={mode}
            graph={data.graph}
            variableId={data.variableId}
            variableName={data.variableName}
            collectionName={data.collectionName}
            accentColor={accentColor}
            proximityHandle={data.proximityHandle}
            isSelected={data.isModeSelected ? data.isModeSelected(mode.id) : false}
            onModeClick={(event) => handleModeClick(mode.id, event)}
            onContextMenu={handleModeContextMenu(mode.id)}
          />
        ))}
      </div>
    </div>
  );
}
