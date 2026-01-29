/**
 * Column background component for visualizing collection boundaries
 * This component is rendered inside ReactFlow to scale with the graph
 */

import React from 'react';
import { useViewport } from '@xyflow/react';
import { getCollectionColor } from '../../utils/layoutGraph';

interface ColumnBackgroundProps {
  columns: Array<{
    collectionId: string;
    collectionName: string;
    collectionType: string;
    x: number;
    width: number;
    height: number;
    groupSeparators?: number[]; // Y positions of group separators
  }>;
}

export function ColumnBackground({ columns }: ColumnBackgroundProps) {
  const { x, y, zoom } = useViewport();
  
  if (columns.length === 0) return null;

  // Calculate total dimensions needed to encompass all columns
  const totalWidth = Math.max(...columns.map(col => col.x + col.width)) + 100;
  const totalHeight = Math.max(...columns.map(col => col.height)) + 100;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      style={{
        position: 'absolute',
        width: totalWidth,
        height: totalHeight,
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: -1,
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
    >
      {columns.map((col, index) => {
        const color = getCollectionColor(col.collectionType);
        
        return (
          <g key={col.collectionId}>
            {/* Background rectangle with rounded corners */}
            <rect
              x={col.x}
              y={0}
              width={col.width}
              height={col.height}
              fill={color}
              fillOpacity={0.08}
              rx={20}
              ry={20}
            />
            
            {/* Group separator lines */}
            {col.groupSeparators && col.groupSeparators.map((separatorY, sepIndex) => (
              <line
                key={`sep-${sepIndex}`}
                x1={col.x + 20}
                y1={separatorY}
                x2={col.x + col.width - 20}
                y2={separatorY}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}
