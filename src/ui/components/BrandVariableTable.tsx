/**
 * Brand Variable Table
 * Flat table showing variables with mode columns (no accordion)
 * Filtering handled by hierarchical Groups sidebar
 */

import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ModeCell } from './variables/ModeCell';
import { brandToFigmaAdapter } from '@/adapters/brandToFigmaVariables';
import { HierarchyParser } from '@/lib/hierarchy-parser';
import { EmptyState } from './EmptyState';

// Threshold for enabling virtualization
const VIRTUALIZATION_THRESHOLD = 100;

// Style constants to prevent object recreation on every render
const LOADING_CONTAINER_STYLE = {
  padding: '40px',
  textAlign: 'center' as const,
  color: 'var(--text-secondary)'
};

const LOADING_TITLE_STYLE = {
  fontSize: '14px',
  marginBottom: '8px'
};

const LOADING_SUBTITLE_STYLE = {
  fontSize: '12px'
};

// Uniform row height to prevent virtualizer measurement loops
const ROW_HEIGHT = 32;

// Column width constants - minimums for scrollable layout
const MIN_NAME_WIDTH = 200;
const MIN_MODE_WIDTH = 180;

// Threshold for switching to responsive (percentage-based) layout
// When 2 or fewer modes, use full-width responsive layout
const RESPONSIVE_MODE_THRESHOLD = 2;

// Memoized ColGroup component to enforce consistent column widths
// Supports both responsive (percentage) and fixed (pixel) layouts
const TableColGroup = React.memo(({ modeCount, isResponsive }: { modeCount: number; isResponsive: boolean }) => {
  if (isResponsive && modeCount > 0) {
    // Responsive layout: Name column gets 30%, modes share remaining 70% equally
    const modeWidthPercent = 70 / modeCount;
    return (
      <colgroup>
        <col style={{ width: '30%', minWidth: MIN_NAME_WIDTH }} />
        {Array.from({ length: modeCount }).map((_, i) => (
          <col key={i} style={{ width: `${modeWidthPercent}%`, minWidth: MIN_MODE_WIDTH }} />
        ))}
      </colgroup>
    );
  }
  
  // Fixed layout: Use minimum pixel widths for horizontal scroll
  return (
    <colgroup>
      <col style={{ width: MIN_NAME_WIDTH }} />
      {Array.from({ length: modeCount }).map((_, i) => (
        <col key={i} style={{ width: MIN_MODE_WIDTH }} />
      ))}
    </colgroup>
  );
});
TableColGroup.displayName = 'TableColGroup';

export function BrandVariableTable() {
  // FIX: Subscribe with custom equality functions to prevent infinite re-renders
  // Primitive values - stable
  const activeBrandId = useBrandStore((state) => state.activeBrandId);
  const isLoading = useBrandStore((state) => state.isLoading);
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const searchQuery = useVariablesViewStore((state) => state.searchQuery);
  const setSearchQuery = useVariablesViewStore((state) => state.setSearchQuery);
  
  // Map - use size comparison
  const brandsById = useBrandStore(
    (state) => state.brandsById,
    (a, b) => a === b || (a?.size === b?.size)
  );
  
  // Arrays - use length + ID comparison
  const brands = useBrandStore(
    (state) => state.brands,
    (a, b) => {
      if (a === b) return true;
      if (a.length !== b.length) return false;
      if (a.length === 0) return true;
      return a[0]?.id === b[0]?.id;
    }
  );
  
  // hierarchyPath - compare by joining (stable string)
  const hierarchyPath = useVariablesViewStore(
    (state) => state.hierarchyPath,
    (a, b) => a === b || a.join('/') === b.join('/')
  );
  
  // Collections - use length + ID comparison
  const collections = useBrandStore(
    (state) => state.figmaCollections,
    (a, b) => {
      if (a === b) return true;
      if (a.length !== b.length) return false;
      if (a.length === 0) return true;
      return a[0]?.id === b[0]?.id;
    }
  );
  // FIX: Use custom equality for Map to prevent re-renders when reference changes but contents are same
  const allVariablesMap = useBrandStore(
    (state) => state.figmaVariablesByCollection,
    (a, b) => {
      // Compare Map size first for quick check
      if (a.size !== b.size) return false;
      // For now, consider Maps equal if they have the same size
      // A full deep comparison would be too expensive for large Maps
      return true;
    }
  );
  
  // ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURNS (React rules of hooks)
  
  // Compute activeBrand with useMemo to prevent infinite loops
  const activeBrand = useMemo(() => {
    if (activeBrandId === '__all__') return null;
    if (!brandsById) return brands.find((b) => b.id === activeBrandId) || null;
    return brandsById.get(activeBrandId || '') || null;
  }, [activeBrandId, brandsById, brands]);
  
  // Create stable dependency for hierarchyPath to avoid infinite re-renders
  const hierarchyPathKey = useMemo(() => hierarchyPath.join('/'), [hierarchyPath]);
  
  // Track last refreshed state to prevent redundant calls
  const lastRefreshRef = useRef<string | null>(null);
  
  // Refresh variables when collection or hierarchy path changes
  // Uses ref to prevent redundant calls when dependencies haven't actually changed
  useEffect(() => {
    if (activeCollectionId) {
      const refreshKey = `${activeCollectionId}:${hierarchyPathKey}`;
      
      // Skip if we've already refreshed for this exact state
      if (lastRefreshRef.current === refreshKey) {
        return;
      }
      
      lastRefreshRef.current = refreshKey;
      // Read hierarchyPath from store to avoid dependency issues
      const currentHierarchyPath = useVariablesViewStore.getState().hierarchyPath;
      const groupId = currentHierarchyPath.length > 0 ? currentHierarchyPath[0] : 'all';
      useBrandStore.getState().refreshFigmaVariables(activeCollectionId, groupId);
    }
  }, [activeCollectionId, hierarchyPathKey]);
  
  // Get active collection
  const activeCollection = useMemo(() => 
    collections.find((c) => c.id === activeCollectionId),
    [collections, activeCollectionId]
  );
  
  // FIX: Memoize modes to prevent new empty array on every render
  const modes = useMemo(() => activeCollection?.modes || [], [activeCollection]);
  
  // FIX: Memoize allVariables to prevent new empty array on every render  
  const allVariables = useMemo(
    () => allVariablesMap.get(activeCollectionId || '') || [],
    [allVariablesMap, activeCollectionId]
  );
  
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
  
  // Validate brand (skip validation for "All" view)
  const validation = useMemo(() => {
    if (activeBrandId === '__all__') {
      // "All" view is always valid if we have collections
      return { valid: true, errors: [], warnings: [] };
    }
    if (!activeBrand) return { valid: false, errors: [], warnings: [] };
    return BrandGenerator.validate(activeBrand);
  }, [activeBrand, activeBrandId]);
  
  // Group variables by parent path (all segments except last)
  const groupedVariables = useMemo(() => {
    const groups: { [key: string]: typeof filteredVariables } = {};
    
    filteredVariables.forEach((variable) => {
      const segments = HierarchyParser.parseVariableName(variable.name);
      
      // Group by parent path (all segments except last)
      // e.g., "Grey/Default/Ghost/Surface" → "Grey / Default / Ghost"
      const groupName = segments.length > 1 
        ? segments.slice(0, -1).join(' / ')
        : 'Root';
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(variable);
    });
    
    // Sort variables within each group by name
    Object.values(groups).forEach(vars => {
      vars.sort((a, b) => a.name.localeCompare(b.name));
    });
    
    return groups;
  }, [filteredVariables]);
  
  // FIX: Track previous flattenedRows to maintain stable reference
  const prevFlattenedRowsRef = useRef<Array<{ type: 'group'; groupName: string; count: number } | { type: 'variable'; variable: any }>>([]);
  
  // Flatten grouped variables for virtualization (only if needed)
  const flattenedRows = useMemo(() => {
    const rows: Array<{ type: 'group'; groupName: string; count: number } | { type: 'variable'; variable: any }> = [];
    
    Object.entries(groupedVariables)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([groupName, variables]) => {
        rows.push({ type: 'group', groupName, count: variables.length });
        variables.forEach((variable) => {
          rows.push({ type: 'variable', variable });
        });
      });
    
    // FIX: Only return new array if length changed (stable reference to break virtualizer loop)
    if (rows.length === prevFlattenedRowsRef.current.length) {
      return prevFlattenedRowsRef.current;
    }
    
    prevFlattenedRowsRef.current = rows;
    return rows;
  }, [groupedVariables]);
  
  // Determine if we should use virtualization
  const shouldVirtualize = filteredVariables.length > VIRTUALIZATION_THRESHOLD;
  
  // Ref for scrollable container
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
  // FIX: Memoize getScrollElement to prevent new function on every render
  const getScrollElement = useCallback(() => tableContainerRef.current, []);
  
  // FIX: Use uniform row height to prevent virtualizer measurement loops
  const estimateSize = useCallback(() => ROW_HEIGHT, []);
  
  // Setup virtualizer only if needed
  const rowVirtualizer = useVirtualizer({
    count: flattenedRows.length,
    getScrollElement,
    estimateSize,
    overscan: 10, // Render 10 extra rows above/below viewport
    enabled: shouldVirtualize,
  });
  
  // NOW we can have conditional returns (after all hooks)
  
  // Show loading state during initialization
  if (isLoading && brands.length === 0) {
    return (
      <div style={LOADING_CONTAINER_STYLE}>
        <div style={LOADING_TITLE_STYLE}>Loading variables...</div>
        <div style={LOADING_SUBTITLE_STYLE}>Initializing brand data</div>
      </div>
    );
  }
  
  // Handle different states
  if (!activeBrand && activeBrandId !== '__all__') {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <EmptyState
          title="Select a brand to view variables"
          className="py-4"
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

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header - Figma style with collection name */}
      <div className="h-9 px-3 py-1.5 border-b border-border/30 flex-shrink-0 flex items-center justify-between">
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
            <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 w-3 h-3 text-foreground-tertiary" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-6 w-40 pl-6 pr-2 text-xs bg-background border-border/40"
            />
          </div>
        </div>
      </div>

      {/* Variables Table with Group Headers - Unified structure for both virtualized and non-virtualized */}
      {filteredVariables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-12 text-foreground-secondary text-xs">
            {searchQuery ? 'No variables match your search' : 'No variables in this collection'}
          </div>
        </div>
      ) : shouldVirtualize ? (
        // Virtualized rendering for large lists (> 100 variables)
        // Uses padding-based virtualization with single table for native sticky header
        (() => {
          const virtualItems = rowVirtualizer.getVirtualItems();
          const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
          const paddingBottom = virtualItems.length > 0 
            ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end 
            : 0;
          
          // Use responsive layout for 1-2 modes, fixed layout for more
          const isResponsive = modes.length <= RESPONSIVE_MODE_THRESHOLD;
          
          return (
            <div ref={tableContainerRef} className="flex-1 overflow-auto">
              {/* IMPORTANT: Use border-separate, NOT border-collapse - border-collapse breaks position:sticky */}
              <table 
                className="text-xs" 
                style={{ 
                  borderCollapse: 'separate', 
                  borderSpacing: 0, 
                  tableLayout: 'fixed',
                  width: isResponsive ? '100%' : 'auto',
                  minWidth: isResponsive ? 'auto' : `${MIN_NAME_WIDTH + modes.length * MIN_MODE_WIDTH}px`
                }}
              >
                <TableColGroup modeCount={modes.length} isResponsive={isResponsive} />
                {/* NOTE: sticky must be on <th> cells, NOT on <thead> - CSS spec limitation */}
                <thead>
                  <tr className="border-b border-border/40">
                    {/* Name column: sticky both vertically (top:0) and horizontally (left:0) */}
                    <th className="sticky top-0 left-0 z-40 bg-background text-left px-3 py-2 border-r border-border/20">
                      <span className="text-[11px] font-medium text-foreground-secondary">
                        Name
                      </span>
                    </th>
                    {/* Mode columns: sticky vertically only */}
                    {modes.map((mode) => (
                      <th 
                        key={mode.modeId} 
                        className="sticky top-0 z-30 bg-background text-left px-3 py-2 border-r border-border/40 whitespace-nowrap"
                      >
                        <span className="text-[11px] font-medium text-foreground-secondary">
                          {mode.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Top padding spacer for virtualization */}
                  {paddingTop > 0 && (
                    <tr aria-hidden="true">
                      <td 
                        colSpan={1 + modes.length} 
                        style={{ height: paddingTop, padding: 0, border: 'none' }} 
                      />
                    </tr>
                  )}
                  
                  {/* Virtual rows - rendered without absolute positioning */}
                  {virtualItems.map((virtualRow) => {
                    const row = flattenedRows[virtualRow.index];
                    
                    if (row.type === 'group') {
                      return (
                        <tr 
                          key={`group-${virtualRow.index}`}
                          className="bg-surface"
                          style={{ height: ROW_HEIGHT }}
                        >
                          <td className="sticky left-0 z-20 bg-surface px-3 py-1.5 border-b border-border/50 border-r border-border/20 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide truncate">
                                {row.groupName}
                              </span>
                              <span className="text-[9px] text-foreground-tertiary flex-shrink-0">
                                ({row.count})
                              </span>
                            </div>
                          </td>
                          {modes.map((mode) => (
                            <td 
                              key={mode.modeId}
                              className="bg-surface border-b border-border/50 border-r border-border/40"
                            />
                          ))}
                        </tr>
                      );
                    } else {
                      const variable = row.variable;
                      return (
                        <tr 
                          key={`var-${variable.id}`}
                          className="border-b border-border/40 hover:bg-interactive-hover transition-colors group"
                          style={{ height: ROW_HEIGHT }}
                        >
                          <td className="sticky left-0 z-10 bg-background group-hover:bg-interactive-hover px-3 py-1.5 border-r border-border/40 transition-colors overflow-hidden">
                            <span className="text-[11px] text-foreground block truncate" title={variable.name}>
                              {HierarchyParser.getLastSegment(variable.name)}
                            </span>
                          </td>
                          
                          {modes.map((mode) => {
                            const value = variable.valuesByMode[mode.modeId];
                            const resolvedColor = variable.resolvedValuesByMode[mode.modeId];
                            
                            return (
                              <td 
                                key={mode.modeId} 
                                className="border-r border-border/40 align-middle overflow-hidden"
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
                      );
                    }
                  })}
                  
                  {/* Bottom padding spacer for virtualization */}
                  {paddingBottom > 0 && (
                    <tr aria-hidden="true">
                      <td 
                        colSpan={1 + modes.length} 
                        style={{ height: paddingBottom, padding: 0, border: 'none' }} 
                      />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()
      ) : (
        // Non-virtualized rendering for small lists (≤ 100 variables)
        (() => {
          // Use responsive layout for 1-2 modes, fixed layout for more
          const isResponsive = modes.length <= RESPONSIVE_MODE_THRESHOLD;
          
          return (
            <div ref={tableContainerRef} className="flex-1 overflow-auto">
              {/* IMPORTANT: Use border-separate, NOT border-collapse - border-collapse breaks position:sticky */}
              <table 
                className="text-xs" 
                style={{ 
                  borderCollapse: 'separate', 
                  borderSpacing: 0, 
                  tableLayout: 'fixed',
                  width: isResponsive ? '100%' : 'auto',
                  minWidth: isResponsive ? 'auto' : `${MIN_NAME_WIDTH + modes.length * MIN_MODE_WIDTH}px`
                }}
              >
                <TableColGroup modeCount={modes.length} isResponsive={isResponsive} />
                {/* NOTE: sticky must be on <th> cells, NOT on <thead> - CSS spec limitation */}
                <thead>
                  <tr className="border-b border-border/40">
                    {/* Name column: sticky both vertically (top:0) and horizontally (left:0) */}
                    <th className="sticky top-0 left-0 z-40 bg-background text-left px-3 py-2 border-r border-border/20">
                      <span className="text-[11px] font-medium text-foreground-secondary">
                        Name
                      </span>
                    </th>
                    {/* Mode columns: sticky vertically only */}
                    {modes.map((mode) => (
                      <th 
                        key={mode.modeId} 
                        className="sticky top-0 z-30 bg-background text-left px-3 py-2 border-r border-border/40 whitespace-nowrap"
                      >
                        <span className="text-[11px] font-medium text-foreground-secondary">
                          {mode.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                
                <tbody>
                  {Object.entries(groupedVariables)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([groupName, variables]) => (
                    <React.Fragment key={groupName}>
                      {/* Group header row - sticky below main header */}
                      <tr className="bg-surface">
                        <td className="sticky top-[33px] left-0 z-20 bg-surface px-3 py-1.5 border-b border-border/50 border-r border-border/20 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide truncate">
                              {groupName}
                            </span>
                            <span className="text-[9px] text-foreground-tertiary flex-shrink-0">
                              ({variables.length})
                            </span>
                          </div>
                        </td>
                        {modes.map((mode) => (
                          <td 
                            key={mode.modeId}
                            className="sticky top-[33px] z-15 bg-surface border-b border-border/50 border-r border-border/40"
                          />
                        ))}
                      </tr>
                      
                      {variables.map((variable) => (
                        <tr 
                          key={variable.id} 
                          className="border-b border-border/40 hover:bg-interactive-hover transition-colors group"
                        >
                          <td className="sticky left-0 z-10 bg-background group-hover:bg-interactive-hover px-3 py-1.5 border-r border-border/40 transition-colors overflow-hidden">
                            <span className="text-[11px] text-foreground block truncate" title={variable.name}>
                              {HierarchyParser.getLastSegment(variable.name)}
                            </span>
                          </td>
                          
                          {modes.map((mode) => {
                            const value = variable.valuesByMode[mode.modeId];
                            const resolvedColor = variable.resolvedValuesByMode[mode.modeId];
                            
                            return (
                              <td 
                                key={mode.modeId} 
                                className="border-r border-border/40 align-middle overflow-hidden"
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
            </div>
          );
        })()
      )}

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
