/**
 * Brand Statistics Panel
 * Displays statistics and metadata about the generated brand
 */

import React from 'react';
import { useBrandStore } from '@/store/brand-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart3, Palette, Package, AlertCircle } from 'lucide-react';

export function BrandStatsPanel() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());

  if (!activeBrand) {
    return (
      <div className="h-full flex items-center justify-center text-foreground-secondary text-sm p-4">
        Select a brand to view statistics
      </div>
    );
  }

  const preview = BrandGenerator.previewBrand(activeBrand);
  const validation = BrandGenerator.validate(activeBrand);

  // Count configured palettes
  const configuredPalettes = [
    activeBrand.colors.primary,
    activeBrand.colors.secondary,
    activeBrand.colors.sparkle,
    activeBrand.colors.neutral,
    activeBrand.colors.semantic.positive,
    activeBrand.colors.semantic.negative,
    activeBrand.colors.semantic.warning,
    activeBrand.colors.semantic.informative
  ].filter((p) => p.paletteId).length;

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Statistics</h2>
          <p className="text-sm text-foreground-secondary">Overview of {activeBrand.name}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-elevated border-l-4 border-l-border-strong rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-foreground-tertiary" />
              <span className="text-xs font-medium text-foreground">Variables</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {preview.variableCount}
            </div>
            <div className="text-xs text-foreground-secondary mt-1">
              8 scales × 24 steps × {Math.ceil(preview.variableCount / 192)} contexts
            </div>
          </div>

          <div className="bg-surface-elevated border-l-4 border-l-purple-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-medium text-foreground">Palettes</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {configuredPalettes} / 8
            </div>
            <div className="text-xs text-foreground-secondary mt-1">
              {preview.palettesUsed.length} unique palettes used
            </div>
          </div>

          <div className="bg-surface-elevated border-l-4 border-l-green-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-foreground">Collections</span>
            </div>
            <div className="text-2xl font-bold text-foreground">1</div>
            <div className="text-xs text-foreground-secondary mt-1">9 Theme collection</div>
          </div>

          <div className="bg-surface-elevated border-l-4 border-l-orange-500 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-medium text-foreground">Status</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {validation.valid ? '✓' : '✗'}
            </div>
            <div className="text-xs text-foreground-secondary mt-1">
              {validation.errors.length} errors, {validation.warnings.length} warnings
            </div>
          </div>
        </div>

        {/* Palettes Used */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Palettes Used</h3>
          {preview.palettesUsed.length > 0 ? (
            <div className="space-y-1">
              {preview.palettesUsed.map((paletteName) => (
                <div
                  key={paletteName}
                  className="text-xs bg-surface-elevated rounded px-2 py-1.5 text-foreground"
                >
                  {paletteName}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-foreground-secondary">No palettes configured</div>
          )}
        </div>

        {/* Missing Palettes */}
        {preview.missingPalettes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Missing Palette Assignments
            </h3>
            <div className="space-y-1">
              {preview.missingPalettes.map((role) => (
                <div
                  key={role}
                  className="text-xs bg-surface-elevated border-l-2 border-l-orange-500 rounded px-2 py-1.5 text-orange-400"
                >
                  {role}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scale Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Scale Breakdown</h3>
          <div className="space-y-1 text-xs text-foreground-secondary">
            <div className="flex justify-between py-1">
              <span>Surface</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>High</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Medium</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Low</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Heavy</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Bold</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Bold A11Y</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Minimal</span>
              <span className="font-medium">{preview.variableCount / 8}</span>
            </div>
          </div>
        </div>

        {/* Brand Metadata */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Metadata</h3>
          <div className="space-y-1 text-xs text-foreground-secondary">
            <div className="flex justify-between py-1">
              <span>Version</span>
              <span className="font-medium">{activeBrand.version}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Created</span>
              <span className="font-medium">
                {new Date(activeBrand.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Last Updated</span>
              <span className="font-medium">
                {new Date(activeBrand.updatedAt).toLocaleDateString()}
              </span>
            </div>
            {activeBrand.syncedAt && (
              <div className="flex justify-between py-1">
                <span>Last Synced</span>
                <span className="font-medium">
                  {new Date(activeBrand.syncedAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
