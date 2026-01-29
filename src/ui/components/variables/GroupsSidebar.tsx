/**
 * Groups Sidebar
 * Displays accordion of groups with expandable steps for filtering
 */

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronsUpDown, ChevronRight, ChevronDown, Search, X } from 'lucide-react';
import { shallow } from 'zustand/shallow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';

interface GroupsSidebarProps {
  onCreateGroup?: () => void;
}

export function GroupsSidebar({ onCreateGroup }: GroupsSidebarProps) {
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const activeGroupId = useVariablesViewStore((state) => state.activeGroupId);
  const selectedStep = useVariablesViewStore((state) => state.selectedStep);
  const setActiveGroup = useVariablesViewStore((state) => state.setActiveGroup);
  const setSelectedStep = useVariablesViewStore((state) => state.setSelectedStep);
  const groupsCollapsed = useVariablesViewStore((state) => state.groupsCollapsed);
  const expandedGroups = useVariablesViewStore((state) => state.expandedGroups);
  const toggleGroupExpanded = useVariablesViewStore((state) => state.toggleGroupExpanded);
  
  // Simple state selector - no function calls
  const groups = useBrandStore((state) => state.figmaGroups, shallow);
  const allVariablesMap = useBrandStore((state) => state.figmaVariablesByCollection, shallow);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Refresh groups when collection changes
  useEffect(() => {
    if (activeCollectionId) {
      useBrandStore.getState().refreshFigmaGroups(activeCollectionId);
    }
  }, [activeCollectionId]);
  
  // Get variables for current collection to extract steps per group
  const groupsWithSteps = useMemo(() => {
    const variables = allVariablesMap.get(activeCollectionId || '') || [];
    const groupStepsMap = new Map<string, Set<string>>();
    
    variables.forEach(variable => {
      // Parse: "Grey/2500/Surface" → group:"Grey", step:"2500"
      const parts = variable.name.split('/');
      
      if (parts.length >= 2) {
        const [groupName, step] = parts;
        
        if (!groupStepsMap.has(groupName)) {
          groupStepsMap.set(groupName, new Set());
        }
        
        // Add step if numeric
        if (!isNaN(parseInt(step))) {
          groupStepsMap.get(groupName)!.add(step);
        }
      }
    });
    
    // Match groups with their steps
    return groups.map(group => ({
      ...group,
      steps: Array.from(groupStepsMap.get(group.name) || [])
        .sort((a, b) => parseInt(b) - parseInt(a)) // Sort descending (2500, 2400, 2300...)
    }));
  }, [groups, allVariablesMap, activeCollectionId]);
  
  // Calculate total count for "All" option
  const totalCount = groups.reduce((sum, group) => sum + (group.variableCount || 0), 0);
  
  // Filter groups and steps by search query
  const filteredGroupsWithSteps = useMemo(() => {
    if (!searchQuery) return groupsWithSteps;
    
    const query = searchQuery.toLowerCase();
    return groupsWithSteps.map(group => {
      const groupNameMatch = group.name.toLowerCase().includes(query);
      const filteredSteps = group.steps?.filter(step => step.toLowerCase().includes(query)) || [];
      
      // Include group if name matches or if any steps match
      if (groupNameMatch || filteredSteps.length > 0) {
        return {
          ...group,
          steps: groupNameMatch ? group.steps : filteredSteps // Show all steps if group name matches, else only matching steps
        };
      }
      return null;
    }).filter(Boolean) as typeof groupsWithSteps;
  }, [groupsWithSteps, searchQuery]);
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] font-semibold text-foreground-secondary">
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
      
      {/* Search */}
      <div className="px-2 py-2">
        <div className="relative group">
          <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-foreground-tertiary" />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 px-2 pl-7 pr-7 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-surface rounded-full transition-colors cursor-pointer"
            >
              <X className="h-3 w-3 text-foreground-tertiary" />
            </button>
          )}
        </div>
      </div>
      
      {/* All Option */}
      <button
        onClick={() => {
          setActiveGroup('all');
          setSelectedStep('all');
        }}
        className={`
          w-full px-3 py-2 flex items-center justify-between
          text-left text-[11px] transition-colors
          hover:bg-surface/50
          ${activeGroupId === 'all' ? 'bg-surface-selected border-l-2 border-l-border-strong' : ''}
        `}
      >
        <div className="flex-1 min-w-0">
          <div className={`font-medium truncate ${activeGroupId === 'all' ? 'text-foreground' : 'text-foreground-secondary'}`}>
            All
          </div>
        </div>
        <div className="ml-2 text-[10px] text-foreground-tertiary">
          {totalCount}
        </div>
      </button>
      
      {/* Groups List with Accordion */}
      <ScrollArea className="flex-1">
        {groups.length === 0 ? (
          <div className="px-3 py-8 text-center text-[10px] text-foreground-tertiary">
            {activeCollectionId ? 'No groups in collection' : 'Select a collection'}
          </div>
        ) : filteredGroupsWithSteps.length === 0 ? (
          <div className="px-3 py-8 text-center text-[10px] text-foreground-tertiary">
            No groups found
            <br />
            Try a different search
          </div>
        ) : (
          <div className="py-1">
            {filteredGroupsWithSteps.map((group) => {
              const isExpanded = expandedGroups.has(group.id);
              const isActiveGroup = activeGroupId === group.id;
              const hasSteps = group.steps && group.steps.length > 0;
              
              return (
                <div key={group.id}>
                  {/* Group Header - Clickable */}
                  <button
                    onClick={() => {
                      if (hasSteps) {
                        toggleGroupExpanded(group.id);
                      }
                      setActiveGroup(group.id);
                      setSelectedStep('all');
                    }}
                    className={`
                      w-full px-3 py-2 flex items-center gap-2
                      text-left text-[11px] transition-colors
                      hover:bg-surface/50
                      ${isActiveGroup && selectedStep === 'all' ? 'bg-surface-selected border-l-2 border-l-border-strong' : ''}
                    `}
                  >
                    {/* Chevron icon (only if has steps) */}
                    {hasSteps && (
                      isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-foreground-tertiary flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-foreground-tertiary flex-shrink-0" />
                      )
                    )}
                    
                    {/* Group name */}
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${isActiveGroup ? 'text-foreground' : 'text-foreground-secondary'}`}>
                        {group.name}
                      </div>
                    </div>
                    
                    {/* Count */}
                    <div className="ml-2 text-[10px] text-foreground-tertiary">
                      {group.variableCount || 0}
                    </div>
                  </button>
                  
                  {/* Steps List (when expanded) */}
                  {isExpanded && hasSteps && (
                    <div className="pl-5 py-1 bg-background">
                      {/* All steps option */}
                      <button
                        onClick={() => {
                          setActiveGroup(group.id);
                          setSelectedStep('all');
                        }}
                        className={`
                          w-full px-3 py-1.5 text-left text-[11px]
                          transition-colors hover:bg-surface/50 rounded
                          ${isActiveGroup && selectedStep === 'all' ? 'text-foreground font-medium' : 'text-foreground-secondary'}
                        `}
                      >
                        All steps
                      </button>
                      
                      {/* Individual steps */}
                      {group.steps!.map(step => (
                        <button
                          key={step}
                          onClick={() => {
                            setActiveGroup(group.id);
                            setSelectedStep(step);
                          }}
                          className={`
                            w-full px-3 py-1.5 text-left text-[11px]
                            transition-colors hover:bg-surface/50 rounded
                            ${isActiveGroup && selectedStep === step ? 'text-foreground font-medium' : 'text-foreground-secondary'}
                          `}
                        >
                          {step}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
