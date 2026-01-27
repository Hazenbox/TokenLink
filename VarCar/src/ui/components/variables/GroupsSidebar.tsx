/**
 * Groups Sidebar
 * Displays list of groups (color families) for filtering variables
 */

import React, { useEffect } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { FigmaGroup } from '@/models/brand';

interface GroupsSidebarProps {
  onCreateGroup?: () => void;
}

interface GroupItemProps {
  group: FigmaGroup & { id: string; name: string; variableCount: number };
  isActive: boolean;
  onClick: () => void;
}

function GroupItem({ group, isActive, onClick }: GroupItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full px-3 py-2 flex items-center justify-between
        text-left text-[11px] transition-colors
        hover:bg-surface/50
        ${isActive ? 'bg-surface-selected border-l-2 border-l-blue-500' : ''}
      `}
    >
      <div className="flex-1 min-w-0">
        <div className={`font-medium truncate ${isActive ? 'text-foreground' : 'text-foreground-secondary'}`}>
          {group.name}
        </div>
      </div>
      <div className="ml-2 text-[10px] text-foreground-tertiary">
        {Math.round(group.variableCount)}
      </div>
    </button>
  );
}

export function GroupsSidebar({ onCreateGroup }: GroupsSidebarProps) {
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const activeGroupId = useVariablesViewStore((state) => state.activeGroupId);
  const setActiveGroup = useVariablesViewStore((state) => state.setActiveGroup);
  const groupsCollapsed = useVariablesViewStore((state) => state.groupsCollapsed);
  
  // Simple state selector - no function calls
  const groups = useBrandStore((state) => state.figmaGroups, shallow);
  
  // Refresh groups when collection changes
  useEffect(() => {
    if (activeCollectionId) {
      useBrandStore.getState().refreshFigmaGroups(activeCollectionId);
    }
  }, [activeCollectionId]);
  
  // Calculate total count for "All" option
  const totalCount = groups.reduce((sum, group) => sum + (group.variableCount || 0), 0);
  
  if (groupsCollapsed) {
    return (
      <div className="w-12 border-r border-border/20 bg-surface-elevated flex flex-col items-center py-2">
        <button
          onClick={() => useVariablesViewStore.getState().toggleGroupsSidebar()}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface/50 text-foreground-tertiary"
          title="Expand Groups"
        >
          ☰
        </button>
      </div>
    );
  }
  
  return (
    <div className="w-[180px] border-r border-border/20 bg-surface-elevated flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-medium text-foreground-secondary">
          Groups
        </span>
        <button
          onClick={() => useVariablesViewStore.getState().toggleGroupsSidebar()}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-surface/50 text-foreground-tertiary"
          title="Collapse Groups"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* All Option */}
      <GroupItem
        group={{ id: 'all', name: 'All', variableCount: totalCount, collectionId: activeCollectionId || '' }}
        isActive={activeGroupId === 'all'}
        onClick={() => setActiveGroup('all')}
      />
      
      {/* Groups List */}
      <ScrollArea className="flex-1">
        {groups.length === 0 ? (
          <div className="px-3 py-8 text-center text-[10px] text-foreground-tertiary">
            {activeCollectionId ? 'No groups in collection' : 'Select a collection'}
          </div>
        ) : (
          <div className="py-1">
            {groups.map((group) => (
              <GroupItem
                key={group.id}
                group={group}
                isActive={activeGroupId === group.id}
                onClick={() => setActiveGroup(group.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
