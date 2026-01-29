/**
 * Portal-based tooltip component for edges
 * Renders outside React Flow canvas to maintain constant size at all zoom levels
 */

import React from 'react';
import { createPortal } from 'react-dom';

interface EdgeTooltipProps {
  x: number;
  y: number;
  sourceVariableName: string;
  sourceModeName: string;
  targetVariableName: string;
  targetModeName: string;
  sourceCollectionName: string;
  sourceGroupName: string;
  targetCollectionName: string;
  targetGroupName: string;
  isHovered: boolean;
  isSelected: boolean;
}

export function EdgeTooltip({
  x,
  y,
  sourceVariableName,
  sourceModeName,
  targetVariableName,
  targetModeName,
  sourceCollectionName,
  sourceGroupName,
  targetCollectionName,
  targetGroupName,
  isHovered,
  isSelected,
}: EdgeTooltipProps) {
  const tooltipContent = (
    <div
      style={{
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -120%)',
        background: '#1F1F1F',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid #353535',
        borderRadius: '12px',
        padding: '12px 14px',
        boxShadow: 'none',
        fontSize: '11px',
        color: 'var(--text-color)',
        zIndex: 50000,
        pointerEvents: 'none',
        minWidth: '240px',
        fontFamily: 'var(--font-geist-mono)',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          marginBottom: '10px',
          fontSize: '12px',
          color: isHovered || isSelected ? '#a78bfa' : '#60a5fa',
        }}
      >
        Alias Connection
      </div>
      
      {/* Source */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ color: '#8b7eff', fontSize: '10px', marginBottom: '2px' }}>
          [Collection: {sourceCollectionName}]
        </div>
        <div style={{ paddingLeft: '8px', color: 'var(--text-color)', marginBottom: '1px' }}>
          {sourceGroupName} / {sourceVariableName} · {sourceModeName}
        </div>
      </div>
      
      {/* Arrow */}
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: '6px 0', fontSize: '14px' }}>
        ↓
      </div>
      
      {/* Target */}
      <div>
        <div style={{ color: '#8b7eff', fontSize: '10px', marginBottom: '2px' }}>
          [Collection: {targetCollectionName}]
        </div>
        <div style={{ paddingLeft: '8px', color: 'var(--text-color)' }}>
          {targetGroupName} / {targetVariableName} · {targetModeName}
        </div>
      </div>
    </div>
  );

  return createPortal(tooltipContent, document.body);
}
