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
import { Info, ChevronDown, ChevronUp, Upload, ChevronLeft, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { BrandGenerator } from '@/lib/brand-generator';
import { EmptyState } from './EmptyState';

export function BrandConfigPanel() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const updateBrandPalette = useBrandStore((state) => state.updateBrandPalette);
  const syncBrand = useBrandStore((state) => state.syncBrand);
  const syncBrandWithLayers = useBrandStore((state) => state.syncBrandWithLayers);
  const syncStatus = useBrandStore((state) => state.syncStatus);
  const canSync = useBrandStore((state) => state.canSync());
  
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
            className="py-8"
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

  const handleSync = async () => {
    // Validation happens in the store before syncing
    // User will see error toast via useFigmaMessages hook
    await syncBrandWithLayers(activeBrand.id);
  };

  const canSyncBrand = validation.valid && canSync && syncStatus === 'idle';
  
  // Get sync button content based on status
  const getSyncButtonContent = () => {
    switch (syncStatus) {
      case 'validating':
        return (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Validating...</span>
          </>
        );
      case 'previewing':
        return (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Generating...</span>
          </>
        );
      case 'syncing':
        return (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Syncing...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Synced!</span>
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <Upload className="w-3.5 h-3.5" />
            <span>Sync to Figma</span>
          </>
        );
    }
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
      
      {/* Header with Sync Button */}
      <div className="px-3 py-2 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
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
        
        <button
          onClick={handleSync}
          disabled={!canSyncBrand}
          className={`
            w-full h-8 px-3 rounded-md text-xs font-medium
            flex items-center justify-center gap-2
            transition-all duration-200
            ${canSyncBrand 
              ? 'bg-surface-elevated hover:bg-interactive-hover text-foreground' 
              : 'bg-surface border border-border text-foreground-tertiary cursor-not-allowed'}
            ${syncStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}
            ${syncStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : ''}
          `}
        >
          {getSyncButtonContent()}
        </button>
        
        {/* Sync status message */}
        {!canSyncBrand && syncStatus === 'idle' && (
          <div className="mt-2 text-xs text-orange-500">
            {!validation.valid && '⚠ Fix validation errors first'}
            {validation.valid && !canSync && '⚠ Rate limit: Wait before syncing again'}
          </div>
        )}

      </div>

      {/* Config Content */}
      <ScrollArea className="flex-1 w-full max-w-full">
        <div className="pl-4 pt-4 pb-4 pr-4 space-y-6 w-full max-w-full">
          {/* Required Palettes - Single Column */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-3">
              Required Palettes
            </h3>
            <div className="space-y-3">
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
            <h3 className="text-xs font-semibold text-foreground mb-3">
              Semantic Colors
            </h3>
            <div className="space-y-3">
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
