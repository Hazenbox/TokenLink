/**
 * Brand Config Panel
 * Configuration interface for brand colors and palette selection
 */

import React from 'react';
import { useBrandStore } from '@/store/brand-store';
import { PaletteSelector } from './PaletteSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

export function BrandConfigPanel() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());
  const updateBrandPalette = useBrandStore((state) => state.updateBrandPalette);

  if (!activeBrand) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-sm">
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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {activeBrand.name}
          </h2>
          <p className="text-sm text-gray-500">
            Configure color palettes for this brand
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">How it works</p>
            <p>
              Select palettes from RangDe (Colors tab) for each role. The system will
              automatically generate 224 theme variables using the 8 scale types (Surface,
              High, Medium, Low, Heavy, Bold, Bold A11Y, Minimal) for each palette.
            </p>
          </div>
        </div>

        {/* Required Palettes */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Required Palettes
            </h3>
            <div className="space-y-4">
              <PaletteSelector
                label="Primary"
                value={activeBrand.colors.primary.paletteId}
                paletteName={activeBrand.colors.primary.paletteName}
                onChange={(id, name) => handleUpdatePalette('primary', id, name)}
                required
              />
              <PaletteSelector
                label="Secondary"
                value={activeBrand.colors.secondary.paletteId}
                paletteName={activeBrand.colors.secondary.paletteName}
                onChange={(id, name) => handleUpdatePalette('secondary', id, name)}
                required
              />
              <PaletteSelector
                label="Sparkle"
                value={activeBrand.colors.sparkle.paletteId}
                paletteName={activeBrand.colors.sparkle.paletteName}
                onChange={(id, name) => handleUpdatePalette('sparkle', id, name)}
                required
              />
              <PaletteSelector
                label="Neutral"
                value={activeBrand.colors.neutral.paletteId}
                paletteName={activeBrand.colors.neutral.paletteName}
                onChange={(id, name) => handleUpdatePalette('neutral', id, name)}
                required
              />
            </div>
          </div>

          {/* Semantic Colors */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Semantic Colors
            </h3>
            <div className="space-y-4">
              <PaletteSelector
                label="Positive (Success)"
                value={activeBrand.colors.semantic.positive.paletteId}
                paletteName={activeBrand.colors.semantic.positive.paletteName}
                onChange={(id, name) => handleUpdateSemantic('positive', id, name)}
              />
              <PaletteSelector
                label="Negative (Error)"
                value={activeBrand.colors.semantic.negative.paletteId}
                paletteName={activeBrand.colors.semantic.negative.paletteName}
                onChange={(id, name) => handleUpdateSemantic('negative', id, name)}
              />
              <PaletteSelector
                label="Warning"
                value={activeBrand.colors.semantic.warning.paletteId}
                paletteName={activeBrand.colors.semantic.warning.paletteName}
                onChange={(id, name) => handleUpdateSemantic('warning', id, name)}
              />
              <PaletteSelector
                label="Informative"
                value={activeBrand.colors.semantic.informative.paletteId}
                paletteName={activeBrand.colors.semantic.informative.paletteName}
                onChange={(id, name) => handleUpdateSemantic('informative', id, name)}
              />
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Created: {new Date(activeBrand.createdAt).toLocaleString()}</div>
            <div>Updated: {new Date(activeBrand.updatedAt).toLocaleString()}</div>
            {activeBrand.syncedAt && (
              <div>Last Synced: {new Date(activeBrand.syncedAt).toLocaleString()}</div>
            )}
            <div>Version: {activeBrand.version}</div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
