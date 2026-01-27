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
import { Search, Download, Link } from 'lucide-react';
import { ModeCell } from './variables/ModeCell';

export function BrandVariableTable() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const activeCollectionId = useVariablesViewStore((state) => state.activeCollectionId);
  const activeGroupId = useVariablesViewStore((state) => state.activeGroupId);
  const searchQuery = useVariablesViewStore((state) => state.searchQuery);
  const setSearchQuery = useVariablesViewStore((state) => state.setSearchQuery);
  
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

  // Filter variables by search query
  const filteredVariables = useMemo(() => {
    if (!searchQuery) return figmaVariables;
    
    const query = searchQuery.toLowerCase();
    return figmaVariables.filter((v) =>
      v.name.toLowerCase().includes(query)
    );
  }, [figmaVariables, searchQuery]);
  
  // Validate brand
  const validation = useMemo(() => {
    if (!activeBrand) return { valid: false, errors: [], warnings: [] };
    return BrandGenerator.validate(activeBrand);
  }, [activeBrand]);

  // Handle export
  const handleExport = () => {
    if (!activeBrand) return;
    
    // Export to CSV with mode columns
    const headers = ['Variable Name', ...modes.map(m => m.name)];
    const rows = filteredVariables.map((variable) => {
      const row = [variable.name];
      modes.forEach((mode) => {
        const color = variable.resolvedValuesByMode[mode.id] || '';
        row.push(color);
      });
      return row.join(',');
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
              {filteredVariables.length} variables
            </p>
          </div>
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
          {filteredVariables.length === 0 ? (
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
                {filteredVariables.map((variable) => (
                  <tr 
                    key={variable.id} 
                    className="border-b border-border/10 hover:bg-surface/50 transition-colors"
                  >
                    {/* Variable Name */}
                    <td className="sticky left-0 z-10 bg-card px-3 py-2 border-r border-border/10">
                      <div className="flex items-center gap-2">
                        <Link className="w-3 h-3 text-foreground-tertiary flex-shrink-0" />
                        <span className="text-[11px] text-foreground">{variable.name}</span>
                      </div>
                    </td>
                    
                    {/* Mode Values */}
                    {modes.map((mode) => {
                      const value = variable.valuesByMode[mode.id];
                      const resolvedColor = variable.resolvedValuesByMode[mode.id];
                      
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
                ))}
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
            Variables: <span className="text-foreground">{filteredVariables.length}</span>
          </div>
          <div>
            Modes: <span className="text-foreground">{modes.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
