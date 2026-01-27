/**
 * Brand Variable Table
 * Figma-like variable table showing palette → variable → mode mappings
 */

import React, { useState, useMemo } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { GeneratedVariable, AliasReference } from '@/models/brand';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Filter, Link } from 'lucide-react';

// Scale names matching brand-generator.ts
const SCALE_NAMES = [
  'Surface',
  'High',
  'Medium',
  'Low',
  'Heavy',
  'Bold',
  'Bold A11Y',
  'Minimal'
] as const;

// Helper: Truncate alias path for display
function truncateAliasPath(alias: AliasReference): string {
  const path = `${alias.paletteName}/${alias.step}/${alias.scale}`;
  if (path.length > 25) {
    return `.../${alias.step}/${alias.scale}`;
  }
  return path;
}

// Helper: Get step number from variable
function getStepFromVariable(variable: GeneratedVariable): number {
  return variable.aliasTo?.step || 0;
}

// Cell content component
interface CellContentProps {
  variable: GeneratedVariable;
}

function CellContent({ variable }: CellContentProps) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5">
      <div
        className="w-5 h-5 rounded border border-border/30 flex-shrink-0"
        style={{ backgroundColor: variable.value || '#000' }}
        title={variable.value || 'No value'}
      />
      <div className="flex-1 min-w-0">
        {variable.isAliased && variable.aliasTo ? (
          <div className="text-[10px] text-foreground-tertiary font-mono truncate">
            {truncateAliasPath(variable.aliasTo)}
          </div>
        ) : (
          <div className="text-[10px] text-foreground-tertiary font-mono">
            {variable.value || '—'}
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandVariableTable() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'palette' | 'scale'>('all');

  // Move ALL useMemo hooks BEFORE any early returns to comply with Rules of Hooks
  
  // Validate brand before generation
  const validation = useMemo(() => {
    if (!activeBrand) return { valid: false, errors: [], warnings: [] };
    return BrandGenerator.validate(activeBrand);
  }, [activeBrand]);

  // Generate brand variables with error handling
  const generatedBrand = useMemo(() => {
    if (!activeBrand || !validation.valid) return null;
    try {
      return BrandGenerator.generateBrand(activeBrand);
    } catch (error) {
      console.error('Failed to generate brand variables:', error);
      return null;
    }
  }, [activeBrand, validation.valid]);

  const variables = generatedBrand?.variables || [];

  // Filter variables by search query
  const filteredVariables = useMemo(() => {
    if (!variables || variables.length === 0) return [];
    return variables.filter((v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.sourcePalette || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.sourceScale || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [variables, searchQuery]);

  // Group variables by palette → step → scale
  const groupedVariables = useMemo(() => {
    const groups: Record<string, Record<number, Record<string, GeneratedVariable>>> = {};
    
    filteredVariables.forEach((variable) => {
      const palette = variable.sourcePalette || 'Unknown';
      const step = getStepFromVariable(variable);
      const scale = variable.sourceScale || 'Unknown';
      
      if (!groups[palette]) groups[palette] = {};
      if (!groups[palette][step]) groups[palette][step] = {};
      groups[palette][step][scale] = variable;
    });
    
    // Sort palettes alphabetically and steps numerically
    const sortedGroups: typeof groups = {};
    Object.keys(groups).sort().forEach(palette => {
      sortedGroups[palette] = {};
      Object.keys(groups[palette])
        .map(Number)
        .sort((a, b) => a - b)
        .forEach(step => {
          sortedGroups[palette][step] = groups[palette][step];
        });
    });
    
    return sortedGroups;
  }, [filteredVariables]);

  // Handle different states AFTER all hooks are called
  if (!activeBrand) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-secondary text-sm p-4">
        Select a brand to view variables
      </div>
    );
  }

  // Show validation errors if brand is not configured
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

  // Show error if generation failed
  if (!generatedBrand) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-sm text-foreground-secondary mb-2">
            Unable to generate variables
          </p>
          <p className="text-xs text-foreground-tertiary">
            Please check your palette assignments
          </p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    // Export to CSV
    const csv = [
      ['Variable Name', 'Collection', 'Mode', 'Value', 'Scale Type', 'Source Palette'].join(','),
      ...variables.map((v) =>
        [v.name, v.collection, v.mode, v.value, v.sourceScale, v.sourcePalette].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeBrand.name}_variables.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              {filteredVariables.length} of {variables.length} variables
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
            placeholder="Search variables, palettes, scales..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {Object.keys(groupedVariables).length === 0 ? (
            <div className="text-center py-12 text-foreground-secondary text-xs">
              {searchQuery ? 'No variables match your search' : 'No variables generated yet'}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedVariables).map(([paletteName, steps]) => (
                <div key={paletteName}>
                  {/* Palette Group Header */}
                  <div className="sticky top-0 bg-card z-10 pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-foreground">
                        {paletteName}
                      </h3>
                      <div className="flex-1 h-px bg-border/30" />
                      <span className="text-[10px] text-foreground-tertiary">
                        {Object.keys(steps).length} steps
                      </span>
                    </div>
                  </div>

                  {/* Variables Grid Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/20">
                          <th className="text-left py-2 px-3 font-medium text-foreground-secondary text-[10px] sticky left-0 bg-card z-20 border-r border-border/10">
                            Variable
                          </th>
                          {SCALE_NAMES.map((scale) => (
                            <th
                              key={scale}
                              className="text-center py-2 px-2 font-medium text-foreground-secondary text-[10px] min-w-[100px] border-r border-border/10"
                            >
                              {scale}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(steps).map(([stepStr, scales]) => {
                          const step = parseInt(stepStr);
                          
                          return (
                            <tr
                              key={`${paletteName}-${step}`}
                              className="border-b border-border/10 hover:bg-surface/50 transition-colors"
                            >
                              {/* Variable name column */}
                              <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-card z-10 border-r border-border/10">
                                <div className="flex items-center gap-1.5">
                                  <Link className="w-3 h-3 text-foreground-tertiary flex-shrink-0" />
                                  <span className="text-xs">[Child] Step {step}</span>
                                </div>
                              </td>
                              
                              {/* Scale columns */}
                              {SCALE_NAMES.map((scaleName) => {
                                const variable = scales[scaleName];
                                
                                return (
                                  <td
                                    key={scaleName}
                                    className="border-r border-border/10 align-middle"
                                  >
                                    {variable ? (
                                      <CellContent variable={variable} />
                                    ) : (
                                      <div className="px-2 py-1.5 text-center text-foreground-tertiary/30">
                                        —
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center justify-between text-[10px] text-foreground-tertiary">
          <div>
            Collection: <span className="text-foreground">{generatedBrand.statistics.collections[0]}</span>
          </div>
          <div>
            Mode: <span className="text-foreground">{activeBrand.name}</span>
          </div>
          <div>
            Palettes: <span className="text-foreground">{Object.keys(generatedBrand.statistics.paletteUsage).length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
