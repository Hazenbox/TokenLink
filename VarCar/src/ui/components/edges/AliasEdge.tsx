/**
 * Custom edge component for alias connections with hover effects and tooltips
 */

import React, { useState, useMemo, memo } from 'react';
import { EdgeProps, getBezierPath, BaseEdge, Position, useViewport } from '@xyflow/react';
import { AliasEdgeData } from '../../../adapters/graphToReactFlow';
import { EdgeTooltip } from './EdgeTooltip';

export const AliasEdge = memo(function AliasEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
}: EdgeProps<AliasEdgeData>) {
  const [isHovered, setIsHovered] = useState(false);
  const { x: viewportX, y: viewportY, zoom } = useViewport();
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Calculate offset to position arrow before card edge (handle size + arrow size)
  const offset = 15;
  const adjustedTargetX = useMemo(() => 
    targetX + (targetPosition === Position.Left ? offset : targetPosition === Position.Right ? -offset : 0),
    [targetX, targetPosition]
  );
  const adjustedTargetY = useMemo(() => 
    targetY + (targetPosition === Position.Top ? offset : targetPosition === Position.Bottom ? -offset : 0),
    [targetY, targetPosition]
  );
  
  const [edgePath, labelX, labelY] = useMemo(() => getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX: adjustedTargetX,
    targetY: adjustedTargetY,
    targetPosition,
    curvature: 0.15, // Reduced curvature for gentler curves
  }), [sourceX, sourceY, sourcePosition, adjustedTargetX, adjustedTargetY, targetPosition]);

  // Calculate screen position from canvas coordinates
  const canvasToScreen = (canvasX: number, canvasY: number) => {
    const flowContainer = document.querySelector('.react-flow');
    if (!flowContainer) return { x: 0, y: 0 };
    
    const rect = flowContainer.getBoundingClientRect();
    const screenX = rect.left + (canvasX + viewportX) * zoom;
    const screenY = rect.top + (canvasY + viewportY) * zoom;
    
    return { x: screenX, y: screenY };
  };

  // Handlers for mouse events
  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isHovered) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!selected) {
      setTooltipPosition(null);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTooltipPosition({ x: e.clientX, y: e.clientY });
  };

  // Calculate tooltip position for selected state when not hovering
  const selectedTooltipPos = selected && !isHovered ? canvasToScreen(labelX, labelY) : null;

  // Debug logging to understand markerEnd prop
  console.log('[AliasEdge] Marker debug:', {
    edgeId: id,
    markerEndProp: markerEnd,
    selected,
    isHovered,
    markerType: typeof markerEnd,
  });

  return (
    <>
      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        stroke="transparent"
        strokeWidth="12"
        fill="none"
        style={{
          cursor: 'pointer',
          pointerEvents: 'all',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      
      {/* Visible edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : isHovered ? 3 : 2,
          stroke: selected ? '#a78bfa' : isHovered ? 'rgba(167, 139, 250, 0.8)' : 'rgba(148, 163, 184, 0.5)',
          strokeDasharray: selected ? 'none' : undefined,
          transition: 'stroke-width 0.2s ease, stroke 0.2s ease',
          cursor: 'pointer',
          pointerEvents: 'none',
        }}
      />

      
      {/* Show tooltip using portal - follows mouse on hover */}
      {isHovered && data && tooltipPosition && (
        <EdgeTooltip
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          sourceVariableName={data.sourceVariableName}
          sourceModeName={data.sourceModeName}
          targetVariableName={data.targetVariableName}
          targetModeName={data.targetModeName}
          sourceCollectionName={data.sourceCollectionName}
          sourceGroupName={data.sourceGroupName}
          targetCollectionName={data.targetCollectionName}
          targetGroupName={data.targetGroupName}
          isHovered={isHovered}
          isSelected={selected || false}
        />
      )}
      
      {/* Show tooltip at edge center when selected but not hovering */}
      {selected && !isHovered && data && selectedTooltipPos && (
        <EdgeTooltip
          x={selectedTooltipPos.x}
          y={selectedTooltipPos.y}
          sourceVariableName={data.sourceVariableName}
          sourceModeName={data.sourceModeName}
          targetVariableName={data.targetVariableName}
          targetModeName={data.targetModeName}
          sourceCollectionName={data.sourceCollectionName}
          sourceGroupName={data.sourceGroupName}
          targetCollectionName={data.targetCollectionName}
          targetGroupName={data.targetGroupName}
          isHovered={false}
          isSelected={true}
        />
      )}
    </>
  );
});
