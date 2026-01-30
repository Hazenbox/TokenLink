/**
 * Import Results Component
 * Displays import results with statistics, errors, and warnings
 */

import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportResult } from '@/models/export-types';

export interface ImportResultsProps {
  isOpen: boolean;
  result: ImportResult | null;
  onClose: () => void;
}

export function ImportResults({ isOpen, result, onClose }: ImportResultsProps) {
  if (!isOpen || !result) return null;

  const { success, stats, errors, warnings } = result;
  
  const totalCreated =
    stats.brandsCreated + stats.palettesCreated + (stats.rulesCreated || 0);
  const totalUpdated = stats.brandsUpdated + stats.palettesUpdated;
  const totalSkipped = stats.brandsSkipped + stats.palettesSkipped;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg">
        <div className="bg-background border border-border rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              {success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <h2 className="text-lg font-semibold text-foreground">
                {success ? 'Import Successful' : 'Import Failed'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-foreground-secondary hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Success Summary */}
            {success && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-600 mb-2">
                      Import completed successfully!
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-600">
                      {totalCreated > 0 && (
                        <div>
                          <span className="font-medium">{totalCreated}</span> created
                        </div>
                      )}
                      {totalUpdated > 0 && (
                        <div>
                          <span className="font-medium">{totalUpdated}</span> updated
                        </div>
                      )}
                      {totalSkipped > 0 && (
                        <div>
                          <span className="font-medium">{totalSkipped}</span> skipped
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Statistics */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-foreground">Details</h3>
              
              {/* Brands */}
              {(stats.brandsCreated > 0 || stats.brandsUpdated > 0 || stats.brandsSkipped > 0) && (
                <div className="p-3 bg-card border border-border rounded-md">
                  <p className="text-sm font-medium text-foreground mb-2">Brands</p>
                  <div className="space-y-1 text-sm text-foreground-secondary">
                    {stats.brandsCreated > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Created</span>
                        <span className="font-medium text-green-600">{stats.brandsCreated}</span>
                      </div>
                    )}
                    {stats.brandsUpdated > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Updated</span>
                        <span className="font-medium text-blue-600">{stats.brandsUpdated}</span>
                      </div>
                    )}
                    {stats.brandsSkipped > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Skipped</span>
                        <span className="font-medium text-yellow-600">{stats.brandsSkipped}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Palettes */}
              {(stats.palettesCreated > 0 || stats.palettesUpdated > 0 || stats.palettesSkipped > 0) && (
                <div className="p-3 bg-card border border-border rounded-md">
                  <p className="text-sm font-medium text-foreground mb-2">Palettes</p>
                  <div className="space-y-1 text-sm text-foreground-secondary">
                    {stats.palettesCreated > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Created</span>
                        <span className="font-medium text-green-600">{stats.palettesCreated}</span>
                      </div>
                    )}
                    {stats.palettesUpdated > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Updated</span>
                        <span className="font-medium text-blue-600">{stats.palettesUpdated}</span>
                      </div>
                    )}
                    {stats.palettesSkipped > 0 && (
                      <div className="flex items-center justify-between">
                        <span>Skipped</span>
                        <span className="font-medium text-yellow-600">{stats.palettesSkipped}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Layer Mappings */}
              {stats.mappingsUpdated && (
                <div className="p-3 bg-card border border-border rounded-md">
                  <p className="text-sm font-medium text-foreground mb-2">Layer Mappings</p>
                  <div className="text-sm text-foreground-secondary">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Configuration updated</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Warnings */}
            {warnings.length > 0 && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-600 mb-2">
                      Warnings ({warnings.length})
                    </p>
                    <ul className="text-sm text-yellow-600 space-y-1 max-h-32 overflow-y-auto">
                      {warnings.map((warning, index) => (
                        <li key={index} className="text-xs">• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600 mb-2">
                      Errors ({errors.length})
                    </p>
                    <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                      {errors.map((error, index) => (
                        <li key={index} className="text-xs">• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            {success && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-600">
                    <p className="font-medium mb-1">Next steps:</p>
                    <ul className="space-y-0.5 ml-3 list-disc">
                      <li>Review imported brands in the Automate tab</li>
                      <li>Sync brands to Figma to create variables</li>
                      <li>Check imported palettes in the Color tab</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border">
            <Button size="sm" onClick={onClose}>
              {success ? 'Done' : 'Close'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
