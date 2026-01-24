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
      <div className="h-full flex items-center justify-center text-gray-500 text-sm p-4">
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Statistics</h2>
          <p className="text-sm text-gray-500">Overview of {activeBrand.name}</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-900">Variables</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {preview.variableCount}
            </div>
            <div className="text-xs text-blue-700 mt-1">
              8 scales × 24 steps × {Math.ceil(preview.variableCount / 192)} contexts
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-900">Palettes</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {configuredPalettes} / 8
            </div>
            <div className="text-xs text-purple-700 mt-1">
              {preview.palettesUsed.length} unique palettes used
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-900">Collections</span>
            </div>
            <div className="text-2xl font-bold text-green-900">1</div>
            <div className="text-xs text-green-700 mt-1">9 Theme collection</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-900">Status</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {validation.valid ? '✓' : '✗'}
            </div>
            <div className="text-xs text-orange-700 mt-1">
              {validation.errors.length} errors, {validation.warnings.length} warnings
            </div>
          </div>
        </div>

        {/* Palettes Used */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Palettes Used</h3>
          {preview.palettesUsed.length > 0 ? (
            <div className="space-y-1">
              {preview.palettesUsed.map((paletteName) => (
                <div
                  key={paletteName}
                  className="text-xs bg-gray-50 rounded px-2 py-1.5 text-gray-700"
                >
                  {paletteName}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500">No palettes configured</div>
          )}
        </div>

        {/* Missing Palettes */}
        {preview.missingPalettes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Missing Palette Assignments
            </h3>
            <div className="space-y-1">
              {preview.missingPalettes.map((role) => (
                <div
                  key={role}
                  className="text-xs bg-orange-50 rounded px-2 py-1.5 text-orange-700"
                >
                  {role}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scale Breakdown */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Scale Breakdown</h3>
          <div className="space-y-1 text-xs text-gray-600">
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
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Metadata</h3>
          <div className="space-y-1 text-xs text-gray-600">
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
