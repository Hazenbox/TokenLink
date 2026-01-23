/**
 * Individual mode node component with handles for manual mapping
 */

import React, { useState, useMemo, memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check } from 'lucide-react';
import { Mode, isModeValue, isModeAlias, ModeAlias } from '../../../models/types';
import { VariableGraph } from '../../../models/graph';
import { formatColorValue, isLightColor } from '../../../utils/colorUtils';

interface ModeNodeProps {
  mode: Mode;
  graph?: VariableGraph;
  variableId: string;
  variableName: string;
  collectionName: string;
  accentColor: string;
  proximityHandle?: { handleId: string; isValid: boolean } | null;
  isSelected?: boolean;
  onModeClick: (event?: React.MouseEvent) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export const ModeNode = memo(function ModeNode({
  mode,
  graph,
  variableId,
  variableName,
  collectionName,
  accentColor,
  proximityHandle,
  isSelected = false,
  onModeClick,
  onContextMenu,
}: ModeNodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showColorTooltip, setShowColorTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [leftHandleHovered, setLeftHandleHovered] = useState(false);
  const [rightHandleHovered, setRightHandleHovered] = useState(false);

  const sourceHandleId = useMemo(() => `${variableId}-${mode.id}-source`, [variableId, mode.id]);
  const targetHandleId = useMemo(() => `${variableId}-${mode.id}-target`, [variableId, mode.id]);

  // Determine connection state based on proximity
  const connectionState = useMemo(() => {
    if (!proximityHandle) return 'default';
    if (proximityHandle.handleId === targetHandleId) {
      return proximityHandle.isValid ? 'valid' : 'invalid';
    }
    return 'default';
  }, [proximityHandle, targetHandleId]);

  const isAlias = useMemo(() => isModeAlias(mode.value), [mode.value]);
  const isColorValue = useMemo(() => 
    !isAlias && isModeValue(mode.value) && 
    typeof mode.value.value === 'string' && 
    mode.value.value.startsWith('#'),
    [isAlias, mode.value]
  );

  const handleSwatchHover = (event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
    setShowColorTooltip(true);
  };

  const handleSwatchLeave = () => {
    setTooltipPosition(null);
    setShowColorTooltip(false);
  };

  // Helper function to resolve alias colors recursively
  const getAliasColor = (alias: ModeAlias, graph?: VariableGraph, depth = 0): string | null => {
    if (!graph || depth > 10) return null; // Prevent infinite recursion
    
    const targetVariable = graph.variables.get(alias.variableId);
    if (!targetVariable) return null;
    
    const targetMode = targetVariable.modes.find(m => m.id === alias.modeId);
    if (!targetMode) return null;
    
    // If target is also an alias, recursively resolve
    if (isModeAlias(targetMode.value)) {
      return getAliasColor(targetMode.value as ModeAlias, graph, depth + 1);
    }
    
    if (isModeValue(targetMode.value) && typeof targetMode.value.value === 'string') {
      return targetMode.value.value;
    }
    
    return null;
  };

  // Determine what to display
  const aliasColor = isAlias && graph ? getAliasColor(mode.value as ModeAlias, graph) : null;
  const shouldShowColorSwatch = isColorValue || (isAlias && aliasColor);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      onClick={(e) => onModeClick(e)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 18px',
        borderRadius: '10px',
        background: isSelected 
          ? 'rgba(139, 126, 255, 0.15)' 
          : isHovered 
            ? 'rgba(255, 255, 255, 0.06)' 
            : 'transparent',
        backdropFilter: (isHovered || isSelected) ? 'blur(8px)' : 'none',
        WebkitBackdropFilter: (isHovered || isSelected) ? 'blur(8px)' : 'none',
        border: isSelected ? '1px solid rgba(139, 126, 255, 0.4)' : 'none',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        margin: '2px 0',
        overflow: 'visible',
      }}
    >
      {/* Left handle hover zone */}
      <div
        className="nodrag"
        onMouseEnter={() => setLeftHandleHovered(true)}
        onMouseLeave={() => setLeftHandleHovered(false)}
        style={{
          position: 'absolute',
          left: '-37px',
          top: '50%',
          width: '34px',
          height: '34px',
          marginTop: '-17px',
          zIndex: 9,
          cursor: 'crosshair',
          pointerEvents: 'all',
        }}
      />
      {/* Left handle (target) */}
      <Handle 
        type="target" 
        position={Position.Left}
        id={targetHandleId}
        isConnectable={true}
        onMouseEnter={() => setLeftHandleHovered(true)}
        onMouseLeave={() => setLeftHandleHovered(false)}
        style={{
          background: connectionState === 'valid' ? 'var(--handle-valid)' :
                     connectionState === 'invalid' ? 'var(--handle-invalid)' :
                     leftHandleHovered ? 'var(--handle-hover-bg)' : 'var(--handle-bg)',
          width: '10px',
          height: '10px',
          border: connectionState === 'valid' ? '2px solid var(--handle-valid)' :
                  connectionState === 'invalid' ? '2px solid var(--handle-invalid)' :
                  leftHandleHovered ? '2px solid var(--handle-hover-fill)' : '1.5px solid var(--handle-stroke)',
          backdropFilter: leftHandleHovered ? 'blur(32px)' : 'none',
          WebkitBackdropFilter: leftHandleHovered ? 'blur(32px)' : 'none',
          left: '-25px',
          top: '50%',
          marginTop: '-5px',
          opacity: 1,
          zIndex: 10,
          cursor: 'crosshair',
          pointerEvents: 'all',
          boxShadow: connectionState === 'valid' ? '0 0 12px rgba(77, 184, 168, 0.8)' :
                     connectionState === 'invalid' ? '0 0 12px rgba(255, 107, 107, 0.8)' : 
                     'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center center',
          transform: leftHandleHovered ? 'scale(2)' : 'scale(1)',
          animation: connectionState === 'valid' ? 'handleGlowValid 1.5s infinite' :
                     connectionState === 'invalid' ? 'handleGlowInvalid 1s infinite' : 'none',
        }}
      />
      
      {/* Color swatch or bullet point */}
      {shouldShowColorSwatch ? (
        <div
          style={{ position: 'relative' }}
          onMouseEnter={handleSwatchHover}
          onMouseLeave={handleSwatchLeave}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isColorValue 
                ? String(mode.value.value)
                : (aliasColor || '#ccc'),
              border: !isLightColor(
                isColorValue ? String(mode.value.value) : (aliasColor || '#ccc')
              )
                ? '1px solid var(--border-color)' 
                : 'none',
              flexShrink: 0,
              cursor: 'help',
            }}
          />
        </div>
      ) : !isAlias ? (
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--text-secondary)',
            flexShrink: 0,
            marginLeft: '3px',
          }}
        />
      ) : null}
      
      {/* Mode name */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--text-color)',
          minWidth: '70px',
        }}
      >
        {mode.name}
      </div>
      
      {/* Mode value */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontFamily: 'var(--font-geist-mono)',
          flex: 1,
          textAlign: 'right',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '6px',
        }}
      >
        <span>{isAlias ? '→ alias' : String(mode.value.value)}</span>
        {isSelected && (
          <Check size={14} color="var(--primary-color)" strokeWidth={2.5} />
        )}
      </div>
      
      {/* Right handle hover zone */}
      <div
        className="nodrag"
        onMouseEnter={() => setRightHandleHovered(true)}
        onMouseLeave={() => setRightHandleHovered(false)}
        style={{
          position: 'absolute',
          right: '-37px',
          top: '50%',
          width: '34px',
          height: '34px',
          marginTop: '-17px',
          zIndex: 9,
          cursor: 'crosshair',
          pointerEvents: 'all',
        }}
      />
      {/* Right handle (source) */}
      <Handle 
        type="source" 
        position={Position.Right}
        id={sourceHandleId}
        isConnectable={true}
        onMouseEnter={() => setRightHandleHovered(true)}
        onMouseLeave={() => setRightHandleHovered(false)}
        style={{
          background: connectionState === 'valid' ? 'var(--handle-valid)' :
                     connectionState === 'invalid' ? 'var(--handle-invalid)' :
                     rightHandleHovered ? 'var(--handle-hover-bg)' : 'var(--handle-bg)',
          width: '10px',
          height: '10px',
          border: connectionState === 'valid' ? '2px solid var(--handle-valid)' :
                  connectionState === 'invalid' ? '2px solid var(--handle-invalid)' :
                  rightHandleHovered ? '2px solid var(--handle-hover-fill)' : '1.5px solid var(--handle-stroke)',
          backdropFilter: rightHandleHovered ? 'blur(32px)' : 'none',
          WebkitBackdropFilter: rightHandleHovered ? 'blur(32px)' : 'none',
          right: '-25px',
          top: '50%',
          marginTop: '-5px',
          opacity: 1,
          zIndex: 10,
          cursor: 'crosshair',
          pointerEvents: 'all',
          boxShadow: connectionState === 'valid' ? '0 0 12px rgba(77, 184, 168, 0.8)' :
                     connectionState === 'invalid' ? '0 0 12px rgba(255, 107, 107, 0.8)' : 
                     'none',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transformOrigin: 'center center',
          transform: rightHandleHovered ? 'scale(2)' : 'scale(1)',
          animation: connectionState === 'valid' ? 'handleGlowValid 1.5s infinite' :
                     connectionState === 'invalid' ? 'handleGlowInvalid 1s infinite' : 'none',
        }}
      />
      
      {/* Color tooltip */}
      {showColorTooltip && tooltipPosition && isColorValue && (() => {
        const colorValue = mode.value.value as string;
        const formatted = formatColorValue(colorValue);
        
        return (
          <div
            style={{
              position: 'fixed',
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: 'translate(-50%, -100%)',
              background: 'var(--card-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '8px 10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              zIndex: 10000,
              whiteSpace: 'nowrap',
              fontSize: '11px',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-color)' }}>
              {collectionName}/{variableName}
            </div>
            <div style={{ color: 'var(--text-color)', marginBottom: '2px' }}>
              <strong>HEX:</strong> {formatted.hex}
            </div>
            <div style={{ color: 'var(--text-color)', marginBottom: '2px' }}>
              <strong>RGB:</strong> {formatted.rgb}
            </div>
            <div style={{ color: 'var(--text-color)' }}>
              <strong>RGBA:</strong> {formatted.rgba}
            </div>
          </div>
        );
      })()}
    </div>
  );
});
