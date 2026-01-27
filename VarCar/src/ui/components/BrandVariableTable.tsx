/**
 * Brand Variable Table
 * Figma-like variable table showing palette → variable → mode mappings
 */

import React, { useState, useMemo } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Download, Filter } from 'lucide-react';

export function BrandVariableTable() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'palette' | 'scale'>('all');

  if (!activeBrand) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-secondary text-sm p-4">
        Select a brand to view variables
      </div>
    );
  }

  // Validate brand before generation
  const validation = useMemo(() => BrandGenerator.validate(activeBrand), [activeBrand]);

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

  // Generate brand variables with error handling
  const generatedBrand = useMemo(() => {
    try {
      return BrandGenerator.generateBrand(activeBrand);
    } catch (error) {
      console.error('Failed to generate brand variables:', error);
      return null;
    }
  }, [activeBrand]);

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

  const variables = generatedBrand.variables || [];

  // Filter variables by search query
  const filteredVariables = useMemo(() => {
    if (!variables || variables.length === 0) return [];
    return variables.filter((v) =>
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sourcePalette.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.sourceScale.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [variables, searchQuery]);

  // Group variables by appearance context
  const groupedVariables = useMemo(() => {
    const groups: { [key: string]: typeof variables } = {};
    
    filteredVariables.forEach((variable) => {
      // Extract appearance context from variable name
      // Format: BrandName/Appearance/[appearance] Scale
      const parts = variable.name.split('/');
      if (parts.length >= 2) {
        const appearance = parts[1];
        if (!groups[appearance]) {
          groups[appearance] = [];
        }
        groups[appearance].push(variable);
      }
    });
    
    return groups;
  }, [filteredVariables]);

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
              {Object.entries(groupedVariables).map(([appearance, vars]) => (
                <div key={appearance}>
                  {/* Appearance Group Header */}
                  <div className="sticky top-0 bg-card z-10 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xs font-semibold text-foreground">
                        {appearance}
                      </h3>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-foreground-tertiary">
                        {vars.length} variables
                      </span>
                    </div>
                  </div>

                  {/* Variables Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-1.5 px-2 font-medium text-foreground-secondary text-[10px]">
                            Scale
                          </th>
                          <th className="text-left py-1.5 px-2 font-medium text-foreground-secondary text-[10px]">
                            {activeBrand.name}
                          </th>
                          <th className="text-left py-1.5 px-2 font-medium text-foreground-secondary text-[10px]">
                            Palette
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {vars.map((variable, idx) => {
                          // Extract scale from variable name
                          const scaleMatch = variable.name.match(/\] (.+)$/);
                          const scaleName = scaleMatch ? scaleMatch[1] : variable.sourceScale;

                          return (
                            <tr
                              key={idx}
                              className="border-b border-border/50 hover:bg-surface transition-colors"
                            >
                              <td className="py-1.5 px-2 font-medium text-foreground">
                                {scaleName}
                              </td>
                              <td className="py-1.5 px-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded border border-border flex-shrink-0"
                                    style={{ backgroundColor: variable.value }}
                                    title={variable.value}
                                  />
                                  <span className="text-foreground-secondary font-mono text-[10px]">
                                    {variable.value}
                                  </span>
                                </div>
                              </td>
                              <td className="py-1.5 px-2 text-foreground-secondary">
                                {variable.sourcePalette}
                              </td>
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
