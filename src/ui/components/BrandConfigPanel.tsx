/**
 * Brand Config Panel
 * Configuration interface for brand colors and palette selection
 */

import React, { useState, useMemo } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { useVariablesViewStore } from '@/store/variables-view-store';
import { CompactPaletteSelector } from './CompactPaletteSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CompactButton } from './common/CompactButton';
import { Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { BrandGenerator } from '@/lib/brand-generator';
import { EmptyState } from './EmptyState';

export function BrandConfigPanel() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const updateBrandPalette = useBrandStore((state) => state.updateBrandPalette);
  
  const configPanelCollapsed = useVariablesViewStore((state) => state.configPanelCollapsed);
  const configPanelWidth = useVariablesViewStore((state) => state.configPanelWidth);
  const toggleConfigPanel = useVariablesViewStore((state) => state.toggleConfigPanel);
  const setConfigPanelWidth = useVariablesViewStore((state) => state.setConfigPanelWidth);
  
  const [isResizing, setIsResizing] = useState(false);

  // Move useMemo BEFORE any early returns to comply with Rules of Hooks
  const validation = useMemo(
    () => {
      if (!activeBrand) return { valid: false, errors: [], warnings: [] };
      return BrandGenerator.validate(activeBrand);
    },
    [activeBrand]
  );

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = configPanelWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const newWidth = startWidth + deltaX;
      setConfigPanelWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Collapsed state - show only toggle button
  if (configPanelCollapsed) {
    return (
      <div className="w-12 border-l border-border/40 bg-background flex flex-col items-center py-2 flex-shrink-0">
        <button
          onClick={toggleConfigPanel}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface/50 text-foreground-tertiary"
          title="Expand Configuration"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    );
  }
  
  // Handle null activeBrand case
  if (!activeBrand) {
    return (
      <div 
        className="border-l border-border/40 bg-background flex flex-col relative flex-shrink-0"
        style={{ width: `${configPanelWidth}px`, minWidth: '280px', maxWidth: '500px' }}
      >
        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-border-strong/30 transition-colors ${
            isResizing ? 'bg-border-strong/50' : ''
          }`}
        />
        
        {/* Collapse Button */}
        <div className="pl-4 pr-4 py-2 border-b border-border/40 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Configuration</h2>
          <button
            onClick={toggleConfigPanel}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-surface/50 text-foreground-tertiary"
            title="Collapse Panel"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="h-full flex items-center justify-center">
          <EmptyState
            title="Select or create a brand to configure"
            className="py-4"
          />
        </div>
      </div>
    );
  }

  const handleUpdatePalette = (
    role: 'primary' | 'secondary' | 'sparkle' | 'neutral',
    paletteId: string,
    paletteName: string
  ) => {
    updateBrandPalette(activeBrand.id, role, paletteId, paletteName);
  };

  const handleUpdateSemantic = (
    role: 'positive' | 'negative' | 'warning' | 'informative',
    paletteId: string,
    paletteName: string
  ) => {
    const newColors = {
      ...activeBrand.colors,
      semantic: {
        ...activeBrand.colors.semantic,
        [role]: { paletteId, paletteName }
      }
    };
    useBrandStore.getState().updateBrand(activeBrand.id, { colors: newColors });
  };

  return (
    <div 
      className="h-full flex flex-col border-l border-border/40 bg-background relative flex-shrink-0"
      style={{ width: `${configPanelWidth}px`, minWidth: '280px', maxWidth: '500px' }}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-border-strong/30 transition-colors z-20 ${
          isResizing ? 'bg-border-strong/50' : ''
        }`}
      />
      
      {/* Header */}
      <div className="px-3 py-2 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-semibold text-foreground-secondary">
            {activeBrand.name}
          </h2>
          <button
            onClick={toggleConfigPanel}
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-interactive-hover text-foreground-tertiary"
            title="Collapse Panel"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Config Content */}
      <ScrollArea className="flex-1 w-full max-w-full">
        <div className="pl-3 pt-3 pb-3 pr-3 space-y-4 w-full max-w-full">
          {/* Required Palettes - Single Column */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">
              Required Palettes
            </h3>
            <div className="space-y-2">
              <CompactPaletteSelector
                label="Primary"
                value={activeBrand.colors.primary.paletteId}
                paletteName={activeBrand.colors.primary.paletteName}
                onChange={(id, name) => handleUpdatePalette('primary', id, name)}
                required
                compact
              />
              <CompactPaletteSelector
                label="Secondary"
                value={activeBrand.colors.secondary.paletteId}
                paletteName={activeBrand.colors.secondary.paletteName}
                onChange={(id, name) => handleUpdatePalette('secondary', id, name)}
                required
                compact
              />
              <CompactPaletteSelector
                label="Sparkle"
                value={activeBrand.colors.sparkle.paletteId}
                paletteName={activeBrand.colors.sparkle.paletteName}
                onChange={(id, name) => handleUpdatePalette('sparkle', id, name)}
                required
                compact
              />
              <CompactPaletteSelector
                label="Neutral"
                value={activeBrand.colors.neutral.paletteId}
                paletteName={activeBrand.colors.neutral.paletteName}
                onChange={(id, name) => handleUpdatePalette('neutral', id, name)}
                required
                compact
              />
            </div>
          </div>

          {/* Semantic Colors - Single Column */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-2">
              Semantic Colors
            </h3>
            <div className="space-y-2">
              <CompactPaletteSelector
                label="Positive"
                value={activeBrand.colors.semantic.positive.paletteId}
                paletteName={activeBrand.colors.semantic.positive.paletteName}
                onChange={(id, name) => handleUpdateSemantic('positive', id, name)}
                compact
              />
              <CompactPaletteSelector
                label="Negative"
                value={activeBrand.colors.semantic.negative.paletteId}
                paletteName={activeBrand.colors.semantic.negative.paletteName}
                onChange={(id, name) => handleUpdateSemantic('negative', id, name)}
                compact
              />
              <CompactPaletteSelector
                label="Warning"
                value={activeBrand.colors.semantic.warning.paletteId}
                paletteName={activeBrand.colors.semantic.warning.paletteName}
                onChange={(id, name) => handleUpdateSemantic('warning', id, name)}
                compact
              />
              <CompactPaletteSelector
                label="Informative"
                value={activeBrand.colors.semantic.informative.paletteId}
                paletteName={activeBrand.colors.semantic.informative.paletteName}
                onChange={(id, name) => handleUpdateSemantic('informative', id, name)}
                compact
              />
            </div>
          </div>

          {/* Warnings (if any) */}
          {validation.valid && validation.warnings && validation.warnings.length > 0 && (
            <div className="bg-surface-elevated border-l-2 border-l-yellow-500 rounded p-3">
              <div className="text-xs font-semibold text-yellow-500 mb-2">Warnings</div>
              <div className="space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <div key={idx} className="text-xs text-foreground-secondary">
                    • {warning}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
