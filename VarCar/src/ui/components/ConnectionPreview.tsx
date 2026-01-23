/**
 * Connection preview component showing ghost line during drag with validation
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useReactFlow, Node, Edge, Position } from '@xyflow/react';

interface ConnectionPreviewProps {
  sourceNode: string | null;
  sourceHandle: string | null;
  cursorPosition: { x: number; y: number } | null;
  validTargets: Set<string>;
  invalidTargets: Map<string, string>; // handleId -> reason
  onTargetProximity?: (handleId: string | null, isValid: boolean) => void;
}

interface HandlePosition {
  x: number;
  y: number;
  handleId: string;
  isValid: boolean;
  reason?: string;
}

export function ConnectionPreview({
  sourceNode,
  sourceHandle,
  cursorPosition,
  validTargets,
  invalidTargets,
  onTargetProximity,
}: ConnectionPreviewProps) {
  const { getNode, getNodes, project, flowToScreenPosition } = useReactFlow();
  const [nearestHandle, setNearestHandle] = useState<HandlePosition | null>(null);
  const [snapPosition, setSnapPosition] = useState<{ x: number; y: number } | null>(null);

  // Calculate source handle position
  const sourceHandlePosition = React.useMemo(() => {
    if (!sourceNode || !sourceHandle) return null;
    
    const node = getNode(sourceNode);
    if (!node) return null;

    // Get the handle element from DOM
    const handleElement = document.querySelector(`[data-handleid="${sourceHandle}"]`);
    if (!handleElement) return null;

    const rect = handleElement.getBoundingClientRect();
    const flowContainer = document.querySelector('.react-flow');
    if (!flowContainer) return null;

    const containerRect = flowContainer.getBoundingClientRect();
    
    return {
      x: rect.left + rect.width / 2 - containerRect.left,
      y: rect.top + rect.height / 2 - containerRect.top,
    };
  }, [sourceNode, sourceHandle, getNode]);

  // Find all target handles and calculate distances
  useEffect(() => {
    if (!cursorPosition || !sourceHandlePosition) {
      setNearestHandle(null);
      setSnapPosition(null);
      if (onTargetProximity) onTargetProximity(null, false);
      return;
    }

    const allHandles: HandlePosition[] = [];
    const flowContainer = document.querySelector('.react-flow');
    if (!flowContainer) return;

    const containerRect = flowContainer.getBoundingClientRect();

    // Find all target handles in the DOM
    const targetHandleElements = document.querySelectorAll('[data-handlepos="left"]');
    targetHandleElements.forEach((element) => {
      const handleId = element.getAttribute('data-handleid');
      if (!handleId || handleId === sourceHandle) return;

      const rect = element.getBoundingClientRect();
      const handleScreenX = rect.left + rect.width / 2;
      const handleScreenY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(handleScreenX - cursorPosition.x, 2) +
        Math.pow(handleScreenY - cursorPosition.y, 2)
      );

      const isValid = validTargets.has(handleId);
      const reason = invalidTargets.get(handleId);

      // Only consider handles within 50px
      if (distance < 50) {
        allHandles.push({
          x: handleScreenX - containerRect.left,
          y: handleScreenY - containerRect.top,
          handleId,
          isValid,
          reason,
        });
      }
    });

    // Find nearest handle
    if (allHandles.length > 0) {
      const nearest = allHandles.reduce((prev, curr) => {
        const prevDist = Math.sqrt(
          Math.pow(prev.x - (cursorPosition.x - containerRect.left), 2) +
          Math.pow(prev.y - (cursorPosition.y - containerRect.top), 2)
        );
        const currDist = Math.sqrt(
          Math.pow(curr.x - (cursorPosition.x - containerRect.left), 2) +
          Math.pow(curr.y - (cursorPosition.y - containerRect.top), 2)
        );
        return currDist < prevDist ? curr : prev;
      });

      const distanceToNearest = Math.sqrt(
        Math.pow(nearest.x - (cursorPosition.x - containerRect.left), 2) +
        Math.pow(nearest.y - (cursorPosition.y - containerRect.top), 2)
      );

      // Snap if within 30px
      if (distanceToNearest < 30) {
        setNearestHandle(nearest);
        setSnapPosition({ x: nearest.x + containerRect.left, y: nearest.y + containerRect.top });
        if (onTargetProximity) onTargetProximity(nearest.handleId, nearest.isValid);
      } else {
        setNearestHandle(null);
        setSnapPosition(null);
        if (onTargetProximity) onTargetProximity(null, false);
      }
    } else {
      setNearestHandle(null);
      setSnapPosition(null);
      if (onTargetProximity) onTargetProximity(null, false);
    }
  }, [cursorPosition, sourceHandlePosition, validTargets, invalidTargets, onTargetProximity, sourceHandle]);

  if (!sourceHandlePosition || !cursorPosition) return null;

  const endPosition = snapPosition || cursorPosition;
  const flowContainer = document.querySelector('.react-flow');
  if (!flowContainer) return null;
  const containerRect = flowContainer.getBoundingClientRect();

  // Calculate bezier path
  const startX = sourceHandlePosition.x;
  const startY = sourceHandlePosition.y;
  const endX = endPosition.x - containerRect.left;
  const endY = endPosition.y - containerRect.top;

  const dx = endX - startX;
  const curvature = 0.15;
  const c1x = startX + dx * 0.5;
  const c1y = startY;
  const c2x = endX - dx * 0.5;
  const c2y = endY;

  const pathData = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

  // Determine line color
  const lineColor = nearestHandle 
    ? nearestHandle.isValid 
      ? 'rgba(77, 184, 168, 0.8)' 
      : 'rgba(255, 107, 107, 0.8)'
    : 'rgba(167, 139, 250, 0.6)';

  const lineWidth = snapPosition ? 2.5 : 2;
  const dashArray = snapPosition ? 'none' : '5,5';

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    >
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <defs>
          <marker
            id="preview-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill={lineColor}
            />
          </marker>
        </defs>
        <path
          d={pathData}
          stroke={lineColor}
          strokeWidth={lineWidth}
          strokeDasharray={dashArray}
          fill="none"
          markerEnd="url(#preview-arrow)"
          style={{
            filter: snapPosition ? 'drop-shadow(0 0 8px rgba(167, 139, 250, 0.6))' : 'none',
          }}
        />
      </svg>

      {/* Show tooltip for invalid connections */}
      {nearestHandle && !nearestHandle.isValid && nearestHandle.reason && (
        <div
          style={{
            position: 'fixed',
            left: `${endPosition.x}px`,
            top: `${endPosition.y - 40}px`,
            transform: 'translateX(-50%)',
            background: 'rgba(255, 107, 107, 0.95)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            zIndex: 10001,
          }}
        >
          {nearestHandle.reason}
        </div>
      )}
    </div>
  );
}
