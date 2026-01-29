/**
 * Validation Panel
 * Shows validation status and rules for the active brand
 */

import React from 'react';
import { useBrandStore } from '@/store/brand-store';
import { BrandGenerator } from '@/lib/brand-generator';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ValidationPanel() {
  const activeBrand = useBrandStore((state) => state.getActiveBrand());

  if (!activeBrand) {
    return null;
  }

  const validation = BrandGenerator.validate(activeBrand);
  const preview = BrandGenerator.previewBrand(activeBrand);

  return (
    <div className="border-t border-border bg-card">
      <div className="p-4 space-y-4">
        {/* Status Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Validation Status</h3>
          {validation.valid ? (
            <div className="flex items-center gap-1 text-green-500">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Valid</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Invalid</span>
            </div>
          )}
        </div>

        {/* Preview Stats */}
        <div className="bg-surface-elevated rounded-lg p-3 space-y-2">
          <div className="text-xs text-foreground-secondary">
            <span className="font-medium">Variables:</span>{' '}
            <span className="text-foreground font-semibold">{preview.variableCount}</span>
          </div>
          <div className="text-xs text-foreground-secondary">
            <span className="font-medium">Palettes Used:</span>{' '}
            <span className="text-foreground">{preview.palettesUsed.length}</span>
          </div>
          {preview.missingPalettes.length > 0 && (
            <div className="text-xs text-orange-500">
              <span className="font-medium">Missing:</span>{' '}
              {preview.missingPalettes.join(', ')}
            </div>
          )}
        </div>

        {/* Errors */}
        {validation.errors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-semibold">
                Errors ({validation.errors.length})
              </span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {validation.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-red-400 bg-surface-elevated border-l-2 border-l-red-500 rounded px-2 py-1"
                  >
                    {error}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Warnings */}
        {validation.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-orange-500">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-semibold">
                Warnings ({validation.warnings.length})
              </span>
            </div>
            <ScrollArea className="max-h-32">
              <div className="space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-orange-400 bg-surface-elevated border-l-2 border-l-orange-500 rounded px-2 py-1"
                  >
                    {warning}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Info */}
        {validation.info.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-foreground-tertiary">
              <Info className="w-4 h-4" />
              <span className="text-xs font-semibold">Info</span>
            </div>
            <div className="space-y-1">
              {validation.info.map((info, idx) => (
                <div
                  key={idx}
                  className="text-xs text-foreground-secondary bg-surface-elevated border-l-2 border-l-border-strong rounded px-2 py-1"
                >
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
