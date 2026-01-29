/**
 * Mode Cell
 * Displays a color value for a specific mode in the variables table
 * Figma-style: small inline swatch + alias text
 */

import React from 'react';

interface ModeCellProps {
  value: {
    type: 'COLOR' | 'ALIAS';
    value?: string;
    aliasId?: string;
    aliasCollectionId?: string;
  };
  color: string; // Resolved hex color
}

export function ModeCell({ value, color }: ModeCellProps) {
  // Defensive checks
  if (!value || !color) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="text-[11px] text-foreground-tertiary/30">—</div>
      </div>
    );
  }
  
  const isAlias = value.type === 'ALIAS' && value.aliasId;
  
  return (
    <div className="flex items-center gap-2 px-3 py-1.5">
      {/* Color Swatch - Small inline */}
      <div
        className="w-4 h-4 rounded border border-border/40 flex-shrink-0"
        style={{ backgroundColor: color || '#000000' }}
        title={color || 'No color'}
      />
      
      {/* Value/Alias Display - Inline */}
      <div className="flex-1 min-w-0">
        {isAlias ? (
          <div 
            className="text-[11px] text-foreground-secondary truncate"
            title={`${value.aliasId} → ${color}`}
          >
            {value.aliasId}
          </div>
        ) : (
          <div 
            className="text-[11px] text-foreground-tertiary truncate"
            title={color || ''}
          >
            {color || '—'}
          </div>
        )}
      </div>
    </div>
  );
}
