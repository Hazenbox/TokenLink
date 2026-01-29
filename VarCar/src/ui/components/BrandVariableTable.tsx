/**
 * Brand Variable Table
 * Flat table showing variables with mode columns (no accordion)
 * Filtering handled by hierarchical Groups sidebar
 */

import React, { useMemo, useEffect } from 'react';
import { shallow } from 'zustand/shallow';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
import { ModeCell } from './variables/ModeCell';
import { brandToFigmaAdapter } from '@/adapters/brandToFigmaVariables';
import { HierarchyParser } from '@/lib/hierarchy-parser';
import { EmptyState } from './EmptyState';

export function BrandVariableTable() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const hierarchyPath = useVariablesViewStore((state) => state.hierarchyPath);
  const searchQuery = useVariablesViewStore((state) => state.searchQuery);
  const setSearchQuery = useVariablesViewStore((state) => state.setSearchQuery);
  
  // Simple state selectors - no function calls
  const collections = useBrandStore((state) => state.figmaCollections, shallow);
  const allVariablesMap = useBrandStore((state) => state.figmaVariablesByCollection, shallow);
  
  // Refresh variables when collection or hierarchy path changes
  useEffect(() => {
    if (activeCollectionId) {
      const groupId = hierarchyPath.length > 0 ? hierarchyPath[0] : 'all';
      useBrandStore.getState().refreshFigmaVariables(activeCollectionId, groupId);
    }
  }, [activeCollectionId, hierarchyPath]);
  
  // Get active collection
  const activeCollection = useMemo(() => 
    collections.find((c) => c.id === activeCollectionId),
    [collections, activeCollectionId]
  );
  
  const modes = activeCollection?.modes || [];
  
  // Get all variables for active collection
  const allVariables = allVariablesMap.get(activeCollectionId || '') || [];
  
  // Apply hierarchical filtering: hierarchy path + search
  const filteredVariables = useMemo(() => {
    let filtered = allVariables;
    
    // Filter by hierarchy path
    if (hierarchyPath.length > 0) {
      filtered = brandToFigmaAdapter.filterVariablesByHierarchyPath(filtered, hierarchyPath);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v => v.name.toLowerCase().includes(query));
    }
    
    return filtered;
  }, [allVariables, hierarchyPath, searchQuery]);
  
  // Validate brand
  const validation = useMemo(() => {
    if (!activeBrand) return { valid: false, errors: [], warnings: [] };
    return BrandGenerator.validate(activeBrand);
  }, [activeBrand]);

  // Handle export
  const handleExport = () => {
    if (!activeBrand) return;
    
    // Determine max hierarchy depth for CSV columns
    const maxDepth = Math.max(
      ...filteredVariables.map(v => HierarchyParser.parseVariableName(v.name).length),
      0
    );
    
    // Create dynamic hierarchy column headers
    const hierarchyHeaders = Array.from({ length: maxDepth }, (_, i) => `Level ${i + 1}`);
    const headers = [...hierarchyHeaders, ...modes.map(m => m.name)];
    const rows: string[] = [];
    
    filteredVariables.forEach((variable) => {
      // Parse name into segments
      const segments = HierarchyParser.parseVariableName(variable.name);
      
      // Pad segments to max depth
      const paddedSegments = [
        ...segments,
        ...Array(maxDepth - segments.length).fill('')
      ];
      
      const row = [
        ...paddedSegments,
        ...modes.map((mode) => variable.resolvedValuesByMode[mode.modeId] || '')
      ];
      rows.push(row.join(','));
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
      <div className="h-full flex items-center justify-center bg-background">
        <EmptyState
          title="Select a brand to view variables"
          className="py-12"
        />
      </div>
    );
  }
  
  if (!validation.valid) {
    return (
      <div className="h-full flex items-center justify-center p-4 bg-background">
        <div className="text-center max-w-md">
          <h3 className="text-sm font-semibold text-foreground mb-2">
            Configuration Required
          </h3>
          <p className="text-xs text-foreground-secondary mb-4">
            Assign palettes in the configuration panel to generate variables
          </p>
          {validation.errors.length > 0 && (
            <div className="text-left bg-surface border-l-2 border-l-red-500 rounded p-3">
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
      <div className="h-full flex items-center justify-center text-foreground-secondary text-sm p-4 bg-background">
        Select a collection to view variables
      </div>
    );
  }

  // Group variables by their first hierarchy level (color groups)
  const groupedVariables = useMemo(() => {
    const groups: { [key: string]: typeof filteredVariables } = {};
    
    filteredVariables.forEach((variable) => {
      const segments = HierarchyParser.parseVariableName(variable.name);
      const groupName = segments[0] || 'Other';
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(variable);
    });
    
    return groups;
  }, [filteredVariables]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Figma style with collection name */}
      <div className="px-3 py-2 border-b border-border/30 flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[11px] font-semibold text-foreground-secondary">
            {activeCollection?.name || 'Variables'}
          </h2>
          <span className="text-[10px] text-foreground-tertiary">
            {filteredVariables.length}
          </span>
        </div>
        
        {/* Search - Compact inline */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-foreground-tertiary" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 w-48 pl-7 text-xs bg-background border-border/40"
            />
          </div>
          <Button
            onClick={handleExport}
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-foreground-tertiary hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Variables Table with Group Headers - Native Scrolling */}
      <div className="flex-1 overflow-x-auto overflow-y-auto relative">
        {filteredVariables.length === 0 ? (
          <div className="text-center py-12 text-foreground-secondary text-xs">
            {searchQuery ? 'No variables match your search' : 'No variables in this collection'}
          </div>
        ) : (
          <table className="w-full border-collapse text-xs">
            <thead className="sticky top-0 z-10 bg-background">
              <tr className="border-b border-border/40">
                {/* Variable Name Column - Sticky Header + Sticky Column */}
                <th className="sticky left-0 z-20 bg-background text-left px-3 py-2 border-r border-border/20 before:absolute before:inset-0 before:bg-background before:-z-10">
                  <span className="text-[11px] font-medium text-foreground-secondary relative z-10">
                    Name
                  </span>
                </th>
                
                {/* Mode Columns */}
                {modes.map((mode) => (
                  <th 
                    key={mode.modeId} 
                    className="text-left px-3 py-2 min-w-[200px] border-r border-border/40 whitespace-nowrap"
                  >
                    <span className="text-[11px] font-medium text-foreground-secondary">
                      {mode.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody>
              {Object.entries(groupedVariables).map(([groupName, variables]) => (
                <React.Fragment key={groupName}>
                  {/* Group Header Row */}
                  <tr className="bg-surface/20">
                    <td 
                      colSpan={modes.length + 1}
                      className="px-3 py-2 border-b border-border/40"
                    >
                      <span className="text-[11px] font-semibold text-foreground">
                        {groupName}
                      </span>
                    </td>
                  </tr>
                  
                  {/* Variables in this group */}
                  {variables.map((variable) => (
                    <tr 
                      key={variable.id} 
                      className="border-b border-border/40 hover:bg-interactive-hover transition-colors group"
                    >
                      {/* Variable Name - Sticky Column with hover state */}
                      <td className="sticky left-0 z-10 bg-background group-hover:bg-interactive-hover px-3 py-1.5 border-r border-border/40 transition-colors before:absolute before:inset-0 before:bg-background before:group-hover:bg-interactive-hover before:-z-10 before:transition-colors relative">
                        <div className="relative z-10">
                          <span className="text-[11px] text-foreground whitespace-nowrap truncate" title={variable.name}>
                            {HierarchyParser.getLastSegment(variable.name)}
                          </span>
                        </div>
                      </td>
                      
                      {/* Mode Values */}
                      {modes.map((mode) => {
                        const value = variable.valuesByMode[mode.modeId];
                        const resolvedColor = variable.resolvedValuesByMode[mode.modeId];
                        
                        return (
                          <td 
                            key={mode.modeId} 
                            className="border-r border-border/40 align-middle min-w-[200px]"
                          >
                            {value ? (
                              <ModeCell value={value} color={resolvedColor} />
                            ) : (
                              <div className="px-3 py-1.5 text-foreground-tertiary/30">
                                —
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Stats - Minimal */}
      <div className="px-3 py-2 border-t border-border/40 flex-shrink-0 bg-background">
        <div className="flex items-center gap-4 text-[10px] text-foreground-tertiary">
          <div>
            <span className="text-foreground-secondary">{filteredVariables.length}</span> variables
          </div>
          <div>
            <span className="text-foreground-secondary">{modes.length}</span> modes
          </div>
        </div>
      </div>
    </div>
  );
}
