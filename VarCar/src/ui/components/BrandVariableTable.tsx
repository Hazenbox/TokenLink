/**
 * Brand Variable Table
 * Figma-style variable table showing variables with mode columns
 */

import React, { useState, useMemo, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Link, ChevronRight, ChevronDown } from 'lucide-react';
import { ModeCell } from './variables/ModeCell';

export function BrandVariableTable() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const activeGroupId = useVariablesViewStore((state) => state.activeGroupId);
  const searchQuery = useVariablesViewStore((state) => state.searchQuery);
  const setSearchQuery = useVariablesViewStore((state) => state.setSearchQuery);
  const expandedGroups = useVariablesViewStore((state) => state.expandedGroups);
  const toggleGroupExpanded = useVariablesViewStore((state) => state.toggleGroupExpanded);
  
  // Simple state selectors - no function calls
  const collections = useBrandStore((state) => state.figmaCollections, shallow);
  const allVariablesMap = useBrandStore((state) => state.figmaVariablesByCollection, shallow);
  const figmaVariables = activeCollectionId ? (allVariablesMap.get(activeCollectionId) || []) : [];
  
  // Refresh variables when collection or group changes
  useEffect(() => {
    if (activeCollectionId) {
      useBrandStore.getState().refreshFigmaVariables(activeCollectionId, activeGroupId || 'all');
    }
  }, [activeCollectionId, activeGroupId]);
  
  // Get active collection
  const activeCollection = useMemo(() => 
    collections.find((c) => c.id === activeCollectionId),
    [collections, activeCollectionId]
  );
  
  const modes = activeCollection?.modes || [];

  // Group variables by group and step
  const groupedData = useMemo(() => {
    if (!figmaVariables.length) return new Map();
    
    const grouped = new Map<string, {
      groupName: string;
      steps: Map<number, {
        valuesByMode: Record<string, any>;
        resolvedByMode: Record<string, string>;
      }>;
    }>();
    
    figmaVariables.forEach((variable) => {
      const { groupId, name } = variable;
      
      // Extract palette and step from name: "[Primary] Indigo 200" → "Indigo", 200
      const match = name.match(/\[.*?\]\s+(.*?)\s+(\d{3,4})$/);
      if (!match) return;
      
      const [, paletteName, stepStr] = match;
      const step = parseInt(stepStr);
      
      if (!grouped.has(groupId)) {
        grouped.set(groupId, {
          groupName: paletteName,
          steps: new Map()
        });
      }
      
      if (!grouped.get(groupId)!.steps.has(step)) {
        grouped.get(groupId)!.steps.set(step, {
          valuesByMode: {},
          resolvedByMode: {}
        });
      }
      
      const stepData = grouped.get(groupId)!.steps.get(step)!;
      stepData.valuesByMode = variable.valuesByMode;
      stepData.resolvedByMode = variable.resolvedValuesByMode;
    });
    
    return grouped;
  }, [figmaVariables]);
  
  // Helper to get sorted steps
  const getSortedSteps = (steps: Map<number, any>) => {
    return Array.from(steps.keys()).sort((a, b) => a - b);
  };
  
  // Filter grouped data by search query
  const filteredGroupedData = useMemo(() => {
    if (!searchQuery) return groupedData;
    
    const query = searchQuery.toLowerCase();
    const filtered = new Map();
    
    groupedData.forEach((groupData, groupId) => {
      // Check if group name matches
      const groupMatches = groupData.groupName.toLowerCase().includes(query);
      
      // Filter steps
      const matchingSteps = new Map();
      groupData.steps.forEach((stepData, step) => {
        const stepMatches = step.toString().includes(query);
        if (groupMatches || stepMatches) {
          matchingSteps.set(step, stepData);
        }
      });
      
      if (matchingSteps.size > 0) {
        filtered.set(groupId, {
          ...groupData,
          steps: matchingSteps
        });
      }
    });
    
    return filtered;
  }, [groupedData, searchQuery]);
  
  // Auto-expand all groups when searching
  useEffect(() => {
    if (searchQuery) {
      useVariablesViewStore.getState().expandAllGroups();
    }
  }, [searchQuery]);
  
  // Validate brand
  const validation = useMemo(() => {
    if (!activeBrand) return { valid: false, errors: [], warnings: [] };
    return BrandGenerator.validate(activeBrand);
  }, [activeBrand]);

  // Handle export
  const handleExport = () => {
    if (!activeBrand) return;
    
    // Export to CSV with Group, Step, and mode columns
    const headers = ['Group', 'Step', ...modes.map(m => m.name)];
    const rows: string[] = [];
    
    filteredGroupedData.forEach((groupData, groupId) => {
      const sortedSteps = getSortedSteps(groupData.steps);
      
      sortedSteps.forEach((step) => {
        const stepData = groupData.steps.get(step)!;
        const row = [
          groupData.groupName,
          step.toString(),
          ...modes.map((mode) => stepData.resolvedByMode[mode.id] || '')
        ];
        rows.push(row.join(','));
      });
    });
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBrand.name}_variables.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  // Handle different states
  if (!activeBrand) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-secondary text-sm p-4">
        Select a brand to view variables
      </div>
    );
  }
  
  if (!validation.valid) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Configuration Required
          </h3>
          <p className="text-xs text-foreground-secondary mb-4">
            Assign palettes in the configuration panel to generate variables
          </p>
          {validation.errors.length > 0 && (
            <div className="text-left bg-surface-elevated border-l-2 border-l-red-500 rounded p-3">
              <p className="text-xs font-medium text-red-500 mb-2">Required:</p>
              <ul className="text-xs text-foreground-secondary space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  if (!activeCollectionId) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-secondary text-sm p-4">
        Select a collection to view variables
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Variables
            </h2>
            <p className="text-xs text-foreground-secondary">
              {groupedData.size} groups
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => useVariablesViewStore.getState().expandAllGroups()}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
            >
              Expand All
            </Button>
            <Button
              onClick={() => useVariablesViewStore.getState().collapseAllGroups()}
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
            >
              Collapse All
            </Button>
            <Button
              onClick={handleExport}
              size="sm"
              variant="outline"
              className="h-7 px-3"
            >
              <Download className="w-3 h-3 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-foreground-tertiary" />
          <Input
            placeholder="Search variables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Variables Table */}
      <ScrollArea className="flex-1">
        <div className="overflow-x-auto">
          {filteredGroupedData.size === 0 ? (
            <div className="text-center py-12 text-foreground-secondary text-xs">
              {searchQuery ? 'No variables match your search' : 'No variables in this collection'}
            </div>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-b border-border/20">
                  {/* Variable Name Column */}
                  <th className="sticky left-0 z-20 bg-surface text-left px-3 py-2 border-r border-border/10">
                    <span className="text-[11px] font-medium text-foreground-secondary">
                      Name
                    </span>
                  </th>
                  
                  {/* Mode Columns */}
                  {modes.map((mode) => (
                    <th 
                      key={mode.id} 
                      className="text-center px-3 py-2 min-w-[140px] border-r border-border/10"
                    >
                      <span className="text-[11px] font-medium text-foreground-secondary">
                        {mode.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              
              <tbody>
                {Array.from(filteredGroupedData.entries()).map(([groupId, groupData]) => {
                  const isExpanded = expandedGroups.has(groupId);
                  const sortedSteps = getSortedSteps(groupData.steps);
                  
                  return (
                    <React.Fragment key={groupId}>
                      {/* Group Header Row */}
                      <tr 
                        className="border-b border-border/10 hover:bg-surface/50 cursor-pointer transition-colors"
                        onClick={() => toggleGroupExpanded(groupId)}
                      >
                        <td className="sticky left-0 z-10 bg-card px-3 py-2 border-r border-border/10">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3 text-foreground-tertiary" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-foreground-tertiary" />
                            )}
                            <span className="text-[11px] font-medium text-foreground">
                              {groupData.groupName}
                            </span>
                            <span className="text-[10px] text-foreground-tertiary">
                              ({sortedSteps.length})
                            </span>
                          </div>
                        </td>
                        
                        {/* Empty cells for modes in group header */}
                        {modes.map((mode) => (
                          <td key={mode.id} className="border-r border-border/10" />
                        ))}
                      </tr>
                      
                      {/* Step Sub-Rows (shown when expanded) */}
                      {isExpanded && sortedSteps.map((step) => {
                        const stepData = groupData.steps.get(step)!;
                        
                        return (
                          <tr 
                            key={`${groupId}_${step}`}
                            className="border-b border-border/10 hover:bg-surface/30 transition-colors"
                          >
                            {/* Step Name (indented) */}
                            <td className="sticky left-0 z-10 bg-card px-3 py-2 border-r border-border/10">
                              <div className="flex items-center gap-2 pl-5">
                                <span className="text-[11px] text-foreground-secondary">
                                  {step}
                                </span>
                              </div>
                            </td>
                            
                            {/* Mode Values */}
                            {modes.map((mode) => {
                              const value = stepData.valuesByMode[mode.id];
                              const resolvedColor = stepData.resolvedByMode[mode.id];
                              
                              return (
                                <td 
                                  key={mode.id} 
                                  className="border-r border-border/10 align-middle"
                                >
                                  {value ? (
                                    <ModeCell value={value} color={resolvedColor} />
                                  ) : (
                                    <div className="px-3 py-2 text-center text-foreground-tertiary/30">
                                      —
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between text-[10px] text-foreground-tertiary">
          <div>
            Collection: <span className="text-foreground">{activeCollection?.name || 'None'}</span>
          </div>
          <div>
            Groups: <span className="text-foreground">{filteredGroupedData.size}</span>
          </div>
          <div>
            Steps: <span className="text-foreground">
              {Array.from(filteredGroupedData.values()).reduce((sum, g) => sum + g.steps.size, 0)}
            </span>
          </div>
          <div>
            Modes: <span className="text-foreground">{modes.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
