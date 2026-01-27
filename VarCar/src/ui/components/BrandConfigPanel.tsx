/**
 * Brand Config Panel
 * Configuration interface for brand colors and palette selection
 */

import React, { useState, useMemo } from 'react';
import { useBrandStore } from '@/store/brand-store';
import { CompactPaletteSelector } from './CompactPaletteSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Info, ChevronDown, ChevronUp, Upload } from 'lucide-react';
import { BrandGenerator } from '@/lib/brand-generator';

export function BrandConfigPanel() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const updateBrandPalette = useBrandStore((state) => state.updateBrandPalette);
  const syncBrand = useBrandStore((state) => state.syncBrand);
  const syncStatus = useBrandStore((state) => state.syncStatus);
  const canSync = useBrandStore((state) => state.canSync());
  
  const [showInfo, setShowInfo] = useState(false);

  // Move useMemo BEFORE any early returns to comply with Rules of Hooks
  const validation = useMemo(
    () => {
      if (!activeBrand) return { valid: false, errors: [], warnings: [] };
      return BrandGenerator.validate(activeBrand);
    },
    [activeBrand]
  );

  // Handle null activeBrand case
  if (!activeBrand) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-secondary text-sm">
        Select or create a brand to configure
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
    if (!validation.valid) {
      alert('Cannot sync: Brand has validation errors. Please fix them first.');
      return;
    }

    if (!canSync) {
      alert('Rate limit exceeded. Please wait before syncing again.');
      return;
    }

    await syncBrand(activeBrand.id);
  };

  const canSyncBrand = validation.valid && canSync && syncStatus === 'idle';

  return (
    <div className="h-full flex flex-col">
      {/* Header with Sync Button */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {activeBrand.name}
            </h2>
            <p className="text-xs text-foreground-secondary">
              Configure palettes
            </p>
          </div>
          <Button
            onClick={handleSync}
            disabled={!canSyncBrand}
            size="sm"
            className="h-7 px-3"
          >
            <Upload className="w-3 h-3 mr-1" />
            Sync to Figma
          </Button>
        </div>

        {/* Collapsible info banner */}
        <div className="mt-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 text-xs text-foreground-secondary hover:text-foreground transition-colors"
          >
            {showInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            <Info className="w-3 h-3" />
            <span>How it works</span>
          </button>
          {showInfo && (
            <div className="mt-2 bg-surface-elevated border-l-2 border-l-blue-500 rounded p-2 text-xs text-foreground-secondary">
              Select palettes from RangDe (Colors tab). The system generates 224 variables
              using 8 scale types (Surface, High, Medium, Low, Heavy, Bold, Bold A11Y, Minimal).
            </div>
          )}
        </div>
      </div>

      {/* Config Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Inline Validation Status */}
          {!validation.valid && validation.errors && validation.errors.length > 0 && (
            <div className="bg-surface-elevated border-l-2 border-l-orange-500 rounded p-3">
              <div className="text-xs font-semibold text-orange-500 mb-2">
                Configuration Incomplete
              </div>
              <div className="space-y-1">
                {validation.errors.map((error, idx) => (
                  <div key={idx} className="text-xs text-foreground-secondary">
                    • {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required Palettes - 2 Column Grid */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-3">
              Required Palettes
            </h3>
            <div className="grid grid-cols-2 gap-3">
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

          {/* Semantic Colors - 2 Column Grid */}
          <div>
            <h3 className="text-xs font-semibold text-foreground mb-3">
              Semantic Colors
            </h3>
            <div className="grid grid-cols-2 gap-3">
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
