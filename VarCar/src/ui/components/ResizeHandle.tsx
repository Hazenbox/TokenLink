import React, { useState, useRef, useEffect } from 'react';

interface ResizeHandleProps {
  onResize: (width: number, height: number) => void;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export function ResizeHandle({
  onResize,
  minWidth = 800,
  minHeight = 600,
  maxWidth = 2400,
  maxHeight = 1600,
}: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      
      let newWidth = startPos.current.width + deltaX;
      let newHeight = startPos.current.height + deltaY;

      // Apply constraints
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      onResize(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onResize, minWidth, minHeight, maxWidth, maxHeight]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '20px',
        height: '20px',
        cursor: 'nwse-resize',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s ease',
        opacity: isHovered || isResizing ? 1 : 0.5,
      }}
      title="Drag to resize"
    >
      {/* Diagonal grip lines */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          opacity: isHovered || isResizing ? 0.8 : 0.4,
          transition: 'opacity 0.2s ease',
        }}
      >
        {/* Three diagonal lines forming resize grip */}
        <line x1="14" y1="10" x2="10" y2="14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="6" x2="6" y2="14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="14" y1="2" x2="2" y2="14" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
