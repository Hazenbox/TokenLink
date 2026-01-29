/**
 * Collection header node component for graph columns
 */

import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { NodeProps } from '@xyflow/react';
import { CollectionHeaderData } from '../../../utils/layoutGraph';
import { getCollectionColor } from '../../../utils/layoutGraph';

interface ExtendedCollectionHeaderData extends CollectionHeaderData {
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft?: boolean;
  canMoveRight?: boolean;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export function CollectionHeaderNode({ data }: NodeProps<ExtendedCollectionHeaderData>) {
  const accentColor = getCollectionColor(data.collectionType);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(24px) saturate(200%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
        border: '1px solid var(--card-stroke)',
        borderRadius: '18px',
        padding: '18px 22px',
        minWidth: '280px',
        boxShadow: 'none',
        cursor: 'grab',
        userSelect: 'none',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        data.onContextMenu?.(e);
      }}
    >
      {/* Action buttons */}
      {(data.onMoveLeft || data.onMoveRight) && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'none',
            gap: '4px',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onMoveLeft?.();
            }}
            disabled={!data.canMoveLeft}
            onMouseEnter={(e) => {
              if (data.canMoveLeft) {
                e.currentTarget.style.background = 'var(--button-bg-hover)';
                e.currentTarget.style.borderColor = 'var(--button-stroke-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--button-bg-idle)';
              e.currentTarget.style.borderColor = 'var(--button-stroke-idle)';
            }}
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid var(--button-stroke-idle)',
              background: 'var(--button-bg-idle)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              cursor: data.canMoveLeft ? 'pointer' : 'not-allowed',
              opacity: data.canMoveLeft ? 1 : 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: accentColor,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title="Move column left"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onMoveRight?.();
            }}
            disabled={!data.canMoveRight}
            onMouseEnter={(e) => {
              if (data.canMoveRight) {
                e.currentTarget.style.background = 'var(--button-bg-hover)';
                e.currentTarget.style.borderColor = 'var(--button-stroke-hover)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--button-bg-idle)';
              e.currentTarget.style.borderColor = 'var(--button-stroke-idle)';
            }}
            style={{
              width: '28px',
              height: '28px',
              border: '1px solid var(--button-stroke-idle)',
              background: 'var(--button-bg-idle)',
              backdropFilter: 'blur(10px)',
              borderRadius: '8px',
              cursor: data.canMoveRight ? 'pointer' : 'not-allowed',
              opacity: data.canMoveRight ? 1 : 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              color: accentColor,
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            title="Move column right"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Collection name */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--text-color)',
          marginBottom: '6px',
          letterSpacing: '-0.02em',
          paddingRight: '60px',
        }}
      >
        {data.collectionName}
      </div>

      {/* Collection metadata */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginTop: '8px',
        }}
      >
        {/* Type badge */}
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#ffffff',
            background: accentColor,
            padding: '4px 10px',
            borderRadius: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {data.collectionType}
        </div>

        {/* Variable count */}
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}
        >
          {data.variableCount} variable{data.variableCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
