/**
 * Mode Cell
 * Displays a color value for a specific mode in the variables table
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
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="text-[10px] text-foreground-tertiary/30">—</div>
      </div>
    );
  }
  
  const isAlias = value.type === 'ALIAS' && value.aliasId;
  
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      {/* Color Swatch */}
      <div
        className="w-6 h-6 rounded border border-border/30 flex-shrink-0"
        style={{ backgroundColor: color || '#000000' }}
        title={color || 'No color'}
      />
      
      {/* Value/Alias Display */}
      <div className="flex-1 min-w-0">
        {isAlias ? (
          <div className="flex flex-col gap-0.5">
            <div 
              className="text-[10px] text-brand font-mono truncate"
              title={`Aliases to: ${value.aliasId}`}
            >
              → {value.aliasId}
            </div>
            <div 
              className="text-[9px] text-foreground-tertiary/60 font-mono"
              title={`Resolves to: ${color}`}
            >
              {color}
            </div>
          </div>
        ) : (
          <div 
            className="text-[10px] text-foreground-tertiary font-mono"
            title={color || ''}
          >
            {color || '—'}
          </div>
        )}
      </div>
    </div>
  );
}
