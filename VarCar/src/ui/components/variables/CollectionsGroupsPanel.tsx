/**
 * Collections and Groups Combined Panel
 * Vertically split panel with adjustable divider
 */

import React, { useState, useRef, useEffect } from 'react';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { CollectionsSidebar } from './CollectionsSidebar';
import { GroupsSidebar } from './GroupsSidebar';

interface CollectionsGroupsPanelProps {
  onCreateCollection?: () => void;
  onCreateGroup?: () => void;
}

export function CollectionsGroupsPanel({ 
  onCreateCollection, 
  onCreateGroup 
}: CollectionsGroupsPanelProps) {
  const splitRatio = useVariablesViewStore((state) => state.collectionsGroupsSplitRatio);
  const setSplitRatio = useVariablesViewStore((state) => state.setCollectionsGroupsSplitRatio);
  
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startY = e.clientY;
    const startRatio = splitRatio;
    const containerHeight = containerRef.current?.clientHeight || 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const deltaY = e.clientY - startY;
      const deltaRatio = deltaY / containerHeight;
      const newRatio = startRatio + deltaRatio;
      
      setSplitRatio(newRatio);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div 
      ref={containerRef}
      className="w-[380px] h-full flex flex-col border-r border-border/20 bg-background"
    >
      {/* Collections Section */}
      <div 
        style={{ 
          flexBasis: `${splitRatio * 100}%`,
          minHeight: '200px'
        }} 
        className="flex flex-col overflow-hidden"
      >
        <CollectionsSidebar onCreateCollection={onCreateCollection} />
      </div>
      
      {/* Resize Handle */}
      <div 
        onMouseDown={handleMouseDown}
        className={`h-1 cursor-ns-resize transition-colors border-y border-border/20 flex-shrink-0 ${
          isResizing 
            ? 'bg-blue-500/40' 
            : 'hover:bg-blue-500/20'
        }`}
        title="Drag to resize"
      />
      
      {/* Groups Section */}
      <div 
        style={{ 
          flexBasis: `${(1 - splitRatio) * 100}%`,
          minHeight: '200px'
        }} 
        className="flex flex-col overflow-hidden"
      >
        <GroupsSidebar onCreateGroup={onCreateGroup} />
      </div>
    </div>
  );
}
